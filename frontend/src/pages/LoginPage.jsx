import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { user, login, signup, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => location.state?.from?.pathname || "/dashboard", [location]);

  const [mode, setMode] = useState("login");
  const [formValues, setFormValues] = useState({
    name: "",
    email: "",
    password: "",
    role: "member",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, loading, navigate, redirectTo]);

  const handleChange = (event) => {
    setFormValues((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({
          email: formValues.email,
          password: formValues.password,
        });
      } else {
        await signup({
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          role: formValues.role,
        });
      }
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Authentication failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ minHeight: "100vh", display: "flex", alignItems: "center" }}>
      <Paper elevation={4} sx={{ width: "100%", p: 4 }}>
        <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
          Team Task Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
          Manage projects, assign tasks, and track team progress in one place.
        </Typography>

        <Tabs value={mode} onChange={(_, value) => setMode(value)} centered sx={{ mb: 2 }}>
          <Tab label="Login" value="login" />
          <Tab label="Sign Up" value="signup" />
        </Tabs>

        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={2}>
            {mode === "signup" && (
              <TextField
                label="Full Name"
                name="name"
                value={formValues.name}
                onChange={handleChange}
                required
                fullWidth
              />
            )}

            <TextField
              label="Email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={formValues.password}
              onChange={handleChange}
              required
              fullWidth
            />

            {mode === "signup" && (
              <TextField
                select
                label="Role"
                name="role"
                value={formValues.role}
                onChange={handleChange}
                fullWidth
              >
                <MenuItem value="member">Member</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </TextField>
            )}

            <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
              {isSubmitting
                ? "Please wait..."
                : mode === "login"
                  ? "Login to Dashboard"
                  : "Create Account"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
