import { Router } from "express";
import {
  createProject,
  getUserProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";
import validate from "../middlewares/validate.middleware.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all project routes
router.use(protect);

router.route("/")
  .post(validate(createProjectSchema), createProject)
  .get(getUserProjects);

router.route("/:id")
  .get(getProjectById)
  .patch(validate(updateProjectSchema), updateProject)
  .delete(deleteProject);

export const projectRoutes = router;
export default router;
