// Runtime JS for Mitra, a business booking application

console.log("Starting Mitra Runtime...");
console.log("Initializing Core Dependencies...");

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = 3000; // Standard port for the main application

let debugMode = process.argv.includes('--debug');
let logFilePath;

if (debugMode) {
    console.log("Runtime is being run in development mode with --debug flag.");
    const logDir = path.join(__dirname, 'runtime', 'data', 'logs');
    mkdirp.sync(logDir);
    const logFileName = `debug-Mitra-runtime-log-${new Date().toISOString().replace(/:/g, '-')}.log`;
    logFilePath = path.join(logDir, logFileName);
    fs.writeFileSync(logFilePath, `Debug Log Created on ${new Date().toISOString()}\n\n`);
}

function debugLogWriteToFile(message) {
    if (!debugMode) return;
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFilePath, logEntry);
}

console.log = (message) => {
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    if (debugMode) fs.appendFileSync(logFilePath, logEntry);
    process.stdout.write(logEntry);
};

console.error = (message) => {
    const logEntry = `[${new Date().toISOString()}] ERROR: ${message}\n`;
    if (debugMode) fs.appendFileSync(logFilePath, logEntry);
    process.stderr.write(logEntry);
};

debugLogWriteToFile("Core dependencies loaded.");

// --- Middleware ---
app.use(bodyParser.json());
debugLogWriteToFile("Body-parser JSON middleware enabled.");

// Session middleware
app.use(session({
    secret: crypto.randomBytes(32).toString('hex'), // A strong, random secret
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // Set to true if you're using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
debugLogWriteToFile("Express-session middleware enabled.");

// --- Static Asset Serving ---
debugLogWriteToFile("Configuring static asset hosting.");
app.use('/assets/npm', express.static(path.join(__dirname, 'node_modules')));
app.use('/assets/runtime', express.static(path.join(__dirname, 'runtime/')));

// Serve user-uploaded content (logos, banners)
const uploadDir = path.join(__dirname, 'runtime/data/images');
app.use('/runtime/data/images', express.static(uploadDir));

debugLogWriteToFile("Static asset routes configured.");

// --- Database Connection ---
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`FATAL: Error opening database ${dbPath}: ${err.message}`);
        process.exit(1); // Exit if the database can't be opened.
    } else {
        console.log(`Successfully connected to database ${dbPath}`);
        debugLogWriteToFile(`Successfully connected to database ${dbPath}`);
    }
});

// --- Frontend Serving ---
app.get('/', (req, res) => {
    if (req.session.customerId) {
        res.redirect('/home');
    } else {
        res.sendFile(path.join(__dirname, 'runtime/client/index.html'));
    }
});

app.get('/admin-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/index.html'));
})

app.get('/login-customer', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/assets/html/login.html'));
})

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/assets/html/home.html'));
})


app.get('/order-request', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/assets/html/order-request.html'));
})

app.get('/order-request', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/assets/html/order-request.html'));
})

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/assets/html/checkout.html'));
})

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/assets/html/settings.html'));
});

app.get('/my-bookings', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/assets/html/my-bookings.html'));
});

// app.get('/order-confirmation', (req, res) => {
//     res.sendFile(path.join(__dirname'));
// })

// --- Runtime API Endpoints ---

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    const sql = 'SELECT * FROM admin_login WHERE username = ?';
    db.get(sql, [username], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: "Invalid username or password." });
        }
        try {
            const match = await bcrypt.compare(password, row.password);
            if (match) {
                res.json({ message: "Login successful!" });
            } else {
                res.status(401).json({ error: "Invalid username or password." });
            }
        } catch (error) {
            res.status(500).json({ error: "Error during authentication." });
        }
    });
});

