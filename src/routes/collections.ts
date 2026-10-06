import { Router } from "express";
import { collectionController } from "../controllers/collectionController";
import { validate } from "../middleware/validate";
import { requireAuth, optionalAuth } from "../middleware/auth";
import {
  createCollectionSchema,
  updateCollectionSchema,
} from "../schemas/collection.schema";

const router = Router();

router.get("/:id", optionalAuth, collectionController.getOne);

router.use(requireAuth);

router.get("/", collectionController.list);
router.post("/", validate(createCollectionSchema), collectionController.create);
router.patch("/:id", validate(updateCollectionSchema), collectionController.update);
router.delete("/:id", collectionController.remove);

export default router;
