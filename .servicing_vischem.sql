--
-- Demo SQL script for Mitra E-commerce Service Tables
--

-- Core table for all services offered by the business.
-- This table stores common information for any type of service.
CREATE TABLE services (
    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    -- The 'service_type' column is crucial. It tells the application
    -- which details table to join with (e.g., 'hotel_room', 'repair', 'food_item').
    service_type TEXT NOT NULL,
    description TEXT,
    base_price REAL NOT NULL DEFAULT 0.0,
    is_active BOOLEAN DEFAULT 1,
    image_url TEXT
);

-- Details specific to hotel room services.
-- This table has a one-to-one relationship with the 'services' table.
CREATE TABLE service_details_hotel (
    service_id INTEGER PRIMARY KEY,
    room_capacity INTEGER NOT NULL,
    bed_type TEXT, -- e.g., 'King', 'Queen', 'Twin'
    amenities TEXT, -- Could be a JSON string or comma-separated values like 'Wi-Fi,Pool View,Mini-bar'
    FOREIGN KEY (service_id) REFERENCES services (service_id) ON DELETE CASCADE
);

-- Details specific to tech repair services.
CREATE TABLE service_details_repair (
    service_id INTEGER PRIMARY KEY,
    device_category TEXT, -- e.g., 'Smartphone', 'Laptop', 'Tablet',
    duration_minutes INTEGER,
    warranty_days INTEGER DEFAULT 30,
    FOREIGN KEY (service_id) REFERENCES services (service_id) ON DELETE CASCADE
);

-- Details specific to food items (for restaurants, cafes, etc.).
CREATE TABLE service_details_food (
    service_id INTEGER PRIMARY KEY,
    food_category TEXT, -- e.g., 'Appetizer', 'Main Course', 'Dessert'
    dietary_info TEXT, -- e.g., 'Vegetarian', 'Gluten-Free', 'Spicy'
    calories INTEGER,
    FOREIGN KEY (service_id) REFERENCES services (service_id) ON DELETE CASCADE
);

-- Details specific to laundry services.
CREATE TABLE service_details_laundry (
    service_id INTEGER PRIMARY KEY,
    -- Example: 'Standard', 'Express'. This is a property of the service.
    turnaround_type TEXT DEFAULT 'Standard',
    -- Estimated time in hours for this service type.
    estimated_turnaround_hours INTEGER,
    FOREIGN KEY (service_id) REFERENCES services (service_id) ON DELETE CASCADE
);

-- Main table for customer bookings/orders.
CREATE TABLE bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_price REAL,
    status TEXT NOT NULL DEFAULT 'Pending', -- e.g., 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE SET NULL
);

-- Table for customer user accounts.
CREATE TABLE customers (
    customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for administrator accounts.
CREATE TABLE admin_login (
    admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    recovery_code TEXT,
    privilege TEXT DEFAULT 'admin'
);

-- Table for global site configuration settings.
CREATE TABLE page_config (
    config_id INTEGER PRIMARY KEY DEFAULT 1,
    page_name TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    banner_image TEXT,
    currency_symbol TEXT DEFAULT '$',
    page_logo TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table for promotional banners shown on the home page.
CREATE TABLE promotion_banners (
    banner_id INTEGER PRIMARY KEY AUTOINCREMENT,
    banner_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT, -- Optional: URL to navigate to when banner is clicked
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Links services to a specific booking. A single booking can have multiple items.
CREATE TABLE booking_items (
    booking_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time_of_booking REAL NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services (service_id) ON DELETE SET NULL
);

-- Manages availability for services that are time-based or have limited stock (e.g., hotel rooms, repair slots).
CREATE TABLE service_availability (
    availability_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    is_booked BOOLEAN DEFAULT 0,
    FOREIGN KEY (service_id) REFERENCES services (service_id) ON DELETE CASCADE
);