app.post('/api/validate-recovery-code', (req, res) => {
    const { username, recovery_code } = req.body;
    if (!username || !recovery_code) {
        return res.status(400).json({ error: "Username and recovery code are required." });
    }

    const sql = 'SELECT recovery_code FROM admin_login WHERE username = ?';
    db.get(sql, [username], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error during recovery." });
        }
        if (!row || !row.recovery_code) {
            return res.status(401).json({ error: "Invalid username or recovery code." });
        }

        const storedCodeBuffer = Buffer.from(row.recovery_code);
        const providedCodeBuffer = Buffer.from(recovery_code);

        if (storedCodeBuffer.length !== providedCodeBuffer.length) {
            return res.status(401).json({ error: "Invalid username or recovery code." });
        }

        const match = crypto.timingSafeEqual(storedCodeBuffer, providedCodeBuffer);
        res.json({ success: match, message: match ? "Recovery code is valid." : "Invalid username or recovery code." });
    });
});

app.get('/api/get-site-config', (req, res) => {
    debugLogWriteToFile("Received request for /api/get-site-config");
    const sql = 'SELECT page_name, primary_color, secondary_color, page_logo, banner_image FROM page_config WHERE config_id = 1';

    db.get(sql, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row || {});
    });
});

app.get('/api/get-services', (req, res) => {
    debugLogWriteToFile("Received request for /api/get-services");
    const serviceType = req.query.type;

    let sql = 'SELECT service_id, service_name, description, base_price, image_url FROM services WHERE is_active = 1';
    const params = [];

    if (serviceType) {
        sql += ' AND service_type = ?';
        params.push(serviceType);
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

app.get('/api/get-banners', (req, res) => {
    debugLogWriteToFile("Received request for /api/get-banners");
    const sql = 'SELECT image_url, link_url FROM promotion_banners WHERE is_active = 1 ORDER BY display_order ASC';

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(`Error fetching banners: ${err.message}`);
            debugLogWriteToFile(`Error fetching banners: ${err.message}`);
            return res.status(500).json({ error: 'Failed to retrieve promotional banners.' });
        }
        res.json(rows || []);
    });
});

app.get('/api/get-service-types', (req, res) => {
    debugLogWriteToFile("Received request for /api/get-service-types");
    // This query finds all unique, non-null service types that are currently active.
    const sql = 'SELECT DISTINCT service_type FROM services WHERE is_active = 1 AND service_type IS NOT NULL';

    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows.map(row => row.service_type) || []);
    });
});

app.get('/api/get-service-details', (req, res) => {
    const serviceType = req.query.type;

    if (!serviceType) {
        return res.status(400).json({ error: "Service type is required." });
    }

    // Adjust the query based on your actual table structure
    const sql = `SELECT * FROM service_details_${serviceType} LIMIT 1`;

    db.get(sql, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(row || {});
    });
});

