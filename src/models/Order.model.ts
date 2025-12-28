import mongoose, { Schema, Document } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  UPI = 'upi',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
  COD = 'cod',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export interface IShippingAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

export interface IOrder extends Document {
  storeId: mongoose.Types.ObjectId;
  orderNumber: string;
  customerId?: mongoose.Types.ObjectId;
  customerEmail: string;
  customerPhone?: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  commission: number;
  sellerAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: mongoose.Types.ObjectId;
  shippingAddress: IShippingAddress;
  trackingNumber?: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  notes?: string;
  cancelledAt?: Date;
  cancelledReason?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    customerPhone: String,
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      length: 3,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    shippingAddress: {
      name: { type: String, required: true },
      phone: { type: String, required: true },
      email: String,
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    trackingNumber: String,
    shippedAt: Date,
    deliveredAt: Date,
    notes: String,
    cancelledAt: Date,
    cancelledReason: String,
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

OrderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

OrderSchema.index({ storeId: 1, orderNumber: 1 });
OrderSchema.index({ storeId: 1, status: 1, isDeleted: 1 });
OrderSchema.index({ storeId: 1, customerId: 1, isDeleted: 1 });
OrderSchema.index({ storeId: 1, customerEmail: 1, isDeleted: 1 });
OrderSchema.index({ storeId: 1, createdAt: -1, isDeleted: 1 });
OrderSchema.index({ paymentId: 1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

