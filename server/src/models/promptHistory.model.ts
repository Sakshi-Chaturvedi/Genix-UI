import { Schema, model, Document, Types } from "mongoose";

export interface IPromptHistory {
  userId: Types.ObjectId;
  prompt: string;
  actionType: "generate-component" | "convert-js-to-ts" | "improve-design" | "explain-code" | "generate-theme";
  status: "success" | "failed";
  errorMessage?: string;
  tokensUsed?: number;
}

export interface IPromptHistoryDocument extends IPromptHistory, Document {
  createdAt: Date;
  updatedAt: Date;
}

const promptHistorySchema = new Schema<IPromptHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    actionType: {
      type: String,
      enum: ["generate-component", "convert-js-to-ts", "improve-design", "explain-code", "generate-theme"],
      required: true,
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    errorMessage: {
      type: String,
    },
    tokensUsed: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const PromptHistory = model<IPromptHistoryDocument>("PromptHistory", promptHistorySchema);
