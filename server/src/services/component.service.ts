import { Component, IComponentDocument } from "../models/component.model.js";
import { Project } from "../models/project.model.js";
import AppError from "../utils/errorHandler.js";

export interface IComponentFilters {
  projectId?: string;
  componentType?: string;
  isSaved?: string | boolean;
}

/**
 * Creates a component for a specific user.
 * Validates project ownership if projectId is provided.
 */
export const createComponent = async (
  userId: string,
  data: {
    name: string;
    componentType: string;
    prompt?: string;
    tsxCode: string;
    cssCode?: string;
    usageExample?: string;
    projectId?: string;
    isSaved?: boolean;
    tags?: string[];
  }
): Promise<IComponentDocument> => {
  // Verify that the project belongs to the logged-in user if projectId is provided
  if (data.projectId) {
    const project = await Project.findOne({ _id: data.projectId, userId });
    if (!project) {
      throw new AppError("Associated project not found or unauthorized", 404);
    }
  }

  const component = await Component.create({
    userId,
    ...data,
  });
  return component;
};

/**
 * Retrieves all components belonging to a user matching the filter query.
 */
export const getUserComponents = async (
  userId: string,
  filters: IComponentFilters
): Promise<IComponentDocument[]> => {
  const query: any = { userId };

  if (filters.projectId) {
    query.projectId = filters.projectId;
  }

  if (filters.componentType) {
    query.componentType = filters.componentType;
  }

  if (filters.isSaved !== undefined) {
    query.isSaved = typeof filters.isSaved === "string"
      ? filters.isSaved === "true"
      : !!filters.isSaved;
  }

  return await Component.find(query).sort({ createdAt: -1 });
};

/**
 * Retrieves a single component belonging to the user.
 */
export const getComponentById = async (
  userId: string,
  componentId: string
): Promise<IComponentDocument> => {
  const component = await Component.findOne({ _id: componentId, userId });
  if (!component) {
    throw new AppError("Component not found", 404);
  }
  return component;
};

/**
 * Updates an existing component.
 * Validates project ownership if projectId is being updated.
 */
export const updateComponent = async (
  userId: string,
  componentId: string,
  data: {
    name?: string;
    componentType?: string;
    prompt?: string;
    tsxCode?: string;
    cssCode?: string;
    usageExample?: string;
    projectId?: string;
    isSaved?: boolean;
    tags?: string[];
  }
): Promise<IComponentDocument> => {
  // Verify project ownership if updating the associated project
  if (data.projectId) {
    const project = await Project.findOne({ _id: data.projectId, userId });
    if (!project) {
      throw new AppError("Associated project not found or unauthorized", 404);
    }
  }

  const component = await Component.findOneAndUpdate(
    { _id: componentId, userId },
    { $set: data },
    { new: true, runValidators: true }
  );

  if (!component) {
    throw new AppError("Component not found", 404);
  }
  return component;
};

/**
 * Deletes a component belonging to the user.
 */
export const deleteComponent = async (
  userId: string,
  componentId: string
): Promise<void> => {
  const component = await Component.findOneAndDelete({ _id: componentId, userId });
  if (!component) {
    throw new AppError("Component not found", 404);
  }
};
