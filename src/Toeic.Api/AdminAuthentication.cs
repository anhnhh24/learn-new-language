using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Toeic.Application;

namespace Toeic.Api;

public sealed class AdminAuthentication(IOptionsMonitor<AuthenticationSchemeOptions> options, ILoggerFactory logger,
    UrlEncoder encoder, IAdminSessions sessions) : AuthenticationHandler<AuthenticationSchemeOptions>(options,logger,encoder)
{
    public const string SchemeName="AdminSession";
    public const string PolicyName="AdminOnly";
    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var header=Request.Headers.Authorization.ToString();
        if(!header.StartsWith("Bearer ",StringComparison.OrdinalIgnoreCase)) return AuthenticateResult.NoResult();
        var identity=await sessions.AuthenticateAsync(header[7..],Context.RequestAborted);
        if(identity is null) return AuthenticateResult.Fail("Invalid admin session.");
        var claims=new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier,identity.UserId.ToString()),
            new Claim(ClaimTypes.Name,identity.DisplayName),new Claim(ClaimTypes.Role,"Admin"),
            new Claim("admin_session_id",identity.SessionId.ToString())],SchemeName);
        return AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(claims),SchemeName));
    }
    protected override Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        Response.StatusCode=401; Response.Headers.WWWAuthenticate="Bearer"; Response.Headers.CacheControl="no-store";
        return Response.WriteAsJsonAsync(new {code="ADMIN_AUTHENTICATION_REQUIRED",message="Vui lòng đăng nhập quản trị."});
    }
}
