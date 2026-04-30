import express from "express";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { authorize, protect } from "../middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const filter = req.user.role === "admin" ? {} : { teamMembers: req.user._id };

    const projects = await Project.find(filter)
      .populate("teamMembers", "name email role")
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { projects },
    });
  })
);

router.post(
  "/",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { name, description, teamMembers = [] } = req.body;

    if (!name) {
      throw new ApiError(400, "Project name is required");
    }

    if (!Array.isArray(teamMembers)) {
      throw new ApiError(400, "teamMembers must be an array of user IDs");
    }

    const uniqueTeamMembers = [...new Set(teamMembers)];

    if (uniqueTeamMembers.length > 0) {
      const members = await User.find({ _id: { $in: uniqueTeamMembers } }).select("_id");
      if (members.length !== uniqueTeamMembers.length) {
        throw new ApiError(400, "One or more team members are invalid");
      }
    }

    const project = await Project.create({
      name: name.trim(),
      description: description?.trim() || "",
      teamMembers: uniqueTeamMembers,
      createdBy: req.user._id,
    });

    const populatedProject = await Project.findById(project._id)
      .populate("teamMembers", "name email role")
      .populate("createdBy", "name email role");

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: { project: populatedProject },
    });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id)
      .populate("teamMembers", "name email role")
      .populate("createdBy", "name email role");

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const isTeamMember = project.teamMembers.some(
      (member) => member._id.toString() === req.user._id.toString()
    );

    if (req.user.role !== "admin" && !isTeamMember) {
      throw new ApiError(403, "You can only view projects where you are a team member");
    }

    res.status(200).json({
      success: true,
      data: { project },
    });
  })
);

router.put(
  "/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { name, description, teamMembers } = req.body;
    const updatePayload = {};

    if (name !== undefined) {
      if (!name.trim()) {
        throw new ApiError(400, "Project name cannot be empty");
      }
      updatePayload.name = name.trim();
    }

    if (description !== undefined) {
      updatePayload.description = description.trim();
    }

    if (teamMembers !== undefined) {
      if (!Array.isArray(teamMembers)) {
        throw new ApiError(400, "teamMembers must be an array of user IDs");
      }

      const uniqueTeamMembers = [...new Set(teamMembers)];
      const members = await User.find({ _id: { $in: uniqueTeamMembers } }).select("_id");

      if (members.length !== uniqueTeamMembers.length) {
        throw new ApiError(400, "One or more team members are invalid");
      }

      updatePayload.teamMembers = uniqueTeamMembers;
    }

    const updatedProject = await Project.findByIdAndUpdate(req.params.id, updatePayload, {
      new: true,
      runValidators: true,
    })
      .populate("teamMembers", "name email role")
      .populate("createdBy", "name email role");

    if (!updatedProject) {
      throw new ApiError(404, "Project not found");
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: { project: updatedProject },
    });
  })
);

router.delete(
  "/:id",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: "Project and related tasks deleted successfully",
    });
  })
);

router.post(
  "/:id/members",
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { memberIds } = req.body;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      throw new ApiError(400, "memberIds must be a non-empty array");
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    const uniqueMemberIds = [...new Set(memberIds)];
    const validUsers = await User.find({ _id: { $in: uniqueMemberIds } }).select("_id");

    if (validUsers.length !== uniqueMemberIds.length) {
      throw new ApiError(400, "One or more provided member IDs are invalid");
    }

    const mergedMembers = [...new Set([...project.teamMembers.map(String), ...uniqueMemberIds])];
    project.teamMembers = mergedMembers;

    await project.save();
    await project.populate("teamMembers", "name email role");
    await project.populate("createdBy", "name email role");

    res.status(200).json({
      success: true,
      message: "Members added to project successfully",
      data: { project },
    });
  })
);

export default router;
