import { Router } from "express";
import { authController } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", requireAuth, authController.me);

export default router;
