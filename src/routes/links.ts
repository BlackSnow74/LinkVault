import { Router } from "express";
import { linkController } from "../controllers/linkController";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";
import {
  createLinkSchema,
  updateLinkSchema,
  setTagsSchema,
} from "../schemas/link.schema";

const router = Router();

router.use(requireAuth);

router.get("/", linkController.list);
router.get("/:id", linkController.getOne);
router.post("/", validate(createLinkSchema), linkController.create);
router.patch("/:id", validate(updateLinkSchema), linkController.update);
router.delete("/:id", linkController.remove);
router.put("/:id/tags", validate(setTagsSchema), linkController.setTags);

export default router;
