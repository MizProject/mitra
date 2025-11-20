# Mitra Setup Guide

Welcome to the setup guide for Mitra. This document will walk you through the entire process of initializing your Mitra application, from running the setup server to configuring your business details through the web interface.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: The setup and runtime environments are built on Node.js.
- **npm (Node Package Manager)**: This is included with Node.js and is used to install dependencies.

Before running the setup for the first time, install the required packages by running the following command in the project's root directory:

```bash
npm install
```

## 1. Running the Setup Server

The setup process is handled by a dedicated Node.js server. To start it, navigate to the root directory of the project in your terminal and run:

```bash
node setup.js
```

You should see a confirmation that the server is running on port `7500`.

```
Mitra Setup server is running on port 7500 and under the IP: http://localhost:7500/
```

### Debug Mode

For development or troubleshooting, you can run the setup server in debug mode. This will generate detailed log files in the `development/logs/` directory.

```bash
node setup.js --debug
```

## 2. The Web Setup Wizard

Once the server is running, open your web browser and navigate to http://localhost:7500. You will be guided through a multi-step wizard.

### Step 1: Welcome & Terms and Conditions

1.  The initial screen welcomes you to Mitra. Click **Continue** to begin.
2.  You will be presented with the Mitra Terms and Conditions. Read through them.
3.  Check the **"I accept the Terms and Conditions"** box at the bottom. The `Next` button will become active.
4.  Click **Next** to proceed.

### Step 2: Admin Account & Database

This page sets up your primary administrator account and tests the database connection.

1.  **Create Admin Account**:
    -   **Username**: Enter a username for the main admin account.
    -   **Password**: Enter a secure password.
    -   **Confirm Password**: Re-enter the password to confirm.
2.  **Recovery Code**:
    -   Check the **"Also Generate Recovery Code"** box. This is highly recommended. If you forget your password, this code will be required for recovery.
3.  **Create Account**:
    -   Click the **"Create Admin Account"** button.
    -   If you opted for a recovery code, a modal window will appear displaying your code. **Save this code in a secure password manager or physical location. You will not be shown it again.**
    -   Click **"I have saved my code"** to close the modal.
4.  **Verify Credentials**:
    -   After creating the account, click the **"Check Authentication"** button to verify that the login works. A success message will appear.
5.  **Database Benchmark (Optional)**:
    -   Click the **"Check Database Connection"** button to run a performance benchmark on the SQLite database. This test writes and reads data to ensure the database is working correctly and provides performance metrics.
6.  Once authentication is successful, the `Next` button will be enabled. Click it.

### Step 3: Site Appearance

This page configures the look and feel of your public-facing site.

1.  **Site Name**: Enter the name of your business (e.g., "My Awesome Business").
2.  **Currency Symbol**: Enter the currency symbol you use (e.g., $, €, £).
3.  **Colors**:
    -   **Primary/Secondary Site Color**: Click the color buttons to open a color picker. Choose the main brand colors for your site. The primary color is used for buttons, links, and highlights.
    -   **Color Presets**: Alternatively, click the **"Color Presets"** button to choose from a list of pre-defined color themes.
4.  **File Uploads**:
    -   **Site's Logo**: Upload your business logo. This will be used as the favicon and in other branding locations.
    -   **Site's Banner**: Optionally, upload a banner image for the main page.
5.  **Save Configuration**:
    -   After making your changes, click the **"Save Configuration"** button. Wait for the success message.
6.  Click **Next**.

### Step 4: Initialize Services

Here, you will set up the database tables corresponding to the types of services your business offers.

1.  **Select Services**: Check the boxes for the service types you provide (e.g., `Laundry Service`, `Food & Restaurant`).
2.  **Initialize**: Click the **"Initialize Services"** button. The script will create the necessary tables in the database (`service_details_laundry`, etc.).
3.  Wait for the success notification, then click **Next**.

### Step 5: Setup Complete

You will see a "Setup Complete!" message confirming that Mitra has been configured.

**IMPORTANT**: You can now shut down the setup server. Go back to your terminal and press `Ctrl+C`.

## 3. Running the Main Application

The setup is finished. To run the main Mitra application, use the following command from the project's root directory:

```bash
node runtime.js
```

The main application runs on port **3000**. You can now access your site at http://localhost:3000 and the admin panel at http://localhost:3000/admin.