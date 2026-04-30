import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

const STATUS_LABELS = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
};

const STATUS_COLORS = {
  pending: "#f57c00",
  in_progress: "#1976d2",
  completed: "#2e7d32",
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get("/dashboard/metrics");
        setMetrics(response.data.data.metrics);
      } catch (error) {
        setErrorMessage(error.response?.data?.message || "Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const chartData = useMemo(() => {
    if (!metrics) return [];
    return metrics.statusDistribution.map((entry) => ({
      name: STATUS_LABELS[entry.status],
      value: entry.count,
      color: STATUS_COLORS[entry.status],
    }));
  }, [metrics]);

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" minHeight="60vh">
        <CircularProgress />
      </Stack>
    );
  }

  if (errorMessage) {
    return <Alert severity="error">{errorMessage}</Alert>;
  }

  const metricCards = [
    { label: "Total Tasks", value: metrics.totalTasks },
    { label: "Pending Tasks", value: metrics.pendingTasks },
    { label: "In Progress Tasks", value: metrics.inProgressTasks },
    { label: "Completed Tasks", value: metrics.completedTasks },
    { label: "Overdue Tasks", value: metrics.overdueTasks },
    { label: "Completion Rate", value: `${metrics.completionRate}%` },
  ];

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        {user.role === "admin" ? "Admin Dashboard" : "My Dashboard"}
      </Typography>

      <Grid container spacing={2}>
        {metricCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 340 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Task Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={100} label>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, minHeight: 340 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              Recently Updated Tasks
            </Typography>
            {metrics.recentTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No tasks found yet.
              </Typography>
            ) : (
              <List disablePadding>
                {metrics.recentTasks.map((task) => (
                  <ListItem
                    key={task._id}
                    divider
                    secondaryAction={
                      <Chip
                        label={STATUS_LABELS[task.status]}
                        size="small"
                        color={
                          task.status === "completed"
                            ? "success"
                            : task.status === "in_progress"
                              ? "primary"
                              : "warning"
                        }
                      />
                    }
                  >
                    <ListItemText
                      primary={task.title}
                      secondary={`Project: ${task.project?.name || "N/A"} • Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
};

export default DashboardPage;
