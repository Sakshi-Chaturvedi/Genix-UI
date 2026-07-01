import { Router } from "express";
import {
  createComponent,
  getUserComponents,
  getComponentById,
  updateComponent,
  deleteComponent,
} from "../controllers/component.controller.js";
import {
  createComponentSchema,
  updateComponentSchema,
} from "../validators/component.validator.js";
import validate from "../middlewares/validate.middleware.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all component routes
router.use(protect);

router.route("/")
  .post(validate(createComponentSchema), createComponent)
  .get(getUserComponents);

router.route("/:id")
  .get(getComponentById)
  .patch(validate(updateComponentSchema), updateComponent)
  .delete(deleteComponent);

export const componentRoutes = router;
export default router;
