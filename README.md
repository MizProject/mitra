# Mitra

**A powerful, self-hosted Online Business Manager.**

Mitra is a lightweight platform designed to help small businesses manage service bookings and orders online. It provides a dedicated customer interface for placing orders and a comprehensive administrative dashboard for managing operations, services, and site configuration.

## Status

**Active Development**

## Introduction

Mitra simplifies the process of taking your service-based business online. Whether you run a laundry service, a repair shop, or a small hotel, Mitra offers a flexible system to handle customer requests, track order statuses, and manage your service catalog without complex infrastructure. Built with Node.js and SQLite, it is easy to deploy and maintain.

## Features

### For Customers
*   **User Accounts:** Secure registration and login system.
*   **Service Browsing:** View available services with descriptions and prices.
*   **Booking System:** Add items to a cart, schedule pickup/delivery dates, and place orders.
*   **Order Tracking:** View booking history and current status (Pending, Processing, Completed).
*   **Digital Receipts:** Generate QR codes for easy order verification at the counter.

### For Administrators
*   **Dashboard:** View key statistics and monitor incoming orders in real-time.
*   **Order Management:** Update booking statuses and view detailed order information.
*   **Service Management:** Create, edit, and delete services with image support.
*   **Site Configuration:** Customize the site name, logo, banner, and color scheme directly from the admin panel.
*   **Troubleshooting:** Built-in tools for database schema verification and repair.

### Technical Highlights
*   **Real-time Updates:** Uses WebSockets (Socket.IO) to push status updates instantly.
*   **Lightweight Database:** Powered by SQLite for easy setup and portability.
*   **Secure:** Session-based authentication and bcrypt password hashing.

## Installation & Setup

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Setup Wizard:**
    Initialize the database and create your admin account.
    ```bash
    node setup.js
    ```
    Access the setup interface at `http://localhost:7500`.

3.  **Start the Application:**
    Launch the main runtime server.
    ```bash
    node runtime.js
    ```
    *   **Customer Portal:** `http://localhost:3000`
    *   **Admin Panel:** `http://localhost:3000/admin`

## Plans

<!--*   Payment Gateway Integration
*   Email Notifications (SMTP) -->
*   Advanced Reporting & Analytics
