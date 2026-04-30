import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import api from "../api/client";

const ProjectManagementPage = () => {
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    teamMembers: [],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const [projectsResponse, usersResponse] = await Promise.all([
        api.get("/projects"),
        api.get("/users"),
      ]);
      setProjects(projectsResponse.data.data.projects);
      setUsers(usersResponse.data.data.users);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to load project data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormChange = (event) => {
    setProjectForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.post("/projects", projectForm);
      setSuccessMessage("Project created successfully");
      setProjectForm({
        name: "",
        description: "",
        teamMembers: [],
      });
      fetchData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        Project Management
      </Typography>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      {successMessage && <Alert severity="success">{successMessage}</Alert>}

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Create Project
          </Typography>
          <Box component="form" onSubmit={handleCreateProject}>
            <Stack spacing={2}>
              <TextField
                label="Project Name"
                name="name"
                value={projectForm.name}
                onChange={handleFormChange}
                required
                fullWidth
              />

              <TextField
                label="Description"
                name="description"
                value={projectForm.description}
                onChange={handleFormChange}
                multiline
                minRows={3}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel id="team-members-label">Team Members</InputLabel>
                <Select
                  labelId="team-members-label"
                  multiple
                  name="teamMembers"
                  value={projectForm.teamMembers}
                  onChange={handleFormChange}
                  input={<OutlinedInput label="Team Members" />}
                  renderValue={(selected) =>
                    users
                      .filter((user) => selected.includes(user._id))
                      .map((user) => user.name)
                      .join(", ")
                  }
                >
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name} ({user.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box>
                <Button type="submit" variant="contained" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Project"}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      <Box>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Existing Projects
        </Typography>

        {loading ? (
          <Box py={4} display="flex" justifyContent="center">
            <CircularProgress />
          </Box>
        ) : projects.length === 0 ? (
          <Typography color="text.secondary">No projects created yet.</Typography>
        ) : (
          <Grid container spacing={2}>
            {projects.map((project) => (
              <Grid item xs={12} md={6} key={project._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight={700}>
                      {project.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                      {project.description || "No description provided"}
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Team Members
                    </Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {project.teamMembers.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No members assigned
                        </Typography>
                      ) : (
                        project.teamMembers.map((member) => (
                          <Chip key={member._id} label={`${member.name} (${member.role})`} />
                        ))
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Stack>
  );
};

export default ProjectManagementPage;
