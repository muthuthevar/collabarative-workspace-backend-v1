import Joi from "joi";

export const createBoardSchema = Joi.object({
  workspaceId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid workspace ID format",
    "any.required": "Workspace ID is required",
  }),
  title: Joi.string().min(3).max(200).required().messages({
    "string.min": "Board title must be at least 3 characters long",
    "string.max": "Board title must not exceed 200 characters",
    "any.required": "Board title is required",
  }),
  content: Joi.string().allow(null, "").optional(),
});

export const updateBoardSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional().messages({
    "string.min": "Board title must be at least 3 characters long",
    "string.max": "Board title must not exceed 200 characters",
  }),
  content: Joi.string().allow(null, "").optional(),
}).min(1);
