import mongoose, { Schema, Document } from 'mongoose';

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  refreshToken: string;
  deviceInfo?: {
    userAgent: string;
    ipAddress: string;
    deviceType?: string;
  };
  expiresAt: Date;
  isRevoked: boolean;
  revokedAt?: Date;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: String,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: Date,
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

SessionSchema.index({ userId: 1, isRevoked: 1 });
SessionSchema.index({ refreshToken: 1, isRevoked: 1 });
SessionSchema.index({ expiresAt: 1 });

export const Session = mongoose.model<ISession>('Session', SessionSchema);

