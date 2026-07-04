import { Router } from "express";
import {
  createHistory,
  getUserHistory,
  getHistoryById,
  deleteHistory,
  clearUserHistory,
} from "../controllers/history.controller.js";
import {
  createHistorySchema,
  getHistoryByIdSchema,
  deleteHistorySchema,
} from "../validators/history.validator.js";
import validate from "../middlewares/validate.middleware.js";
import protect from "../middlewares/auth.middleware.js";

const router = Router();

// Protect all history routes
router.use(protect);

router
  .route("/")
  .post(validate(createHistorySchema), createHistory)
  .get(getUserHistory)
  .delete(clearUserHistory);

router
  .route("/:id")
  .get(validate(getHistoryByIdSchema), getHistoryById)
  .delete(validate(deleteHistorySchema), deleteHistory);

export const historyRoutes = router;
export default router;
