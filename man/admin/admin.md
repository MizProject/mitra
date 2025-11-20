# Mitra Administrator's Manual

This guide provides a comprehensive overview of the Mitra administrator panel. It covers all the features you need to manage your business, from daily operations to site customization.

## 1. Accessing the Admin Panel

To access the administrator panel, navigate to `/admin` on your website's domain.

**Example**: `http://localhost:3000/admin`

If you are not logged in, you will be redirected to the admin login page. Enter the administrator credentials that were created during the setup process.

## 2. The Dashboard

The Dashboard is the first page you see after logging in. It provides a quick, at-a-glance overview of your business's current status.

The dashboard displays several key metrics:

-   **Pending Bookings**: The total number of new bookings that require confirmation or action.
-   **Processing Bookings**: The total number of bookings that are currently in progress.
-   **Completed Today**: The number of bookings that have been marked as 'Completed' on the current day.
-   **Canceled Today**: The number of bookings that have been marked as 'Canceled' on the current day.

## 3. Managing Bookings

The "Bookings" section is where you will manage all customer orders. You can access it via the "Bookings" link in the main navigation.

### Viewing All Bookings

The main view displays a list of all bookings in reverse chronological order (newest first). Each entry shows the Booking ID, customer name, booking date, total price, and current status.

### Searching and Filtering Bookings

To find specific bookings, navigate to the "Search" page from the main menu. The search form allows you to filter bookings by:

-   **Booking ID**: Find an exact booking.
-   **Customer Name**: Search by the customer's first or last name.
-   **Customer Email**: Find all bookings associated with an email address.
-   **Status**: Filter for all bookings with a specific status (e.g., 'Pending', 'Completed').
-   **Date Range**: Find all bookings created between a start and end date.

### Viewing Booking Details

Clicking on any booking in the list (from either the main Bookings page or the Search results) will open a detailed modal window. This modal has three tabs:

#### General Info Tab

This tab provides a complete summary of the booking:

-   **Status**: The current status of the booking.
-   **Customer Details**: Name and contact information (email, phone).
-   **Address**: The customer's address is displayed here **only if** the booking involves a service pickup or delivery.
-   **Booking Details**: Date, total price, and the selected pickup/return methods.
-   **Items**: A list of all services included in the booking, with quantities and prices.

#### Action Tab

This tab allows you to modify the booking.

-   **Update Status**: You can change the booking's status using the dropdown menu. Select a new status (e.g., from 'Pending' to 'Processing') to update the order's progress. The change is saved automatically.

#### Generate Tab

This tab is for creating a physical or digital copy of the order.

-   **Generate Receipt**: A receipt with a QR code is displayed. This is useful for internal record-keeping or for staff to scan and retrieve order details.
-   **Download Receipt**: Click this button to save the generated receipt as a PNG image file.

## 4. Managing Services

The "Services" page allows you to manage the services your business offers to customers.

### Adding a New Service

1.  Click the **"Add New Service"** button.
2.  Fill out the form:
    -   **Service Name**: The public name of the service (e.g., "Men's T-Shirt Wash & Fold").
    -   **Service Type**: The category this service belongs to (e.g., `laundry`, `food`). This is determined by the services you initialized during setup.
    -   **Description**: A brief description of the service.
    -   **Base Price**: The cost of the service.
    -   **Image**: Upload an image for the service.
    -   **Is Active?**: Check this box to make the service visible and available to customers.
3.  Click **"Save"**.

### Editing or Deleting a Service

-   **Edit**: Click the "Edit" button on any service in the list to open the form and modify its details.
-   **Delete**: Click the "Delete" button to permanently remove a service. This action cannot be undone.

## 5. Managing Promotional Banners

The "Banners" page lets you control the promotional images displayed on the client-facing homepage slider.

### Adding a New Banner

1.  Click the **"Add New Banner"** button.
2.  Fill out the form:
    -   **Banner Name**: An internal name for the banner (e.g., "Summer Sale").
    -   **Image**: Upload the banner image.
    -   **Link URL (Optional)**: If you want the banner to be a clickable link, enter the destination URL here.
    -   **Display Order**: A number that controls the banner's position in the slider. Lower numbers appear first (e.g., 0 is before 1).
    -   **Is Active?**: Check this to make the banner appear on the site.
3.  Click **"Save"**.

### Editing or Deleting a Banner

-   **Edit/Delete**: Use the "Edit" and "Delete" buttons on each banner in the list to manage them.

## 6. Site Settings

The "Settings" page allows you to customize the global appearance of your client-facing website.

-   **Site Name**: The name of your business, displayed in the navigation bar and other places.
-   **Currency Symbol**: The currency symbol used for all prices (e.g., $, €, £).
-   **Primary/Secondary Color**: The main brand colors for your site.
-   **Site Logo/Banner**: Upload your business logo and a default hero banner for the main page.

Click **"Save Configuration"** to apply any changes.

## 7. Logging Out

To securely log out of the admin panel, click the **"Logout"** button in the main navigation bar.