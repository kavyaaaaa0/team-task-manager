import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { DataGrid } from "@mui/x-data-grid";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const emptyTaskForm = {
  title: "",
  description: "",
  assignedTo: "",
  project: "",
  status: "pending",
  dueDate: "",
};

const TaskDataGridPage = () => {
  const { isAdmin } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      if (isAdmin) {
        const [tasksResponse, projectsResponse, usersResponse] = await Promise.all([
          api.get("/tasks"),
          api.get("/projects"),
          api.get("/users"),
        ]);

        setTasks(tasksResponse.data.data.tasks);
        setProjects(projectsResponse.data.data.projects);
        setUsers(usersResponse.data.data.users);
      } else {
        const tasksResponse = await api.get("/tasks");
        setTasks(tasksResponse.data.data.tasks);
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateDialog = () => {
    setEditingTaskId(null);
    setTaskForm(emptyTaskForm);
    setDialogOpen(true);
  };

  const openEditDialog = (task) => {
    setEditingTaskId(task._id);
    setTaskForm({
      title: task.title,
      description: task.description || "",
      assignedTo: task.assignedTo?._id || "",
      project: task.project?._id || "",
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTaskId(null);
    setTaskForm(emptyTaskForm);
  };

  const handleFormChange = (event) => {
    setTaskForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSaveTask = async () => {
    if (!taskForm.title || !taskForm.assignedTo || !taskForm.project || !taskForm.dueDate) {
      setErrorMessage("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const payload = {
      ...taskForm,
      dueDate: new Date(taskForm.dueDate).toISOString(),
    };

    try {
      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
        setSuccessMessage("Task updated successfully");
      } else {
        await api.post("/tasks", payload);
        setSuccessMessage("Task created successfully");
      }

      closeDialog();
      fetchData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to save task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const shouldDelete = window.confirm("Delete this task?");
    if (!shouldDelete) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.delete(`/tasks/${taskId}`);
      setSuccessMessage("Task deleted successfully");
      fetchData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to delete task");
    }
  };

  const handleMemberStatusChange = async (taskId, status) => {
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await api.put(`/tasks/${taskId}`, { status });
      setSuccessMessage("Task status updated");
      fetchData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to update task status");
    }
  };

  const rows = useMemo(
    () =>
      tasks.map((task) => ({
        id: task._id,
        title: task.title,
        description: task.description,
        status: task.status,
        dueDate: task.dueDate,
        projectName: task.project?.name || "N/A",
        assigneeName: task.assignedTo?.name || "N/A",
        rawTask: task,
      })),
    [tasks]
  );

  const columns = useMemo(() => {
    const baseColumns = [
      { field: "title", headerName: "Title", flex: 1.3, minWidth: 180 },
      { field: "projectName", headerName: "Project", flex: 1, minWidth: 150 },
      ...(isAdmin ? [{ field: "assigneeName", headerName: "Assigned To", flex: 1 }] : []),
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        minWidth: 180,
        renderCell: (params) => {
          if (!isAdmin) {
            return (
              <Select
                size="small"
                value={params.row.status}
                onChange={(event) => handleMemberStatusChange(params.row.id, event.target.value)}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            );
          }

          const color =
            params.row.status === "completed"
              ? "success"
              : params.row.status === "in_progress"
                ? "primary"
                : "warning";

          const label = STATUS_OPTIONS.find((status) => status.value === params.row.status)?.label;

          return <Chip label={label} color={color} size="small" />;
        },
      },
      {
        field: "dueDate",
        headerName: "Due Date",
        flex: 1,
        minWidth: 140,
        valueFormatter: (value) => new Date(value).toLocaleDateString(),
      },
    ];

    if (isAdmin) {
      baseColumns.push({
        field: "actions",
        headerName: "Actions",
        sortable: false,
        filterable: false,
        minWidth: 110,
        renderCell: (params) => (
          <Box>
            <IconButton onClick={() => openEditDialog(params.row.rawTask)} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton onClick={() => handleDeleteTask(params.row.id)} size="small" color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        ),
      });
    }

    return baseColumns;
  }, [isAdmin, tasks]);

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Typography variant="h4" fontWeight={700}>
          {isAdmin ? "Task Management" : "My Tasks"}
        </Typography>

        {isAdmin && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
            Create Task
          </Button>
        )}
      </Box>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 1 }}>
        <DataGrid
          autoHeight
          rows={rows}
          columns={columns}
          loading={loading}
          disableRowSelectionOnClick
          pageSizeOptions={[5, 10, 20]}
          initialState={{
            pagination: {
              paginationModel: {
                page: 0,
                pageSize: 10,
              },
            },
          }}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingTaskId ? "Edit Task" : "Create Task"}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Title"
              name="title"
              value={taskForm.title}
              onChange={handleFormChange}
              required
              fullWidth
            />

            <TextField
              label="Description"
              name="description"
              value={taskForm.description}
              onChange={handleFormChange}
              multiline
              minRows={3}
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel id="project-select-label">Project</InputLabel>
              <Select
                labelId="project-select-label"
                label="Project"
                name="project"
                value={taskForm.project}
                onChange={handleFormChange}
              >
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel id="assignee-select-label">Assigned To</InputLabel>
              <Select
                labelId="assignee-select-label"
                label="Assigned To"
                name="assignedTo"
                value={taskForm.assignedTo}
                onChange={handleFormChange}
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                label="Status"
                name="status"
                value={taskForm.status}
                onChange={handleFormChange}
              >
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Due Date"
              name="dueDate"
              type="date"
              value={taskForm.dueDate}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
              required
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveTask} disabled={submitting}>
            {submitting ? "Saving..." : editingTaskId ? "Update Task" : "Create Task"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default TaskDataGridPage;
