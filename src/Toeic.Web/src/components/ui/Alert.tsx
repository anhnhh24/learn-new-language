import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import styles from './Alert.module.css';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function Alert({ variant = 'info', title, children, action }: AlertProps) {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'danger':
        return <AlertCircle size={18} />;
      case 'info':
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className={`${styles.alert} ${styles[variant]}`} role="alert">
      <div className={styles.iconWrapper}>{getIcon()}</div>
      <div className={styles.content}>
        {title && <h4 className={styles.title}>{title}</h4>}
        <div className={styles.message}>{children}</div>
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
