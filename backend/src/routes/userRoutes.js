import express from "express";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const users = await User.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { users },
    });
  })
);

export default router;
