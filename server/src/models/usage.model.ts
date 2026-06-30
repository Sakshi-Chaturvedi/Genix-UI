import { Schema, model, Document, Types } from "mongoose";

export interface IUsage {
  userId: Types.ObjectId;
  month: string; // Format "YYYY-MM"
  generationsUsed: number;
  tokensUsed: number;
  limit: number;
}

export interface IUsageDocument extends IUsage, Document {
  createdAt: Date;
  updatedAt: Date;
}

const usageSchema = new Schema<IUsageDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    generationsUsed: {
      type: Number,
      default: 0,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    limit: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure only one usage tracking document exists per user per month
usageSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Usage = model<IUsageDocument>("Usage", usageSchema);
