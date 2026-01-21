# Mitra Runtime API Documentation

This document details the API endpoints available in the `runtime.js` service. These endpoints handle the core business logic, including customer bookings, admin management, and public data retrieval.

**Base URL:** `http://localhost:3000`

## Public Endpoints

These endpoints are accessible without authentication and are used to populate the frontend with site configuration and service offerings.

### Get Site Configuration
*   **URL:** `/api/get-site-config`
*   **Method:** `GET`
*   **Description:** Retrieves public site settings like branding, colors, and currency.
*   **Response:**
    ```json
    {
      "page_name": "My Business",
      "primary_color": "#00d1b2",
      "secondary_color": "#4a4a4a",
      "page_logo": "/runtime/data/images/logo.png",
      "banner_image": "/runtime/data/images/banner.jpg",
      "currency_symbol": "$"
    }
    ```

### Get Services
*   **URL:** `/api/get-services`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `type` (optional): Filter by service type (e.g., `laundry`).
*   **Description:** Retrieves a list of active services.
*   **Response:**
    ```json
    [
      {
        "service_id": 1,
        "service_name": "Standard Wash",
        "service_type": "laundry",
        "description": "Basic wash and fold.",
        "base_price": 10.00,
        "image_url": "/runtime/data/images/wash.jpg"
      }
    ]
    ```

### Get Service Types
*   **URL:** `/api/get-service-types`
*   **Method:** `GET`
*   **Description:** Returns a list of unique service categories currently active.
*   **Response:** `["laundry", "repair"]`

### Get Promotional Banners
*   **URL:** `/api/get-banners`
*   **Method:** `GET`
*   **Description:** Retrieves active promotional banners for the home page.
*   **Response:**
    ```json
    [
      { "image_url": "...", "link_url": "..." }
    ]
    ```

---

## Customer API

These endpoints require customer authentication (session-based).

### Customer Registration
*   **URL:** `/api/customer/register`
*   **Method:** `POST`
*   **Body:**
    ```json
    {
      "email": "user@example.com",
      "password": "password123",
      "firstName": "John",
      "lastName": "Doe"
    }
    ```
*   **Response:** `{ "message": "Customer account created successfully.", "customerId": 1 }`

### Customer Login
*   **URL:** `/api/customer/login`
*   **Method:** `POST`
*   **Body:** `{ "email": "...", "password": "..." }`
*   **Response:** `{ "message": "Login successful!", "customerId": 1 }`

### Get Customer Details
*   **URL:** `/api/customer/details`
*   **Method:** `GET`
*   **Description:** Retrieves profile information for the logged-in customer.
*   **Response:** `{ "customer_id": 1, "first_name": "John", "email": "...", ... }`

### Update Customer Details
*   **URL:** `/api/customer/update-details`
*   **Method:** `POST`
*   **Body:** `{ "firstName": "...", "lastName": "...", "phoneNumber": "..." }`
*   **Response:** `{ "message": "Your details have been updated successfully." }`

### Update Address
*   **URL:** `/api/customer/update-address`
*   **Method:** `POST`
*   **Body:**
    ```json
    {
      "address_line1": "123 Main St",
      "address_line2": "Apt 4B",
      "city": "Metropolis",
      "state_province": "NY",
      "postal_code": "10001",
      "country": "USA"
    }
    ```
*   **Response:** `{ "message": "Address updated successfully." }`

### Create Booking
*   **URL:** `/api/customer/create-booking`
*   **Method:** `POST`
*   **Description:** Creates a new order. Prices are verified server-side.
*   **Body:**
    ```json
    {
      "items": [
        { "service_id": 1, "quantity": 2 }
      ],
      "pickup_method": "service_pickup",
      "return_method": "service_delivery",
      "schedule_date": "2023-12-25",
      "schedule_time": "14:00"
    }
    ```
*   **Response:** `{ "message": "Booking created successfully.", "bookingId": 101 }`

### Get Customer Bookings
*   **URL:** `/api/customer/bookings`
*   **Method:** `GET`
*   **Description:** Retrieves all bookings for the logged-in user.
*   **Response:**
    ```json
    [
      {
        "booking_id": 101,
        "status": "Pending",
        "total_price": 20.00,
        "items": "[...]" // JSON string of items
      }
    ]
    ```

### Cancel Booking
*   **URL:** `/api/customer/bookings/:bookingId/cancel`
*   **Method:** `POST`
*   **Description:** Cancels a booking if it is still in 'Pending' status.
*   **Response:** `{ "message": "Booking has been successfully canceled." }`

---

## Admin API

These endpoints require admin authentication.

### Admin Login
*   **URL:** `/api/admin/login`
*   **Method:** `POST`
*   **Body:** `{ "username": "admin", "password": "..." }`
*   **Response:** `{ "message": "Login successful!" }`

### Dashboard Statistics
*   **URL:** `/api/admin/dashboard-stats`
*   **Method:** `GET`
*   **Description:** Returns counts for pending, processing, and completed orders.
*   **Response:**
    ```json
    {
      "pendingTotal": 5,
      "processingTotal": 2,
      "completedToday": 10,
      "canceledToday": 0
    }
    ```

### Manage Bookings

