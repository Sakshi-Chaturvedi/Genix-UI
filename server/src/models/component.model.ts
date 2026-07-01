import { Schema, model, Document, Types } from "mongoose";

export interface IComponent {
  userId: Types.ObjectId;
  projectId?: Types.ObjectId;
  name: string;
  componentType: string;
  prompt?: string;
  tsxCode: string;
  cssCode?: string;
  usageExample?: string;
  isSaved: boolean;
  tags: string[];
}

export interface IComponentDocument extends IComponent, Document {
  createdAt: Date;
  updatedAt: Date;
}

const componentSchema = new Schema<IComponentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    componentType: {
      type: String,
      required: true,
      trim: true,
    },
    prompt: {
      type: String,
    },
    tsxCode: {
      type: String,
      required: true,
    },
    cssCode: {
      type: String,
    },
    usageExample: {
      type: String,
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Component = model<IComponentDocument>("Component", componentSchema);

