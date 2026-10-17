# 🚨 ResQ Campus — Campus Safety & Emergency Management System

> **ResQ Campus** is a modern, full-stack campus safety and real-time emergency dispatch management system. Built with **React 18 + Vite** on the frontend and **Spring Boot 3.3 + JPA + WebSocket/STOMP** on the backend, it enables students and staff to instantly trigger emergency SOS alerts, report campus incidents, access emergency contacts, and receive real-time updates without manual page refreshes.

---

## 🌟 Key Features

- **🚨 Real-Time Emergency SOS Dispatch**: Trigger one-click SOS alerts with location data. Administrators receive instantaneous live alerts on the Emergency Panel over WebSockets.
- **⚡ Live WebSocket (STOMP) Notifications**: Real-time status updates (Acknowledged, Dispatched, Resolved) streamed instantly to student and admin dashboards.
- **🛡️ Role-Based Access Control (RBAC)**: Fine-grained security for `STUDENT`, `STAFF`, `SECURITY`, and `ADMIN` roles using BCrypt password hashing & JWT tokens.
- **📋 Campus Incident Reporting**: Submit detailed hazard and security reports complete with photo uploads and status tracking.
- **🔍 Lost & Found Portal**: Report lost items or claim found belongings with category filters and item status management.
- **📢 Campus Announcements & Alerts**: Broadcast priority announcements (Emergency, Warning, Info) across the campus community.
- **📞 Emergency Directory**: Quick-access phone numbers for campus security, medical centers, fire department, and counseling lines.
- **📊 Interactive Analytics Dashboard**: Real-time stats on active alerts, daily incidents, and resolved cases.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 18 + Vite
- **Routing**: React Router DOM v6
- **Real-Time Messaging**: `@stomp/stompjs` (STOMP over WebSocket)
- **HTTP Client**: Axios (with JWT interceptors)
- **Icons**: Lucide React
- **Styling**: Vanilla CSS Design System (Glassmorphism, Dark Palette, Micro-animations)

### **Backend**
- **Framework**: Spring Boot 3.3.5 (Java 21)
- **Database**: MySQL 8 / H2 In-Memory Database (Spring Data JPA / Hibernate)
- **Security**: Spring Security + JWT Authentication (JSON Web Tokens)
- **Messaging**: Spring WebSocket with STOMP Broker
- **Validation**: Jakarta Validation API

---

## 📁 Project Structure

```
resq-campus/
├── backend/                  # Spring Boot 3.3 REST API & WebSocket Server
│   ├── src/main/java/com/resq/campus/
│   │   ├── config/           # Security, WebSocket & Web MVC Configurations
│   │   ├── controller/       # REST API Controllers (SOS, Incidents, Auth, Users)
│   │   ├── dto/              # Request & Response Data Transfer Objects
│   │   ├── model/            # JPA Entities & Enums
│   │   ├── repository/       # Spring Data JPA Repositories
│   │   ├── security/         # JWT Services, Auth Filters & User Details
│   │   └── service/          # Business Logic & Notification Services
│   └── src/main/resources/   # Application Properties (application.properties, application-h2.properties)
│
└── frontend/                 # React 18 + Vite Single Page Application
    ├── src/
    │   ├── components/       # Reusable UI Components (Navbar, Sidebar, SOSButton, Modals)
    │   ├── context/          # React Contexts (AuthContext, NotificationContext, SosContext)
    │   ├── hooks/            # Custom React Hooks (useLiveSos, useAsync)
    │   ├── pages/            # Page Views (Dashboard, SOS, Incidents, LostFound, Admin)
    │   ├── services/         # API Clients & WebSocket STOMP Handlers
    │   └── styles/           # Global Design Tokens & Glassmorphism CSS Styles
    └── vite.config.js        # Vite Configuration with API Proxy
```

---

## 🚀 Getting Started

### Prerequisites
- **Java Development Kit (JDK 21)**
- **Apache Maven 3.8+**
- **Node.js (v18+) & npm**
- *(Optional)* **MySQL 8.0+**

---

### 1. Backend Setup (Spring Boot)

Navigate to the `backend` directory:
```bash
cd backend
```

#### Option A: Run with H2 In-Memory Database (Quick Try-Out)
No database setup required! Run with the `h2` profile:
```bash
mvn spring-boot:run "-Dspring-boot.run.profiles=h2"
```

#### Option B: Run with MySQL Database
Ensure MySQL is running on `localhost:3306`, then execute:
```bash
export DB_USERNAME=root
export DB_PASSWORD=your_password
mvn spring-boot:run
```
*(The `resq_campus` database and schema will be generated automatically).*

---

### 2. Frontend Setup (React + Vite)

In a new terminal window, navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```

The frontend will start at **`http://localhost:5173`** and automatically proxy API requests (`/api`) and WebSocket connections (`/ws`) to the backend server at `http://localhost:8080`.

---

## 🔑 Pre-Seeded Demo Accounts

When running with `SEED_DEMO_DATA=true` (enabled by default), the system pre-seeds test accounts for quick evaluation:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Student** | `aarav.sharma@resq.edu` | `Student@123` | SOS Button, Incident Reporting, Lost & Found |
| **Admin** | `admin@resq.edu` | `Admin@123` | Live Emergency Panel, User Management, Announcements |

---

## 🧪 Acceptance Testing Workflow

1. Open **two separate browser windows** (or one standard & one incognito tab).
2. Sign in as a **Student** (`aarav.sharma@resq.edu`) in Browser 1.
3. Sign in as an **Admin** (`admin@resq.edu`) in Browser 2.
4. Click **Emergency SOS** in Browser 1.
5. Watch the **Live Emergency Panel** update instantly in Browser 2 via WebSocket without reloading the page.
6. Acknowledge, Dispatch, or Resolve the incident as Admin, and observe the Student's status updates in real time.

---

## 🔒 Security & Best Practices

- **Two-Step Email Verification (2FA)**: Every login triggers a secure 6-digit OTP code with a 5-minute validity, brute-force rate limiting (max 5 attempts), replay protection, and a 30-second resend cooldown. In local development / demo mode, the code is logged in the backend console and conveniently displayed in the UI for effortless testing.
- **Password Safety**: All user passwords are encrypted using **BCrypt** hashing.
- **Stateless Auth**: REST endpoints are secured using signed **JWT Bearer Tokens**.
- **Role Enforcement**: Critical Admin and Security APIs strictly enforce authority checks on the server side.
- **Input Validation**: API payloads undergo strict server-side validation (`@Valid`).

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
