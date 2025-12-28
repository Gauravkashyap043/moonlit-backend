import mongoose, { Schema, Document } from 'mongoose';

export enum LedgerEntryType {
  ORDER_PAYMENT = 'order_payment',
  COMMISSION = 'commission',
  PAYOUT = 'payout',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment',
}

export enum LedgerEntryStatus {
  PENDING = 'pending',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
}

export interface ILedgerEntry extends Document {
  storeId: mongoose.Types.ObjectId;
  entryType: LedgerEntryType;
  status: LedgerEntryStatus;
  amount: number;
  currency: string;
  orderId?: mongoose.Types.ObjectId;
  paymentId?: mongoose.Types.ObjectId;
  payoutId?: mongoose.Types.ObjectId;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: Record<string, any>;
  settledAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LedgerEntrySchema = new Schema<ILedgerEntry>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    entryType: {
      type: String,
      enum: Object.values(LedgerEntryType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(LedgerEntryStatus),
      default: LedgerEntryStatus.PENDING,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      length: 3,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    payoutId: {
      type: Schema.Types.ObjectId,
      ref: 'Payout',
    },
    balanceBefore: {
      type: Number,
      required: true,
    },
    balanceAfter: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    metadata: Schema.Types.Mixed,
    settledAt: Date,
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

LedgerEntrySchema.index({ storeId: 1, entryType: 1, isDeleted: 1 });
LedgerEntrySchema.index({ storeId: 1, createdAt: -1, isDeleted: 1 });
LedgerEntrySchema.index({ storeId: 1, status: 1, isDeleted: 1 });
LedgerEntrySchema.index({ orderId: 1 });
LedgerEntrySchema.index({ paymentId: 1 });
LedgerEntrySchema.index({ payoutId: 1 });

export const LedgerEntry = mongoose.model<ILedgerEntry>('LedgerEntry', LedgerEntrySchema);

