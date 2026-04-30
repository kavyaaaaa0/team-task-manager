import express from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

const allowedStatuses = ["pending", "in_progress", "completed"];

router.use(protect);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = {};

    if (req.user.role !== "admin") {
      filter.assignedTo = req.user._id;
    } else if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }

    if (req.query.project) {
      filter.project = req.query.project;
    }

    if (req.query.status) {
      if (!allowedStatuses.includes(req.query.status)) {
        throw new ApiError(400, "Invalid status filter value");
      }
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter)
      .populate("project", "name")
      .populate("assignedTo", "name email role")
      .sort({ dueDate: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { tasks },
    });
  })
);

router.post(
  "/",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { title, description, assignedTo, project, status = "pending", dueDate } = req.body;

    if (!title || !assignedTo || !project || !dueDate) {
      throw new ApiError(400, "Title, assignedTo, project, and dueDate are required");
    }

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, "Invalid status value");
    }

    const [assignee, projectDoc] = await Promise.all([
      User.findById(assignedTo),
      Project.findById(project),
    ]);

    if (!assignee) {
      throw new ApiError(404, "Assigned user not found");
    }

    if (!projectDoc) {
      throw new ApiError(404, "Project not found");
    }

    const isTeamMember = projectDoc.teamMembers.some(
      (memberId) => memberId.toString() === assignedTo.toString()
    );

    if (!isTeamMember) {
      throw new ApiError(400, "Assigned user must be a member of the selected project");
    }

    const parsedDueDate = new Date(dueDate);
    if (Number.isNaN(parsedDueDate.getTime())) {
      throw new ApiError(400, "Invalid due date");
    }

    const task = await Task.create({
      title: title.trim(),
      description: description?.trim() || "",
      assignedTo,
      project,
      status,
      dueDate: parsedDueDate,
      createdBy: req.user._id,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedTo", "name email role");

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: { task: populatedTask },
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id)
      .populate("project", "name")
      .populate("assignedTo", "name email role");

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const isAssignedMember = task.assignedTo._id.toString() === req.user._id.toString();

    if (req.user.role !== "admin" && !isAssignedMember) {
      throw new ApiError(403, "You can only view tasks assigned to you");
    }

    res.status(200).json({
      success: true,
      data: { task },
    });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id).populate("project", "teamMembers");

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const isAssignedMember = task.assignedTo.toString() === req.user._id.toString();

    if (req.user.role !== "admin") {
      if (!isAssignedMember) {
        throw new ApiError(403, "You can only update your own assigned tasks");
      }

      const payloadKeys = Object.keys(req.body);
      if (payloadKeys.length !== 1 || !payloadKeys.includes("status")) {
        throw new ApiError(400, "Members are only allowed to update task status");
      }

      if (!allowedStatuses.includes(req.body.status)) {
        throw new ApiError(400, "Invalid status value");
      }

      task.status = req.body.status;
      await task.save();
    } else {
      const { title, description, assignedTo, project, status, dueDate } = req.body;

      if (title !== undefined) {
        if (!title.trim()) {
          throw new ApiError(400, "Title cannot be empty");
        }
        task.title = title.trim();
      }

      if (description !== undefined) {
        task.description = description.trim();
      }

      let nextProjectDoc = task.project;

      if (project !== undefined) {
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
          throw new ApiError(404, "Selected project not found");
        }
        task.project = project;
        nextProjectDoc = projectDoc;
      }

      if (assignedTo !== undefined) {
        const assignee = await User.findById(assignedTo);
        if (!assignee) {
          throw new ApiError(404, "Assigned user not found");
        }

        const isAssigneeInProject = nextProjectDoc.teamMembers.some(
          (memberId) => memberId.toString() === assignedTo.toString()
        );

        if (!isAssigneeInProject) {
          throw new ApiError(400, "Assigned user must be a member of the selected project");
        }

        task.assignedTo = assignedTo;
      }

      if (status !== undefined) {
        if (!allowedStatuses.includes(status)) {
          throw new ApiError(400, "Invalid status value");
        }
        task.status = status;
      }

      if (dueDate !== undefined) {
        const parsedDueDate = new Date(dueDate);
        if (Number.isNaN(parsedDueDate.getTime())) {
          throw new ApiError(400, "Invalid due date");
        }
        task.dueDate = parsedDueDate;
      }

      await task.save();
    }

    const updatedTask = await Task.findById(task._id)
      .populate("project", "name")
      .populate("assignedTo", "name email role");

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: { task: updatedTask },
    });
  })
);

router.delete(
  "/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  })
);

export default router;
