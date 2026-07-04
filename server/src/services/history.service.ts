import { PromptHistory, IPromptHistoryDocument } from "../models/promptHistory.model.js";
import AppError from "../utils/errorHandler.js";

/**
 * Creates a new prompt history record for a user.
 */
export const createHistory = async (
  userId: string,
  data: {
    projectId?: string;
    componentId?: string;
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
    response?: string;
    generatedFiles?: string[];
    tokens?: number;
    executionTime?: number;
  }
): Promise<IPromptHistoryDocument> => {
  const history = await PromptHistory.create({
    userId,
    ...data,
  });
  return history;
};

/**
 * Retrieves all prompt history records belonging to a user, with optional filters.
 */
export const getUserHistory = async (
  userId: string,
  filters: {
    feature?: string;
    status?: string;
    projectId?: string;
    model?: string;
    limit?: number;
  } = {}
): Promise<IPromptHistoryDocument[]> => {
  const query: any = { userId };

  if (filters.feature) {
    query.feature = filters.feature;
  }
  if (filters.status) {
    query.status = filters.status;
  }
  if (filters.projectId) {
    query.projectId = filters.projectId;
  }
  if (filters.model) {
    query.model = filters.model;
  }

  let dbQuery = PromptHistory.find(query).sort({ createdAt: -1 });

  if (filters.limit && filters.limit > 0) {
    dbQuery = dbQuery.limit(filters.limit);
  }

  return await dbQuery;
};

/**
 * Retrieves a specific prompt history record belonging to a user.
 */
export const getHistoryById = async (
  userId: string,
  id: string
): Promise<IPromptHistoryDocument> => {
  const history = await PromptHistory.findOne({ _id: id, userId });
  if (!history) {
    throw new AppError("Prompt history not found", 404);
  }
  return history;
};

/**
 * Deletes a specific prompt history record belonging to a user.
 */
export const deleteHistory = async (
  userId: string,
  id: string
): Promise<void> => {
  const history = await PromptHistory.findOneAndDelete({ _id: id, userId });
  if (!history) {
    throw new AppError("Prompt history not found", 404);
  }
};

/**
 * Clears all prompt history records belonging to a user.
 */
export const clearUserHistory = async (userId: string): Promise<void> => {
  await PromptHistory.deleteMany({ userId });
};
