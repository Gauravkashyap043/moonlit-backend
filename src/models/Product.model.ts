import mongoose, { Schema, Document } from 'mongoose';

export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  OUT_OF_STOCK = 'out_of_stock',
  ARCHIVED = 'archived',
}

export interface IProductVariant {
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  cost: number;
  inventory: number;
  weight?: number;
  barcode?: string;
}

export interface IProductImage {
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface IProduct extends Document {
  storeId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  slug: string;
  sku?: string;
  status: ProductStatus;
  type: string;
  category?: mongoose.Types.ObjectId;
  tags: string[];
  images: IProductImage[];
  variants: IProductVariant[];
  metaTitle?: string;
  metaDescription?: string;
  requiresShipping: boolean;
  weight?: number;
  taxable: boolean;
  taxCode?: string;
  trackInventory: boolean;
  allowBackorder: boolean;
  viewCount: number;
  salesCount: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 5000,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    sku: String,
    status: {
      type: String,
      enum: Object.values(ProductStatus),
      default: ProductStatus.DRAFT,
      index: true,
    },
    type: {
      type: String,
      enum: ['physical', 'digital', 'service'],
      default: 'physical',
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    tags: [String],
    images: [
      {
        url: { type: String, required: true },
        alt: String,
        isPrimary: { type: Boolean, default: false },
      },
    ],
    variants: [
      {
        name: { type: String, required: true },
        sku: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        compareAtPrice: { type: Number, min: 0 },
        cost: { type: Number, required: true, min: 0 },
        inventory: { type: Number, default: 0, min: 0 },
        weight: Number,
        barcode: String,
      },
    ],
    metaTitle: String,
    metaDescription: String,
    requiresShipping: {
      type: Boolean,
      default: true,
    },
    weight: Number,
    taxable: {
      type: Boolean,
      default: true,
    },
    taxCode: String,
    trackInventory: {
      type: Boolean,
      default: true,
    },
    allowBackorder: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    salesCount: {
      type: Number,
      default: 0,
    },
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

ProductSchema.index({ storeId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ storeId: 1, status: 1, isDeleted: 1 });
ProductSchema.index({ storeId: 1, category: 1, isDeleted: 1 });
ProductSchema.index({ storeId: 1, tags: 1, isDeleted: 1 });
ProductSchema.index({ 'variants.sku': 1, storeId: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

