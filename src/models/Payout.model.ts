import mongoose, { Schema, Document } from 'mongoose';

export enum PayoutStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'bank_transfer',
  UPI = 'upi',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
}

export interface IPayout extends Document {
  storeId: mongoose.Types.ObjectId;
  payoutNumber: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method: PayoutMethod;
  settlementDate: Date;
  processedAt?: Date;
  accountDetails: {
    accountHolderName: string;
    accountNumber?: string;
    ifscCode?: string;
    bankName?: string;
    upiId?: string;
    paypalEmail?: string;
    [key: string]: any;
  };
  orderIds: mongoose.Types.ObjectId[];
  transactionId?: string;
  failureReason?: string;
  notes?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    payoutNumber: {
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
      enum: Object.values(PayoutStatus),
      default: PayoutStatus.PENDING,
      index: true,
    },
    method: {
      type: String,
      enum: Object.values(PayoutMethod),
      required: true,
    },
    settlementDate: {
      type: Date,
      required: true,
      index: true,
    },
    processedAt: Date,
    accountDetails: {
      accountHolderName: { type: String, required: true },
      accountNumber: String,
      ifscCode: String,
      bankName: String,
      upiId: String,
      paypalEmail: String,
    },
    orderIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    transactionId: String,
    failureReason: String,
    notes: String,
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

PayoutSchema.pre('save', async function (next) {
  if (this.isNew && !this.payoutNumber) {
    const count = await mongoose.model('Payout').countDocuments();
    this.payoutNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

PayoutSchema.index({ storeId: 1, status: 1, isDeleted: 1 });
PayoutSchema.index({ storeId: 1, settlementDate: 1, isDeleted: 1 });
PayoutSchema.index({ storeId: 1, createdAt: -1, isDeleted: 1 });
PayoutSchema.index({ status: 1, settlementDate: 1 });

export const Payout = mongoose.model<IPayout>('Payout', PayoutSchema);

