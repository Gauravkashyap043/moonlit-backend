import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  storeId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  parentId?: mongoose.Types.ObjectId;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
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
    description: String,
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    image: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
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

CategorySchema.index({ storeId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ storeId: 1, parentId: 1, isDeleted: 1 });
CategorySchema.index({ storeId: 1, isActive: 1, isDeleted: 1 });

export const Category = mongoose.model<ICategory>('Category', CategorySchema);

