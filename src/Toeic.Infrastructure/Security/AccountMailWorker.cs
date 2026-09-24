using System.Net;
using System.Net.Mail;
using System.Text.Json;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Toeic.Infrastructure.Persistence;

namespace Toeic.Infrastructure.Security;

public sealed class AccountMailWorker(IDbConnectionFactory connections,
    IDataProtectionProvider protection, AccountMailOptions options,
    TimeProvider clock, ILogger<AccountMailWorker> logger) : BackgroundService
{
    private readonly IDataProtector protector = protection.CreateProtector("Toeic.AccountMail.v1");

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (await DeliverOneAsync(stoppingToken)) continue;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
            catch (Exception)
            {
                // Never log recipient, token, SMTP credentials or protected payload.
                logger.LogError("Account mail worker failed. Code: ACCOUNT_MAIL_WORKER_FAILURE");
            }
            try { await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken); }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { break; }
        }
    }

    private async Task<bool> DeliverOneAsync(CancellationToken ct)
    {
        var now = clock.GetUtcNow();
        var lease = Guid.NewGuid();
        Guid id;
        string payload;
        int attempts;
        await using (var db = await connections.OpenAsync(ct))
        {
            await using var expire = db.Query("""
                update identity_data.account_mail_outbox
                set protected_payload = null, failed_at = @now, last_error_code = 'EXPIRED'
                where expires_at <= @now and delivered_at is null and failed_at is null;
                """, null, ("now", now));
            await expire.ExecuteNonQueryAsync(ct);
            await using var claim = db.Query("""
                with next as (
                    select m.id from identity_data.account_mail_outbox m
                    join identity_data.account_tokens t on t.id = m.token_id
                    where m.delivered_at is null and m.failed_at is null and m.protected_payload is not null
                      and m.next_attempt_at <= @now and m.expires_at > @now
                      and (m.lease_until is null or m.lease_until < @now)
                      and t.consumed_at is null and t.expires_at > @now
                    order by m.created_at for update of m skip locked limit 1
                )
                update identity_data.account_mail_outbox m
                set lease_id = @lease, lease_until = @until, attempts = attempts + 1
                from next where m.id = next.id returning m.id,m.protected_payload,m.attempts;
                """, null, ("now", now), ("lease", lease), ("until", now.AddMinutes(2)));
            await using var reader = await claim.ExecuteReaderAsync(ct);
            if (!await reader.ReadAsync(ct)) return false;
            id = reader.GetGuid(0);
            payload = reader.GetString(1);
            attempts = reader.GetInt32(2);
        }

        var succeeded = false;
        try
        {
            var mail = JsonSerializer.Deserialize<AccountMail>(protector.Unprotect(payload))
                ?? throw new InvalidOperationException("Invalid mail payload.");
            var path = mail.Purpose == "VerifyEmail" ? "verify-email" : "reset-password";
            // Fragment keeps the token out of server access logs and Referer headers.
            var link = options.PublicWebUrl.TrimEnd('/') + "/auth/" + path + "#token=" + mail.Token;
            var subject = mail.Purpose == "VerifyEmail" ? "Xác minh email TOEIC" : "Đặt lại mật khẩu TOEIC";
            var body = "Bạn đã yêu cầu thao tác tài khoản TOEIC. Mở liên kết để tiếp tục:\n\n" +
                link + "\n\nNếu bạn không yêu cầu thao tác này, hãy bỏ qua email. Không chia sẻ liên kết.";
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(25));
            if (options.Mode == "DevelopmentFile")
            {
                Directory.CreateDirectory(options.DevelopmentDirectory!);
                await File.WriteAllTextAsync(Path.Combine(options.DevelopmentDirectory!, id + ".eml"),
                    "To: " + mail.Email + "\nSubject: " + subject + "\n\n" + body, timeout.Token);
            }
            else
            {
                using var smtp = new SmtpClient(options.SmtpHost, options.SmtpPort)
                {
                    EnableSsl = true,
                    UseDefaultCredentials = false,
                    Credentials = string.IsNullOrWhiteSpace(options.SmtpUser) ? null :
                        new NetworkCredential(options.SmtpUser, options.SmtpPassword)
                };
                using var message = new MailMessage(options.From, mail.Email, subject, body);
                await smtp.SendMailAsync(message, timeout.Token);
            }
            succeeded = true;
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested) { throw; }
        catch (Exception)
        {
            logger.LogWarning("Account mail delivery failed for message {MessageId}, attempt {Attempt}.", id, attempts);
        }
        await using var finishDb = await connections.OpenAsync(ct);
        await using var finish = finishDb.Query(succeeded ? """
            update identity_data.account_mail_outbox
            set delivered_at = @now, protected_payload = null, lease_id = null, lease_until = null
            where id = @id and lease_id = @lease;
            """ : """
            update identity_data.account_mail_outbox
            set next_attempt_at = @retry, lease_id = null, lease_until = null,
                failed_at = case when attempts >= 5 then @now else failed_at end,
                protected_payload = case when attempts >= 5 then null else protected_payload end,
                last_error_code = 'DELIVERY_FAILED'
            where id = @id and lease_id = @lease;
            """, null, ("now", clock.GetUtcNow()), ("retry", clock.GetUtcNow().AddSeconds(30 * attempts)),
            ("id", id), ("lease", lease));
        await finish.ExecuteNonQueryAsync(ct);
        return true;
    }
}
