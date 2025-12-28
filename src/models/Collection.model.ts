import mongoose, { Schema, Document } from 'mongoose';

export interface ICollection extends Document {
  storeId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  banner?: string;
  isActive: boolean;
  sortOrder: number;
  productIds: mongoose.Types.ObjectId[];
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    image: String,
    banner: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    productIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
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

CollectionSchema.index({ storeId: 1, slug: 1 }, { unique: true });
CollectionSchema.index({ storeId: 1, isActive: 1, isDeleted: 1 });
CollectionSchema.index({ storeId: 1, sortOrder: 1, isDeleted: 1 });

export const Collection = mongoose.model<ICollection>('Collection', CollectionSchema);

