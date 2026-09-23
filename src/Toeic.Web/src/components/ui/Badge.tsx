import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'beta'
  | 'validated';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children, className, ...props }: BadgeProps) {
  const classNames = [styles.badge, styles[variant], className || ''].filter(Boolean).join(' ');

  return (
    <span className={classNames} {...props}>
      {variant === 'beta' && <span className={styles.prefix}>[BETA]</span>}
      {variant === 'validated' && <span className={styles.prefix}>[DATA-VALIDATED]</span>}
      <span>{children}</span>
    </span>
  );
}

/**
 * Component chuyên dụng cho Tier đề thi, tuân thủ UI_GUIDE.md
 */
export function TierBadge({ tier }: { tier: 'BetaPractice' | 'DataValidatedPractice' | string }) {
  if (tier === 'DataValidatedPractice') {
    return <Badge variant="validated">Dữ liệu đã kiểm định</Badge>;
  }
  return <Badge variant="beta">Luyện tập Beta (AI Item Factory)</Badge>;
}
