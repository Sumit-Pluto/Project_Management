# 🚀 Team Task Manager

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue)
![Express](https://img.shields.io/badge/Express-4.21-green)

A professional, full-stack project management application designed for modern teams. Streamline your workflow by creating projects, inviting team members, assigning tasks, and tracking progress in real-time. Designed with security and role-based access control at its core.

---

## ✨ Features

- **🔐 Secure Authentication:** JWT-based user authentication and session management.
- **👥 Role-Based Access Control (RBAC):** Distinct permissions for `Admin` (Project Managers) and `Member` roles.
- **📁 Project Management:** Create, edit, and organize multiple projects in one centralized dashboard.
- **✅ Task Assignment:** Assign tasks to specific team members, set priorities, and establish due dates.
- **📊 Progress Tracking:** Members can update the status of their assigned work (To Do, In Progress, Done).
- **🛡️ Data Security:** Passwords are encrypted using bcrypt, and API routes are secured with Helmet and custom middleware.

## 🛠️ Technology Stack

**Frontend (Client)**
- **Framework:** React 19 + Vite
- **Styling:** CSS & Lucide React Icons
- **Language:** TypeScript

**Backend (API)**
- **Framework:** Express.js (Node.js 20+)
- **Database:** PostgreSQL (using `pg` driver)
- **Validation:** Zod for rigorous runtime type checking
- **Language:** TypeScript

---

## 💻 Local Development Setup

To run this project locally, ensure you have Node.js (v20+) and PostgreSQL installed on your machine.

### 1. Clone & Install
```bash
git clone https://github.com/Sumit-Pluto/Project_Management.git
cd Project_Management
npm install
```

### 2. Environment Configuration
Copy the sample environment variables:
```bash
cp .env.example .env
```
Update the `.env` file with your local PostgreSQL connection string and a secure JWT secret:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/team_task_manager
JWT_SECRET=your-super-secure-secret-key-min-24-chars
```

### 3. Start the Application
This project is configured as a monorepo. Starting it will run both the frontend and backend concurrently:
```bash
npm run dev
```
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:4000

*(Note: Database migrations run automatically on startup!)*

---

## ☁️ Production Deployment

This project is optimized for a **single-service deployment** on Railway, utilizing Neon.tech for a free, serverless PostgreSQL database.

### 1. Database Setup (Neon)
1. Create a free PostgreSQL database at Neon.tech.
2. Run the following command in the Neon SQL Editor to grant schema permissions (required for Postgres 15+):
   GRANT ALL ON SCHEMA public TO neondb_owner;
3. Copy your Neon connection string.

### 2. Railway Deployment
1. Create a new **GitHub Repo** deployment on Railway.
2. Railway will automatically detect the `railway.json` configuration and build both the frontend and backend into a single service.
3. Under the **Variables** tab in Railway, add the following:
   DATABASE_URL=<your-neon-connection-string>
   JWT_SECRET=<a-long-random-secret>
   NODE_ENV=production
4. Generate a public domain in Railway settings. The Express backend is configured to automatically serve the built React frontend in production!

---

## 📖 User Flow

1. **Sign Up:** Register as an Admin to create your first project workspace.
2. **Invite:** Add existing users to your project using their email address.
3. **Assign:** Create tasks, assign them to your new members, set priorities, and establish deadlines.
4. **Execute:** Members log in, view their assigned tasks, and update statuses as work progresses.

---

*Built with ❤️ for productive teams.*
