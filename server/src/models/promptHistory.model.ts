import { Schema, model, Document, Types } from "mongoose";

export interface IPromptHistory {
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  componentId?: Types.ObjectId;
  prompt: string;
  feature:
    | "generate-component"
    | "improve-component"
    | "convert-js-ts"
    | "explain-component"
    | "generate-page"
    | "fix-component";
  model?: string;
  status: "pending" | "success" | "failed";
  response?: any;
  generatedFiles?: string[];
  tokens?: number;
  executionTime?: number;
}

export interface IPromptHistoryDocument extends Omit<Document, "model">, IPromptHistory {
  createdAt: Date;
  updatedAt: Date;
}

const promptHistorySchema = new Schema<IPromptHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    componentId: {
      type: Schema.Types.ObjectId,
      ref: "Component",
    },
    prompt: {
      type: String,
      required: [true, "Prompt is required"],
      maxlength: [5000, "Prompt must not exceed 5000 characters"],
      trim: true,
    },
    feature: {
      type: String,
      required: [true, "Feature is required"],
      enum: {
        values: [
          "generate-component",
          "improve-component",
          "convert-js-ts",
          "explain-component",
          "generate-page",
          "fix-component",
        ],
        message: "Invalid feature type",
      },
    },
    model: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: {
        values: ["pending", "success", "failed"],
        message: "Invalid status type",
      },
    },
    response: {
      type: Schema.Types.Mixed,
    },
    generatedFiles: {
      type: [String],
      default: [],
    },
    tokens: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const PromptHistory = model<IPromptHistoryDocument>(
  "PromptHistory",
  promptHistorySchema
);