app.post('/api/customer/register', async (req, res) => {
    debugLogWriteToFile("Received request for /api/customer/register");
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const sql = 'INSERT INTO customers (email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?)';
        db.run(sql, [email, password_hash, firstName, lastName], function(err) {
            if (err) {
                // Check for unique constraint violation
                if (err.message.includes('UNIQUE constraint failed: customers.email')) {
                    return res.status(409).json({ error: 'A customer with this email already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ message: "Customer account created successfully.", customerId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to create customer account." });
    }
});

app.get('/api/customer/bookings', (req, res) => {
    debugLogWriteToFile("Request for customer bookings received.");
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    const customerId = req.session.customerId;
    // This query fetches each booking and aggregates its items into a JSON array,
    // which is very efficient for the frontend to process.
    const sql = `
        SELECT
            b.booking_id,
            b.booking_date,
            b.total_price,
            b.status,
            (
                SELECT json_group_array(
                    json_object(
                        'service_type', s.service_type,
                        'service_name', s.service_name,
                        'quantity', bi.quantity,
                        'price', bi.price_at_time_of_booking
                    )
                )
                FROM booking_items bi
                JOIN services s ON s.service_id = bi.service_id
                WHERE bi.booking_id = b.booking_id
            ) AS items
        FROM bookings b
        WHERE b.customer_id = ?
        ORDER BY b.booking_date DESC
    `;

    db.all(sql, [customerId], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve your bookings." });
        res.json(rows || []);
    });
});

app.post('/api/customer/bookings/:bookingId/cancel', (req, res) => {
    debugLogWriteToFile("Request to cancel a booking received.");
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    const customerId = req.session.customerId;
    const bookingId = req.params.bookingId;

    // This query ensures a user can only cancel their own bookings, and only if the status is 'Pending'.
    const sql = 'UPDATE bookings SET status = ? WHERE booking_id = ? AND customer_id = ? AND status = ?';

    db.run(sql, ['Canceled', bookingId, customerId, 'Pending'], function(err) {
        if (err) {
            debugLogWriteToFile(`Database error canceling booking: ${err.message}`);
            return res.status(500).json({ error: "Failed to cancel the booking." });
        }
        if (this.changes === 0) {
            // This means no row was updated, either because the booking doesn't exist,
            // doesn't belong to the user, or is no longer in 'Pending' status.
            return res.status(403).json({ error: "This booking cannot be canceled." });
        }
        res.json({ message: "Booking has been successfully canceled." });
    });
});

app.post('/api/customer/update-details', (req, res) => {
    debugLogWriteToFile("Request to update customer details received.");
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    const customerId = req.session.customerId;
    const { firstName, lastName, phoneNumber } = req.body;

    if (!firstName || !lastName) {
        return res.status(400).json({ error: "First name and last name are required." });
    }

    const sql = 'UPDATE customers SET first_name = ?, last_name = ?, phone_number = ? WHERE customer_id = ?';
    db.run(sql, [firstName, lastName, phoneNumber, customerId], function(err) {
        if (err) {
            debugLogWriteToFile(`Database error updating details: ${err.message}`);
            return res.status(500).json({ error: "Failed to update details." });
        }
        res.json({ message: "Your details have been updated successfully." });
    });
});

app.post('/api/customer/update-password', (req, res) => {
    debugLogWriteToFile("Request to update customer password received.");
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    const customerId = req.session.customerId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current and new passwords are required." });
    }

    const sql = 'SELECT password_hash FROM customers WHERE customer_id = ?';
    db.get(sql, [customerId], async (err, row) => {
        if (err || !row) {
            return res.status(500).json({ error: "Could not retrieve user data." });
        }

        const match = await bcrypt.compare(currentPassword, row.password_hash);
        if (!match) {
            return res.status(401).json({ error: "Your current password is not correct." });
        }

        try {
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            const updateSql = 'UPDATE customers SET password_hash = ? WHERE customer_id = ?';
            db.run(updateSql, [newPasswordHash, customerId], function(err) {
                if (err) return res.status(500).json({ error: "Failed to update password." });
                res.json({ message: "Password updated successfully." });
            });
        } catch (error) {
            res.status(500).json({ error: "An error occurred while updating your password." });
        }
    });
});

app.post('/api/customer/login', (req, res) => {
    debugLogWriteToFile("Received request for /api/customer/login");
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const sql = 'SELECT * FROM customers WHERE email = ?';
    db.get(sql, [email], async (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        try {
            const match = await bcrypt.compare(password, row.password_hash);
            if (match) {
                // Set customerId in the session
                req.session.customerId = row.customer_id;
                res.json({ message: "Login successful!", customerId: req.session.customerId });
            } else {
                res.status(401).json({ error: "Invalid email or password." });
            }
        } catch (error) {
            res.status(500).json({ error: "Error during authentication." });
        }
    });
});

app.get('/api/customer/session-status', (req, res) => {
    debugLogWriteToFile("Checking customer session status.");
    if (req.session && req.session.customerId) {
        res.json({ loggedIn: true, customerId: req.session.customerId });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/api/customer/details', (req, res) => {
    debugLogWriteToFile("Request for current customer details received.");
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    const customerId = req.session.customerId;
    const sql = 'SELECT customer_id, email, first_name, last_name, phone_number FROM customers WHERE customer_id = ?';

    db.get(sql, [customerId], (err, row) => {
        if (err) {
            debugLogWriteToFile(`Database error fetching customer details: ${err.message}`);
            return res.status(500).json({ error: "Failed to retrieve customer details." });
        }
        if (!row) {
            return res.status(404).json({ error: "Customer not found." });
        }
        res.json(row);
    });
});

app.post('/api/customer/create-booking', (req, res) => {
    debugLogWriteToFile("Received request to create a new booking.");

    // 1. Authentication Check: Ensure a customer is logged in.
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "You must be logged in to place an order." });
    }

    const { items } = req.body; // Expecting an array of { service_id, quantity }
    const customerId = req.session.customerId;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Booking request must contain at least one item." });
    }

    // 2. Database Transaction: Use a transaction to ensure all-or-nothing insertion.
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // 3. Fetch Prices & Calculate Total: Get prices from DB to prevent client-side tampering.
        const serviceIds = items.map(item => item.service_id);
        const placeholders = serviceIds.map(() => '?').join(',');
        const priceCheckSql = `SELECT service_id, base_price FROM services WHERE service_id IN (${placeholders})`;

        db.all(priceCheckSql, serviceIds, (err, services) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Failed to verify service prices." });
            }

            let totalPrice = 0;
            const priceMap = new Map(services.map(s => [parseInt(s.service_id, 10), s.base_price]));

            for (const item of items) {
                if (!priceMap.has(item.service_id)) {
                    db.run("ROLLBACK");
                    return res.status(400).json({ error: `Invalid service_id provided: ${item.service_id}` });
                }
                totalPrice += priceMap.get(item.service_id) * item.quantity;
            }

            // 4. Create Booking Record
            const bookingSql = 'INSERT INTO bookings (customer_id, total_price, status) VALUES (?, ?, ?)';
            db.run(bookingSql, [customerId, totalPrice, 'Pending'], function(err) {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: "Failed to create booking record." });
                }
                const bookingId = this.lastID;

                // 5. Create Booking Items Records
                const itemSql = 'INSERT INTO booking_items (booking_id, service_id, quantity, price_at_time_of_booking) VALUES (?, ?, ?, ?)';
                const itemStmt = db.prepare(itemSql);
                for (const item of items) {
                    itemStmt.run(bookingId, item.service_id, item.quantity, priceMap.get(item.service_id));
                }
                itemStmt.finalize((err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: "Failed to save booking items." });
                    }
                    db.run("COMMIT");
                    res.status(201).json({ message: "Booking created successfully.", bookingId: bookingId });
                });
            });
        });
    });
});

