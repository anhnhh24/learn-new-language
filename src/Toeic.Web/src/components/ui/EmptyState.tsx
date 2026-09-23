import React from 'react';
import { Inbox } from 'lucide-react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = <Inbox size={36} />,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.iconContainer}>{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.description}>{description}</p>
      {action && <div className={styles.actionContainer}>{action}</div>}
    </div>
  );
}
