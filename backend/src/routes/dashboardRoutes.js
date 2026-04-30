import express from "express";
import Task from "../models/Task.js";
import asyncHandler from "../utils/asyncHandler.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get(
  "/metrics",
  asyncHandler(async (req, res) => {
    const match = req.user.role === "admin" ? {} : { assignedTo: req.user._id };

    const [summary] = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          pendingTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
            },
          },
          inProgressTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0],
            },
          },
          completedTasks: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const overdueTasks = await Task.countDocuments({
      ...match,
      dueDate: { $lt: new Date() },
      status: { $ne: "completed" },
    });

    const groupedStatuses = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const distributionMap = groupedStatuses.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const statusDistribution = ["pending", "in_progress", "completed"].map((status) => ({
      status,
      count: distributionMap[status] || 0,
    }));

    const recentTasks = await Task.find(match)
      .populate("project", "name")
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("title status dueDate project updatedAt");

    const metrics = {
      totalTasks: summary?.totalTasks || 0,
      pendingTasks: summary?.pendingTasks || 0,
      inProgressTasks: summary?.inProgressTasks || 0,
      completedTasks: summary?.completedTasks || 0,
      overdueTasks,
      completionRate:
        summary?.totalTasks > 0
          ? Number(((summary.completedTasks / summary.totalTasks) * 100).toFixed(2))
          : 0,
      statusDistribution,
      recentTasks,
    };

    res.status(200).json({
      success: true,
      data: { metrics },
    });
  })
);

export default router;
