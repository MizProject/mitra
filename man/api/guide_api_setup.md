# Mitra Setup API Documentation

This document details the API endpoints available in the `setup.js` service. These endpoints are primarily used during the initial installation, configuration, and troubleshooting of the Mitra application.

**Base URL:** `http://localhost:7500`

## Database Benchmarking

These endpoints are used to verify database performance and integrity during setup.

### Test Database Operation
*   **URL:** `/api/test-db`
*   **Method:** `POST`
*   **Description:** Inserts a random row into the benchmark table and retrieves all rows to verify read/write operations.
*   **Response:**
    ```json
    {
      "message": "success",
      "data": [...]
    }
    ```

### Sequential Write Benchmark
*   **URL:** `/api/benchmark/sequential-write`
*   **Method:** `POST`
*   **Description:** Performs a single write operation to test sequential insertion speed.
*   **Response:**
    ```json
    {
      "message": "success",
      "id": 1
    }
    ```

### Bulk Write Benchmark
*   **URL:** `/api/benchmark/bulk-write`
*   **Method:** `POST`
*   **Description:** Performs a transaction-based bulk insertion of records.
*   **Request Body:**
    ```json
    {
      "records": [
        { "col_text1": "val1", "col_text2": "val2", "col_int1": 100 },
        ...
      ]
    }
    ```
*   **Response:**
    ```json
    {
      "message": "success",
      "count": 50
    }
    ```

### Read All Benchmark Data
*   **URL:** `/api/benchmark/read-all`
*   **Method:** `GET`
*   **Description:** Retrieves IDs of all records in the benchmark table.
*   **Response:**
    ```json
    {
      "message": "success",
      "data": [{ "id": 1 }, ...]
    }
    ```

### Cleanup Benchmark Data
*   **URL:** `/api/benchmark/cleanup`
*   **Method:** `POST`
*   **Description:** Deletes all records from the benchmark table and resets the autoincrement counter.
*   **Response:**
    ```json
    {
      "message": "success",
      "deleted_rows": 100
    }
    ```

## Authentication & Accounts

### Create Admin Account
*   **URL:** `/api/create-admin`
*   **Method:** `POST`
*   **Description:** Creates the initial administrator account.
*   **Request Body:**
    ```json
    {
      "username": "admin",
      "password": "securepassword",
      "recovery_code": "ABC123XYZ"
    }
    ```
*   **Response:**
    ```json
    {
      "message": "Admin account created successfully",
      "adminId": 1
    }
    ```

### Admin Login
*   **URL:** `/api/login`
*   **Method:** `POST`
*   **Description:** Authenticates an admin user (used for troubleshooting access).
*   **Request Body:**
    ```json
    {
      "username": "admin",
      "password": "securepassword"
    }
    ```
*   **Response:**
    ```json
    {
      "message": "Login successful!"
    }
    ```

### Validate Recovery Code
*   **URL:** `/api/validate-recovery-code`
*   **Method:** `POST`
*   **Description:** Verifies if a provided recovery code matches the one stored for the given username.
*   **Request Body:**
    ```json
    {
      "username": "admin",
      "recovery_code": "ABC123XYZ"
    }
    ```
*   **Response:**
    ```json
    {
      "success": true,
      "message": "Recovery code is valid."
    }
    ```

## Configuration

### Save Color Scheme
*   **URL:** `/api/save-colors`
*   **Method:** `POST`
*   **Description:** Updates the primary and secondary theme colors.
*   **Request Body:**
    ```json
    {
      "primaryColor": "#00d1b2",
      "secondaryColor": "#4a4a4a"
    }
    ```
*   **Response:**
    ```json
    {
      "message": "Color configuration saved successfully."
    }
    ```

### Save Site Configuration
*   **URL:** `/api/save-site-config`
*   **Method:** `POST`
*   **Description:** Saves general site settings including branding images.
*   **Content-Type:** `multipart/form-data`
*   **Form Fields:**
    *   `siteName` (text)
    *   `primaryColor` (text)
    *   `secondaryColor` (text)
    *   `currencySymbol` (text)
    *   `logo` (file, optional)
    *   `banner` (file, optional)
*   **Response:**
    ```json
    {
      "message": "Site configuration saved successfully."
    }
    ```

### Setup Servicing Tables
*   **URL:** `/api/setup-servicing-tables`
*   **Method:** `POST`
*   **Description:** Creates the necessary database tables for the selected service types based on the `.servicing_vischem.sql` schema.
*   **Request Body:**
    ```json
    {
      "services": ["laundry", "repair"]
    }
    ```
*   **Response:**
    ```json
    {
      "message": "Successfully created 6 e-commerce service tables."
    }
    ```

## Troubleshooting

### Fix Database Schema
*   **URL:** `/api/troubleshoot/fix-schema`
*   **Method:** `POST`
*   **Description:** Manually applies specific migrations (e.g., adding `schedule_date` and `schedule_time` columns) to fix schema mismatches.
*   **Response:**
    ```json
    {
      "message": "Schema synchronization complete."
    }
    ```

### Check Schema Integrity
*   **URL:** `/api/troubleshoot/check-schema`
*   **Method:** `GET`
*   **Description:** Compares the current SQLite database structure against the definition in `.servicing_vischem.sql`.
*   **Response:**
    ```json
    {
      "missingTables": [],
      "optionalMissingTables": ["service_details_hotel"],
      "missingColumns": {},
      "status": "partial"
    }
    ```
    *   `status` can be: `"ok"`, `"partial"` (only optional tables missing), or `"mismatch"`.

## Common Scenarios

### Scenario 1: Initial Server Setup
**Goal:** Initialize a fresh installation of Mitra.
1.  **Verify Database:** Call `POST /api/test-db` to ensure SQLite is writable.
2.  **Create Admin:** Call `POST /api/create-admin` to set up the superuser.
3.  **Configure Branding:** Call `POST /api/save-site-config` with the business name and logo.
4.  **Install Services:** Call `POST /api/setup-servicing-tables` with the desired service types (e.g., `['laundry']`).

### Scenario 2: Recovering from Schema Errors
**Goal:** Fix "missing column" errors after an update.
1.  **Authenticate:** Call `POST /api/login` with admin credentials.
2.  **Diagnose:** Call `GET /api/troubleshoot/check-schema` to identify missing columns or tables.
3.  **Repair:** If mismatches are found, call `POST /api/troubleshoot/fix-schema` to apply migrations.

### Scenario 3: Performance Validation
**Goal:** Ensure the host machine can handle high transaction volumes.
1.  **Baseline:** Run `POST /api/benchmark/sequential-write` multiple times to test latency.
2.  **Stress Test:** Run `POST /api/benchmark/bulk-write` with a large payload (e.g., 1000 records).
3.  **Cleanup:** Always run `POST /api/benchmark/cleanup` after testing to keep the database size manageable.

## Error Handling

Most endpoints return standard HTTP status codes to indicate the result of the operation.

*   **200 OK / 201 Created:** The request was successful.
*   **400 Bad Request:** The request was missing required fields or contained invalid JSON.
*   **401 Unauthorized:** Authentication failed, or the user does not have permission (e.g., invalid recovery code).
*   **404 Not Found:** The requested resource (like an admin account to delete) does not exist.
*   **409 Conflict:** A unique constraint was violated (e.g., username already taken).
*   **500 Internal Server Error:** A server-side error occurred, such as a database failure or file system issue.

**Standard Error Response Format:**

```json
{
  "error": "Description of what went wrong."
}
```