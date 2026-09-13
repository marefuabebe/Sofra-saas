# 🍽️ SOFRA - Multi-Tenant Restaurant Operating System & Digital Ordering SaaS

> A modern, full-stack, multi-tenant digital dining and restaurant management platform. Built from the ground up on the **MERN** stack (MongoDB, Express, React, Node.js) with real-time Socket.IO synchronization, table-specific QR ordering, kitchen display systems (KDS), automated email notifications, and comprehensive business analytics.

---

## 🌟 Key Highlights & Capabilities

### 📱 1. Contactless QR Code Dining & Customer Experience
- **Table-Specific QR Code Ordering**: Guests scan a table QR code to immediately access the live menu scoped to that restaurant (`/:restaurantSlug?table=4`).
- **Interactive Digital Menu**: Real-time category filtering, search, dietary tags, customizable sizes, extra toppings/add-ons, and special kitchen instructions.
- **Live Stock Sync**: Items marked unavailable in the restaurant dashboard instantly reflect across all active customer menus without page reloads.
- **Cart & Order Tracking**: Interactive cart with live total calculation, tax breakdown, and instant order placement.

### ⚡ 2. Real-Time Kitchen Display System (KDS) & Order Processing
- **Socket.IO Live Dispatch**: Audio-visual chimes and instantaneous badge updates the moment an order is placed.
- **Lifecycle Management**: Streamlined order status progression (`Pending` ➜ `Accepted` ➜ `Preparing` ➜ `Ready` ➜ `Completed` / `Cancelled`).
- **Flexible Views**: Switch seamlessly between compact Table View and interactive Kanban Board.
- **Thermal Receipt & PDF Export**: Instant printable customer bills and digital PDF receipts via `jsPDF` and `html2canvas`.

### 👑 3. Super Admin Platform Console (`/admin`)
- **Tenant Onboarding Workflow**: Review restaurant registration requests, verify applications, and provision tenant databases in one click.
- **Automated Credentials Delivery**: Automatically issues welcome emails with secure temporary credentials.
- **Tenant Management**: Activate, deactivate, or suspend restaurant accounts with reason logs.
- **Platform Analytics**: Global GMV tracking, active restaurants count, order volume metrics, and subscription tiers.

### 🏢 4. Restaurant Owner & Staff Dashboard (`/dashboard`)
- **Menu Engineering**: Add, edit, reorder, categorize, and toggle availability of dishes with Cloudinary image uploads.
- **Customizable Dining Options**: Manage dish variations, portion sizes, addon groups, and pricing rules.
- **Category Hierarchy**: Organize offerings with custom sorting and visual categories.
- **QR Code Studio**: Generate, customize, download, and print high-resolution QR table cards with branding.
- **Sales Analytics & Reports**: Visual revenue trends, top-selling items, order distribution charts (`Recharts`), and daily summaries.
- **Store Settings**: Configure tax rates, business hours, notification preferences, and currency settings.

### 📧 5. Resilient Cloud-Ready Email Engine
- **Dual-Engine Architecture**: Supports standard Nodemailer SMTP and zero-cost Google Apps Script (GAS) HTTP Webhook Proxy (allowing reliable outbound email dispatch from cloud hosts like Render without SMTP port blocking).
- **In-App Email Sandbox**: Dedicated testing and preview hub for transaction templates (Verification, Welcome Credentials, Order Confirmations).

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19 + TypeScript** | Type-safe, component-driven client application |
| **Build Tooling** | **Vite** | Blazing-fast HMR and optimized production bundles |
| **Styling & Design** | **Tailwind CSS** | Modern utility-first styling with responsive layouts |
| **Motion & Icons** | **Framer Motion + Lucide React** | Fluid UI transitions and consistent iconography |
| **Data Visualization** | **Recharts** | Interactive revenue, sales, and order volume charts |
| **Backend Runtime** | **Node.js + Express 5** | RESTful API server with modular routers and middleware |
| **Database & ODM** | **MongoDB Atlas + Mongoose 9** | Multi-tenant document database with strict tenant isolation |
| **Real-Time Engine** | **Socket.IO 4** | Bidirectional WebSocket rooms partitioned per tenant |
| **Authentication** | **JWT + Bcrypt** | Secure password hashing & HTTP-only cookie session handling |
| **Asset Storage** | **Cloudinary** | Cloud-hosted restaurant logos and food imagery |
| **Document Generation**| **jsPDF + html2canvas** | Client-side invoice and receipt generation |

