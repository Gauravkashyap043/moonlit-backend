import mongoose, { Schema, Document } from 'mongoose';

export enum StoreStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending',
}

export enum StorePlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface IDomainConfig {
  subdomain: string;
  customDomain?: string;
  customDomainVerified: boolean;
  sslEnabled: boolean;
  sslCertificate?: string;
}

export interface IStore extends Document {
  name: string;
  slug: string;
  ownerId: mongoose.Types.ObjectId;
  description?: string;
  logo?: string;
  banner?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  domainConfig: IDomainConfig;
  status: StoreStatus;
  plan: StorePlan;
  commissionRate: number;
  payoutDelayDays: number;
  currency: string;
  timezone: string;
  settings: {
    allowCod: boolean;
    allowGuestCheckout: boolean;
    requireEmailVerification: boolean;
    themeId?: mongoose.Types.ObjectId;
    [key: string]: any;
  };
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: (v: string) => /^[a-z0-9-]+$/.test(v),
        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
      },
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    logo: String,
    banner: String,
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      validate: {
        validator: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Invalid email format',
      },
    },
    contactPhone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    domainConfig: {
      subdomain: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      customDomain: {
        type: String,
        lowercase: true,
        trim: true,
      },
      customDomainVerified: {
        type: Boolean,
        default: false,
      },
      sslEnabled: {
        type: Boolean,
        default: false,
      },
      sslCertificate: String,
    },
    status: {
      type: String,
      enum: Object.values(StoreStatus),
      default: StoreStatus.PENDING,
      index: true,
    },
    plan: {
      type: String,
      enum: Object.values(StorePlan),
      default: StorePlan.FREE,
    },
    commissionRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 5,
    },
    payoutDelayDays: {
      type: Number,
      required: true,
      min: 0,
      max: 7,
      default: 1,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      uppercase: true,
      length: 3,
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    settings: {
      type: Schema.Types.Mixed,
      default: {
        allowCod: false,
        allowGuestCheckout: true,
        requireEmailVerification: false,
      },
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

StoreSchema.index({ slug: 1, isDeleted: 1 });
StoreSchema.index({ ownerId: 1, isDeleted: 1 });
StoreSchema.index({ 'domainConfig.subdomain': 1, isDeleted: 1 });
StoreSchema.index({ 'domainConfig.customDomain': 1, isDeleted: 1 });
StoreSchema.index({ status: 1, isDeleted: 1 });

export const Store = mongoose.model<IStore>('Store', StoreSchema);

