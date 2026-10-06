import { Router } from "express";
import { linkController } from "../controllers/linkController";
import { validate } from "../middleware/validate";
import {
  createLinkSchema,
  updateLinkSchema,
} from "../schemas/link.schema";

const router = Router();

router.get("/", linkController.list);
router.get("/:id", linkController.getOne);
router.post("/", validate(createLinkSchema), linkController.create);
router.patch("/:id", validate(updateLinkSchema), linkController.update);
router.delete("/:id", linkController.remove);

export default router;
