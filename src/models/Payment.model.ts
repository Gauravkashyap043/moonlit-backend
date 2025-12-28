import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export enum PaymentGateway {
  STRIPE = 'stripe',
  RAZORPAY = 'razorpay',
  PAYPAL = 'paypal',
  CUSTOM = 'custom',
}

export interface IPayment extends Document {
  storeId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  paymentNumber: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  failureReason?: string;
  refundedAmount: number;
  refundedAt?: Date;
  metadata?: Record<string, any>;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      length: 3,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    gateway: {
      type: String,
      enum: Object.values(PaymentGateway),
      required: true,
    },
    gatewayTransactionId: {
      type: String,
      index: true,
    },
    gatewayResponse: Schema.Types.Mixed,
    failureReason: String,
    refundedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundedAt: Date,
    metadata: Schema.Types.Mixed,
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

PaymentSchema.pre('save', async function (next) {
  if (this.isNew && !this.paymentNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    this.paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

PaymentSchema.index({ storeId: 1, orderId: 1 });
PaymentSchema.index({ storeId: 1, status: 1, isDeleted: 1 });
PaymentSchema.index({ storeId: 1, createdAt: -1, isDeleted: 1 });
PaymentSchema.index({ gatewayTransactionId: 1 });

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);

