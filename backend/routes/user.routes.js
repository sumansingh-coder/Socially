import express from "express";
import { protectedRoute } from "../middleware/protectedRoute.js";
import {
  followUnfollowUser,
  getSuggestedUser,
  getUserProfile,
  updateUserProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username", protectedRoute, getUserProfile);
router.get("/suggested", protectedRoute, getSuggestedUser);
router.post("/follow/:id", protectedRoute, followUnfollowUser);
router.post("/update", protectedRoute, updateUserProfile);

export default router;
