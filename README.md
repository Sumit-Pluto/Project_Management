# Team Task Manager

A full-stack project management app for teams. Admins can create projects, invite members, assign work, and track progress. Members can see the projects they belong to and update their assigned tasks.

## Tech Stack

- React + Vite frontend
- Express REST API
- PostgreSQL database
- JWT authentication
- Role-based access control for Admin and Member users

## Local Setup

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

2. Update `DATABASE_URL` and `JWT_SECRET` in `.env`.

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the app:

   ```bash
   npm run dev
   ```

The API runs on `http://localhost:4000`, and the frontend runs on `http://localhost:5173`.

## Railway Deployment

1. Create a new Railway project from this repository.
2. Add a PostgreSQL database in Railway.
3. Add these environment variables to the app service:

   ```text
   DATABASE_URL=<Railway Postgres connection string>
   JWT_SECRET=<long random secret>
   NODE_ENV=production
   ```

4. Railway will use `railway.json`:

   - Build: `npm ci && npm run build`
   - Start: `npm start`

The API runs migrations automatically on startup, and the Express server serves the built React app in production.

## Demo Flow

- Sign up as an Admin to create projects and manage members.
- Invite existing users to a project by email.
- Create tasks, assign them to project members, set due dates, and track progress.
- Members can log in and update the status of their assigned work.
