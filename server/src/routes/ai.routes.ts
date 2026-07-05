import { Router } from "express";
import {
  generateComponent,
  convertComponent,
  improveComponent,
  explainComponent,
  generatePage,
} from "../controllers/ai.controller.js";
import {
  generateComponentSchema,
  convertComponentSchema,
  improveComponentSchema,
  explainComponentSchema,
  generatePageSchema,
} from "../validators/ai.validator.js";
import validate from "../middlewares/validate.middleware.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Require user authentication for all AI generation operations
router.use(protect);

router.post("/generate", validate(generateComponentSchema), generateComponent);
router.post("/convert", validate(convertComponentSchema), convertComponent);
router.post("/improve", validate(improveComponentSchema), improveComponent);
router.post("/explain", validate(explainComponentSchema), explainComponent);
router.post("/page", validate(generatePageSchema), generatePage);

export const aiRoutes = router;
export default router;