---

## 📁 Repository Structure

```text
SOFRA/
├── backend/                  # Express + Node.js API Server
│   ├── src/
│   │   ├── config/           # MongoDB connection, Cloudinary, Email configs
│   │   ├── controllers/      # Admin, Auth, Menu, Order, Restaurant, Analytics controllers
│   │   ├── middleware/       # JWT Auth, Tenant isolation, Role verification, Rate limiter
│   │   ├── models/           # Mongoose schemas (Restaurant, User, MenuItem, Order, etc.)
│   │   ├── routes/           # REST API route declarations
│   │   ├── services/         # Business logic, email dispatchers, socket handlers
│   │   └── server.ts         # Application entry point & HTTP/WebSocket initialization
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # React 19 + Vite Client Application
│   ├── src/
│   │   ├── components/       # Reusable UI elements, Navbar, Modals, Tables, Forms
│   │   ├── context/          # AuthContext, NotificationContext, ConfirmContext
│   │   ├── pages/
│   │   │   ├── admin/        # Super Admin Portal (Requests, Tenants, Overview)
│   │   │   ├── restaurant/   # Restaurant Dashboard (Orders, Menu, KDS, Analytics, Settings)
│   │   │   ├── customer/     # Public Customer Digital Menu & Order Flow
│   │   │   └── public/       # Landing page, Registration, Login
│   │   ├── services/         # Axios API clients & real-time Socket.IO client
│   │   ├── types/            # Application-wide TypeScript interfaces
│   │   ├── utils/            # Formatters, sound chimes, print helpers
│   │   └── App.tsx           # Application router & layout wrapping
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster connection string.

---

### 2. Backend Setup

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   npm install
   ```

2. Create your `.env` configuration file in `backend/.env`:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173

   # Database (MongoDB)
   MONGODB_URI=mongodb://localhost:27017/sofra
   # Or MongoDB Atlas: mongodb+srv://<user>:<password>@cluster.mongodb.net/sofra?retryWrites=true&w=majority

   # Security & Authentication
   JWT_SECRET=your_super_secret_jwt_key_here
   JWT_EXPIRES_IN=7d

   # Cloudinary Media Storage (Optional for dish photos)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Email Dispatch (Google Apps Script Webhook or SMTP)
   GAS_PROXY_URL=https://script.google.com/macros/s/.../exec
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_gmail_app_password
   EMAIL_FROM=SOFRA Support <noreply@sofra.com>
   ```

3. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start on `http://localhost:5000` and automatically connect to MongoDB.

---

### 3. Frontend Setup

1. In another terminal, navigate to the frontend folder:
   ```bash
   cd frontend
   npm install
   ```

2. Create your `.env` configuration file in `frontend/.env`:
   ```env
   # Backend API Base URL
   VITE_API_URL=http://localhost:5000
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

## 🔒 Multi-Tenant Security & Isolation Model

SOFRA enforces multi-tenancy at the application and database layer:
1. **Tenant Attachment**: Every restaurant is assigned an immutable `_id` and unique URL `slug`.
2. **Strict Server-Side Scoping**: All menu items, categories, orders, analytics, and settings are strictly tied to `restaurantId`. 
3. **Session Integrity**: The active restaurant ID is read securely from verified JWT session tokens inside HTTP-only cookies. Clients cannot tamper with or query across other tenants' data.
4. **Isolated WebSocket Channels**: Socket.IO connections join tenant-specific rooms (`tenant_{restaurantId}`). Kitchen staff only receive real-time notifications for their own restaurant.

---

## 🌐 Production Deployment Guide

### Database (MongoDB Atlas)
1. Create a free shared cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist network access (`0.0.0.0/0` or your server IP).
3. Copy the connection string and set `MONGODB_URI` in your backend environment variables.

### Backend (Render / Railway / VPS)
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start` (or `node dist/server.js`)
- Configure the environment variables (`MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `NODE_ENV=production`).

### Frontend (Vercel / Netlify / Cloudflare Pages)
- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- Set `VITE_API_URL` to your production backend URL (e.g., `https://api.yourdomain.com`).

---

## 📄 License

This project is licensed under the MIT License.
