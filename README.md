# InventoryOS — Google Sheets Integrated Inventory Management System

**InventoryOS** is a modern, enterprise-grade Inventory & Logistics Management System built with React, TypeScript, Tailwind CSS, and Firebase Authentication. It features seamless, real-time two-way synchronization with **Google Sheets**, providing a powerful cloud spreadsheet backend alongside a fast, interactive web dashboard.

---

## 🌟 Key Features

### 📊 Google Sheets Live 2-Way Sync
* **6 Synced Core Collections**: Automatically reads and writes to `Assets Database`, `Gate Pass`, `Shipment Tracker`, `Audit Trail`, `Campaigns`, and `Admins` worksheets.
* **Auto-Provisioning**: Automatically creates structured, formatted Google Spreadsheets if no spreadsheet is connected.
* **Offline Local Fallback**: Operates smoothly in local mode if internet or OAuth connections are interrupted, queuing state in `localStorage` until connection restores.

### 📦 Asset Management
* Complete asset lifecycle tracking: Serial Number, Asset ID, Brand, Category, Status, Warehouse Location, Current Possessor, Asset Owner, and Campaign association.
* Multi-field search, status filters, and bulk asset deletion/updates.
* Quick asset registration and details editor modal.

### 📄 Gate Pass Generation
* Generate formal **Inbound** and **Outbound** Gate Passes with auto-generated reference numbers (`GP-001`, `GP-002`, etc.).
* Multi-serial selection for dispatching or receiving multiple equipment units simultaneously.
* Printable & downloadable **Gate Pass Manifest** documents for logistics drivers and security guards.

### 🚚 Shipment Tracking
* Track outbound shipments across active logistics routes.
* Update shipment status (`In Transit`, `Delivered`, `Delayed`, `Returned`), origin/destination cities, shipping dates, ETAs, and carrier details.
* Automated status updates that sync directly back to linked assets.

### 📋 Audit Trail & Activity Feed
* Immutable transaction history logging every asset movement, location update, status change, and gate pass issuance.
* Includes timestamp, actor, serial number, previous state, and reference notes.

### 🎯 Campaign & Deployment Management
* Assign assets to marketing campaigns, events, or enterprise deployments.
* Track campaign utilization ratios, asset allocation percentages, and deployment status.

### 🔐 Super Admin Console & Sync Widget
* Role-based authorization allowing Super Admins to manage system access for registered Google accounts.
* Dedicated **Google Sheets Sync Console** widget displaying live spreadsheet status, last sync timestamp, and individual row counts across all 6 collections.
* System activity logs tracking admin security events.

### 📥 Bulk CSV / Excel Import
* Import large asset inventories directly using standard `.csv` or `.xlsx` files with column mapping preview.

---

## 🛠️ Tech Stack

* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion (`motion/react`)
* **Icons & Charts**: Lucide React, Recharts
* **Authentication**: Firebase Auth with Google OAuth 2.0 (`GoogleAuthProvider`)
* **Database & Integrations**: Google Sheets API v4 (`https://sheets.googleapis.com/v4/spreadsheets`)
* **Data Parsers**: XLSX (`xlsx`) for CSV/Excel file importing

---

## 📁 Directory Structure

```text
├── src/
│   ├── components/
│   │   ├── AssetsView.tsx              # Asset table, search, filters & modals
│   │   ├── AuditTrailView.tsx          # Audit history log viewer
│   │   ├── CampaignsView.tsx           # Campaign metrics & asset allocations
│   │   ├── DashboardView.tsx           # High-level analytics & status charts
│   │   ├── GatePassesView.tsx          # Gate pass history & pass issuer
│   │   ├── LoginView.tsx               # Google OAuth login landing screen
│   │   ├── ShipmentManifestModal.tsx   # Printable gate pass manifest view
│   │   ├── ShipmentsView.tsx           # Active shipments & logistics tracker
│   │   └── SyncStatus.tsx              # Google Sheets Sync Console widget
│   ├── lib/
│   │   ├── assetUtils.ts               # Helper utilities for status/category badges
│   │   ├── firebase.ts                 # Firebase Auth & Google Provider init
│   │   └── googleSheets.ts             # Google Sheets API v4 reader, writer & parser
│   ├── App.tsx                         # Main application container & state engine
│   ├── main.tsx                        # Vite React entry point
│   └── types.ts                        # Global TypeScript interfaces & types
├── .env.example                        # Example environment variables
├── metadata.json                       # Applet metadata configuration
└── package.json                        # Project dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js**: v18.0.0 or higher
* **npm** or **bun**

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your Firebase & Google API credentials if deploying independently:
   ```bash
   cp .env.example .env
   ```

### Running Development Server

Start the local development server on port `3000`:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Building for Production

Compile static production assets to the `dist/` directory:

```bash
npm run build
```

### Type Checking & Linting

Run TypeScript type verification:

```bash
npm run lint
```

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