app.post('/api/customer/logout', (req, res) => {
    debugLogWriteToFile("Customer logout request received.");
    req.session.destroy(err => {
        if (err) {
            debugLogWriteToFile(`Error destroying session: ${err.message}`);
            return res.status(500).json({ error: 'Could not log out at this time.' });
        }
        // Optional: clear the cookie, though destroy() usually handles it.
        res.clearCookie('connect.sid'); 
        res.json({ message: 'Logout successful.' });
    });
});

// --- Server Start ---
// Check for essential tables before starting the server to ensure the database is initialized.
db.all("SELECT name FROM sqlite_master WHERE type='table' AND (name='services' OR name='promotion_banners')", (err, tables) => {
    if (err) {
        console.error(`Database check failed: ${err.message}`);
        process.exit(1);
    }

    const tableNames = tables.map(t => t.name);
    const missingTables = [];
    if (!tableNames.includes('services')) missingTables.push('services');
    if (!tableNames.includes('promotion_banners')) missingTables.push('promotion_banners');

    if (missingTables.length > 0) {
        console.error(`FATAL: The database is missing required tables: ${missingTables.join(', ')}.`);
        console.error("Please run the setup process (node setup.js) to initialize the database correctly before starting the runtime server.");
        process.exit(1);
    }

    app.listen(port, () => {
        console.log(`Mitra Runtime server is running on http://localhost:${port}/`);
    });
});