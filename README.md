# Team Task Manager (MERN + MUI)
A production-ready Project and Task Management web app built with a MERN architecture, JWT authentication, role-based access control, and Railway-friendly deployment configuration.

## Features
- Secure authentication (Signup/Login) with bcrypt password hashing and JWT sessions.
- Role-Based Access Control (RBAC):
  - **Admin**: create projects, manage team members in projects, create/update/delete tasks, assign tasks, view system-wide metrics.
  - **Member**: view assigned tasks/projects, update own task status, view personal dashboard metrics.
- Task management with full CRUD support:
  - Title
  - Description
  - Assigned user
  - Project
  - Status (`pending`, `in_progress`, `completed`)
  - Due date
- Dashboard metrics:
  - Total tasks
  - Pending tasks
  - In-progress tasks
  - Completed tasks
  - Overdue tasks
  - Completion rate and status chart
- Monorepo structure ready for local development and Railway deployment.

## Tech Stack
- **Frontend**: React, React Router, Material-UI (MUI), MUI Data Grid, Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcryptjs
- **Deployment**: Railway (monorepo)

## Project Structure
```text
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── errorHandler.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Project.js
│   │   │   └── Task.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   ├── taskRoutes.js
│   │   │   ├── dashboardRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   ├── asyncHandler.js
│   │   │   └── generateToken.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   ├── components/
│   │   │   ├── AppLayout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── TaskDataGridPage.jsx
│   │   │   └── ProjectManagementPage.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── theme.js
│   ├── .env.example
│   ├── vite.config.js
│   └── package.json
├── package.json
├── railway.json
├── Procfile
└── README.md
```

## Setup Instructions
### 1) Clone and install dependencies
```bash
git clone <your-repo-url>
cd team-task-manager
npm install
```

### 2) Configure environment variables
Create environment files from the examples:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3) Required backend `.env` values
`backend/.env`
- `PORT=5000`
- `NODE_ENV=development`
- `MONGO_URI=mongodb://127.0.0.1:27017/team_task_manager`
- `JWT_SECRET=replace-with-a-strong-secret`
- `JWT_EXPIRES_IN=7d`
- `CLIENT_URL=http://localhost:5173`

### 4) Required frontend `.env` values
`frontend/.env`
- `VITE_API_URL=http://localhost:5000/api`

### 5) Run locally
```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`

## NPM Scripts
From repo root:
- `npm run dev` → runs backend + frontend in parallel
- `npm run build` → builds frontend for production
- `npm run start` → starts backend server (also serves frontend `dist` when available)

## API Overview
Base URL: `/api`

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me` (protected)

### Projects
- `GET /projects` (admin: all, member: own projects)
- `POST /projects` (admin)
- `GET /projects/:id` (admin or project member)
- `PUT /projects/:id` (admin)
- `DELETE /projects/:id` (admin)
- `POST /projects/:id/members` (admin)

### Tasks
- `GET /tasks` (admin: all/filterable, member: assigned tasks)
- `POST /tasks` (admin)
- `GET /tasks/:id` (admin or assignee)
- `PUT /tasks/:id` (admin full update, member status-only update)
- `DELETE /tasks/:id` (admin)

### Dashboard
- `GET /dashboard/metrics` (admin: global metrics, member: personal metrics)

### Users
- `GET /users` (admin only; used for assignment and project membership UI)

## Deployment on Railway (Monorepo)
This repository is already configured with both `railway.json` and `Procfile`.

### Railway steps
1. Push this repository to GitHub.
2. In Railway, create a new project from the GitHub repo.
3. Add environment variables in Railway project settings:
   - `NODE_ENV=production`
   - `PORT=5000`
   - `MONGO_URI=<your-production-mongodb-uri>`
   - `JWT_SECRET=<strong-production-secret>`
   - `JWT_EXPIRES_IN=7d`
   - `CLIENT_URL=<your-railway-domain-or-custom-domain>`
4. Deploy. Railway will:
   - run `npm install && npm run build`
   - run `npm run start`
5. The backend serves both API routes and built frontend files.

## Notes
- Ensure MongoDB is reachable from Railway (Mongo Atlas recommended).
- For production security, use a long random JWT secret and strict CORS domains.
- Extend easily with notifications, comments, file uploads, and activity logs.
