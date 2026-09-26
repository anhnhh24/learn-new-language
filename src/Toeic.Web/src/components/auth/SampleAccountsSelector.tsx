import { useState } from 'react';
import { Sparkles, Check, ArrowRight } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { SAMPLE_ACCOUNTS, SAMPLE_PASSWORD, SampleAccount } from '../../lib/sampleAccounts';
import s from './SampleAccountsSelector.module.css';

interface SampleAccountsSelectorProps {
  onFillCredentials: (email: string, pass: string) => void;
  onDirectLogin: (account: SampleAccount) => void;
  defaultScope?: 'all' | 'learner' | 'admin';
}

export function SampleAccountsSelector({
  onFillCredentials,
  onDirectLogin,
  defaultScope = 'all',
}: SampleAccountsSelectorProps) {
  const [filter, setFilter] = useState<'all' | 'learner' | 'admin'>(defaultScope);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const filteredAccounts = SAMPLE_ACCOUNTS.filter((acc) => {
    if (filter === 'all') return true;
    return acc.scope === filter;
  });

  const handleCopy = (email: string) => {
    navigator.clipboard?.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  };

  return (
    <section className={s.container} aria-label="Tài khoản mẫu theo vai trò">
      <div className={s.header}>
        <div className={s.titleArea}>
          <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
          <h2 className={s.title}>Tài khoản mẫu theo từng vai trò</h2>
        </div>
        <Badge variant="primary">Demo & Testing</Badge>
      </div>

      <div className={s.filterTabs} role="tablist">
        <button
          type="button"
          className={`${s.tabBtn} ${filter === 'all' ? s.tabBtnActive : ''}`}
          onClick={() => setFilter('all')}
        >
          Tất cả ({SAMPLE_ACCOUNTS.length})
        </button>
        <button
          type="button"
          className={`${s.tabBtn} ${filter === 'learner' ? s.tabBtnActive : ''}`}
          onClick={() => setFilter('learner')}
        >
          🎓 Học viên (2)
        </button>
        <button
          type="button"
          className={`${s.tabBtn} ${filter === 'admin' ? s.tabBtnActive : ''}`}
          onClick={() => setFilter('admin')}
        >
          🛡️ Quản trị & GV (4)
        </button>
      </div>

      <div className={s.accountList}>
        {filteredAccounts.map((account) => (
          <div key={account.id} className={s.accountCard}>
            <div className={s.cardTop}>
              <span className={s.roleName}>{account.roleName}</span>
              <Badge variant={account.badgeVariant}>{account.roleBadge}</Badge>
            </div>

            <div className={s.accountDesc}>{account.description}</div>

            <div className={s.accountDetails}>
              <span className={s.emailText} title="Email đăng nhập">
                {account.email}
              </span>
              <span className={s.passText}>
                {copiedEmail === account.email ? (
                  <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Check size={12} /> Đã sao chép
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCopy(account.email)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}
                  >
                    {account.password}
                  </button>
                )}
              </span>
            </div>

            <div className={s.cardActions}>
              <button
                type="button"
                className={s.fillBtn}
                onClick={() => onFillCredentials(account.email, account.password)}
              >
                Điền vào form
              </button>
              <button
                type="button"
                className={s.loginNowBtn}
                onClick={() => onDirectLogin(account)}
              >
                Đăng nhập ngay <ArrowRight size={12} style={{ display: 'inline', marginLeft: 2 }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className={s.commonPassNote}>
        Mật khẩu chung cho mọi tài khoản mẫu: <strong>{SAMPLE_PASSWORD}</strong>
      </div>
    </section>
  );
}
