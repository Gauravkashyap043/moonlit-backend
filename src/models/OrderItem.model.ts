import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem extends Document {
  orderId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variantId?: string;
  productName: string;
  variantName?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  image?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    variantId: String,
    productName: {
      type: String,
      required: true,
    },
    variantName: String,
    sku: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    image: String,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

OrderItemSchema.index({ orderId: 1, isDeleted: 1 });
OrderItemSchema.index({ storeId: 1, productId: 1, isDeleted: 1 });

export const OrderItem = mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);

