export type PaymentStatus = 
  | 'PendingPayment'
  | 'Processing'
  | 'Paid'
  | 'PaymentReview'
  | 'Failed'
  | 'Expired'
  | 'RefundRequested'
  | 'RefundPending'
  | 'Refunded'
  | 'RefundFailed';

export type PaymentMethod = 'VietQR' | 'NapasBankTransfer' | 'CreditCard' | 'Momo';

export interface ProductPlan {
  id: string;
  courseId: string;
  name: string;
  priceVnd: number;
  originalPriceVnd?: number;
  durationDays: number;
  description: string;
  features: string[];
  refundPolicySummary: string;
}

export interface OrderSnapshot {
  orderId: string;
  orderNumber: string;
  productPlanId: string;
  courseId: string;
  courseTitle: string;
  amountVnd: number;
  currency: 'VND';
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  expiresAt: string; // 30 mins deadline
  paidAt?: string;
  entitlementId?: string;
  qrCodeUrl?: string;
  bankAccountInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    transferSyntax: string;
  };
  refundReason?: string;
  refundRequestedAt?: string;
  refundCompletedAt?: string;
}

export interface EntitlementItem {
  id: string;
  courseId: string;
  courseTitle: string;
  orderId: string;
  grantedAt: string;
  expiresAt: string;
  isActive: boolean;
  daysRemaining: number;
  sourceType: 'PaidOrder' | 'TrialGrant' | 'AdminGrant';
}
