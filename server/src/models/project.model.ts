import { Schema, model, Document, Types } from "mongoose";

export interface IProject {
  userId: Types.ObjectId;
  name: string;
  description?: string;
}

export interface IProjectDocument extends IProject, Document {
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProjectDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Project = model<IProjectDocument>("Project", projectSchema);