#### Get All Bookings
*   **URL:** `/api/admin/bookings`
*   **Method:** `GET`
*   **Response:** List of all bookings with customer details.

#### Get Booking Details
*   **URL:** `/api/admin/bookings/:bookingId`
*   **Method:** `GET`
*   **Response:** Detailed view of a single booking, including items and customer address.

#### Search Bookings
*   **URL:** `/api/admin/search-bookings`
*   **Method:** `GET`
*   **Query Parameters:** `bookingId`, `name`, `email`, `status`, `startDate`, `endDate`
*   **Response:** Filtered list of bookings.

#### Update Booking Status
*   **URL:** `/api/admin/bookings/:bookingId/status`
*   **Method:** `PUT`
*   **Body:** `{ "status": "Processing" }`
*   **Response:** `{ "message": "Booking status updated successfully." }`

### Manage Services

#### Create Service
*   **URL:** `/api/admin/services`
*   **Method:** `POST`
*   **Content-Type:** `multipart/form-data`
*   **Fields:** `service_name`, `service_type`, `description`, `base_price`, `is_active`, `image` (file)
*   **Response:** `{ "message": "Service created successfully.", "serviceId": 5 }`

#### Update Service
*   **URL:** `/api/admin/services/:id`
*   **Method:** `PUT`
*   **Content-Type:** `multipart/form-data`
*   **Fields:** Same as create, plus optional `remove_image` (boolean).
*   **Response:** `{ "message": "Service updated successfully." }`

#### Delete Service
*   **URL:** `/api/admin/services/:id`
*   **Method:** `DELETE`
*   **Response:** `{ "message": "Service deleted successfully." }`

### Manage Site Configuration

#### Update Site Config
*   **URL:** `/api/admin/site-config`
*   **Method:** `POST`
*   **Content-Type:** `multipart/form-data`
*   **Fields:** `siteName`, `primaryColor`, `secondaryColor`, `currencySymbol`, `logo` (file), `banner` (file), `remove_logo`, `remove_banner`
*   **Response:** `{ "message": "Site configuration updated successfully." }`

### Manage Admin Accounts

#### Get Accounts
*   **URL:** `/api/admin/accounts`
*   **Method:** `GET`
*   **Response:** List of admin users.

#### Create Admin Account
*   **URL:** `/api/admin/accounts`
*   **Method:** `POST`
*   **Body:** `{ "username": "...", "password": "...", "privilege": "admin" }`
*   **Response:** `{ "message": "Admin account created successfully." }`

#### Regenerate Recovery Code
*   **URL:** `/api/admin/accounts/:id/regenerate-recovery-code`
*   **Method:** `POST`
*   **Response:** `{ "message": "...", "newRecoveryCode": "XYZ..." }`

---

## WebSocket Events

The runtime server uses `socket.io` for real-time updates.

### Event: `booking_update`
*   **Direction:** Server -> Client
*   **Description:** Broadcasted when a booking status changes.
*   **Payload:**
    ```json
    {
      "type": "booking_update",
      "bookingId": 101,
      "status": "Processing"
    }
    ```

## Common Scenarios

### Scenario 1: Customer Booking Flow
**Goal:** A new customer registers and places an order.
1.  **Register:** Call `POST /api/customer/register` with user details.
2.  **Login:** Call `POST /api/customer/login` to establish a session.
3.  **Browse:** Call `GET /api/get-services` to see available items.
4.  **Order:** Call `POST /api/customer/create-booking` with the selected service IDs and quantities.
5.  **Verify:** Call `GET /api/customer/bookings` to confirm the order status is 'Pending'.

### Scenario 2: Admin Order Fulfillment
**Goal:** An admin processes a new order.
1.  **Login:** Call `POST /api/admin/login` with admin credentials.
2.  **Monitor:** Call `GET /api/admin/dashboard-stats` to check for pending orders.
3.  **Review:** Call `GET /api/admin/bookings` to find the specific booking ID.
4.  **Update:** Call `PUT /api/admin/bookings/:bookingId/status` with `{ "status": "Processing" }` to start work.
5.  **Complete:** Call `PUT /api/admin/bookings/:bookingId/status` with `{ "status": "Completed" }` when finished.

### Scenario 3: Updating Site Branding
**Goal:** Change the logo and primary color.
1.  **Login:** Call `POST /api/admin/login`.
2.  **Update:** Call `POST /api/admin/site-config` with `primaryColor` and a new `logo` file.
3.  **Verify:** Call `GET /api/get-site-config` (public endpoint) to see the changes reflected.

## Error Handling

Most endpoints return standard HTTP status codes to indicate the result of the operation.

*   **200 OK / 201 Created:** The request was successful.
*   **400 Bad Request:** The request was missing required fields or contained invalid JSON.
*   **401 Unauthorized:** Authentication failed (e.g., session expired or invalid credentials).
*   **403 Forbidden:** The user is authenticated but does not have permission (e.g., deleting another user's account).
*   **404 Not Found:** The requested resource (booking, service, etc.) does not exist.
*   **409 Conflict:** A unique constraint was violated (e.g., email already registered).
*   **500 Internal Server Error:** A server-side error occurred.

**Standard Error Response Format:**

```json
{
  "error": "Description of what went wrong."
}
```