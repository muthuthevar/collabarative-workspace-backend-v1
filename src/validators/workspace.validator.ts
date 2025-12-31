import Joi from "joi";
import { Role } from "../domain/enums/Role.enum.js";

export const createWorkspaceSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.min": "Workspace name must be at least 3 characters long",
    "string.max": "Workspace name must not exceed 100 characters",
    "any.required": "Workspace name is required",
  }),
});

export const updateWorkspaceSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    "string.min": "Workspace name must be at least 3 characters long",
    "string.max": "Workspace name must not exceed 100 characters",
  }),
}).min(1);

export const addMemberSchema = Joi.object({
  userId: Joi.string().uuid().required().messages({
    "string.guid": "Invalid user ID format",
    "any.required": "User ID is required",
  }),
  role: Joi.string()
    .valid(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
    .required()
    .messages({
      "any.only": "Role must be one of: OWNER, ADMIN, MEMBER, VIEWER",
      "any.required": "Role is required",
    }),
});

export const updateMemberRoleSchema = Joi.object({
  role: Joi.string()
    .valid(Role.OWNER, Role.ADMIN, Role.MEMBER, Role.VIEWER)
    .required()
    .messages({
      "any.only": "Role must be one of: OWNER, ADMIN, MEMBER, VIEWER",
      "any.required": "Role is required",
    }),
});
