--
-- Demo SQL script for Mitra E-commerce Service Tables
--

-- Core table for all services offered by the business.
-- This table stores common information for any type of service.
CREATE TABLE services (
    service_id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    description TEXT,
    base_price REAL NOT NULL,
    -- The 'service_type' column is crucial. It tells the application
    -- which details table to join with (e.g., 'hotel_room', 'repair', 'food_item').
    service_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT 1
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
    device_category TEXT, -- e.g., 'Smartphone', 'Laptop', 'Tablet'
    estimated_duration_hours REAL,
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
    load_type TEXT, -- e.g., 'Standard Wash', 'Delicates', 'Dry Cleaning'
    weight_limit_kg REAL,
    FOREIGN KEY (service_id) REFERENCES services (service_id) ON DELETE CASCADE
);

-- Main table for customer bookings/orders.
CREATE TABLE bookings (
    booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER, -- This would link to a 'customers' table
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_price REAL,
    status TEXT NOT NULL DEFAULT 'Pending' -- e.g., 'Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'
);

-- Links services to a specific booking. A single booking can have multiple items.
CREATE TABLE booking_items (
    booking_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_time_of_booking REAL NOT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services (service_id) ON DELETE RESTRICT
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