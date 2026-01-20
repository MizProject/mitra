// Runtime JS for Mitra, a business booking application
// License: MIT

console.log("Starting Mitra Runtime...");
console.log("Initializing Core Dependencies...");

const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');
const crypto = require('crypto');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const { Server } = require("socket.io");
const bcrypt = require('bcrypt');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const SQLiteStore = require('connect-sqlite3')(session);
const multer = require('multer');
const { addressBook } = require('fontawesome');

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
app.use(express.json()); // Modern replacement for body-parser
debugLogWriteToFile("Body-parser JSON middleware enabled.");

app.use(cookieParser());

// --- Session Persistence ---
// Load or generate a persistent session secret to keep users logged in across server restarts.
const dataDir = path.join(__dirname, 'runtime', 'data');
mkdirp.sync(dataDir);

const secretFilePath = path.join(__dirname, 'runtime', 'data', 'session_secret.txt');
let sessionSecret;
if (fs.existsSync(secretFilePath)) {
    sessionSecret = fs.readFileSync(secretFilePath, 'utf8');
} else {
    sessionSecret = crypto.randomBytes(32).toString('hex');
    try {
        fs.writeFileSync(secretFilePath, sessionSecret);
    } catch (e) {
        console.error("Failed to write session secret to disk:", e);
    }
}
// Session middleware
app.use(session({
    store: new SQLiteStore({
        db: 'sessions.sqlite',
        dir: dataDir
    }),
    secret: sessionSecret, // Use the persistent secret
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
mkdirp.sync(uploadDir); // Ensure upload directory exists
app.use('/runtime/data/images', express.static(uploadDir));

// Multer storage configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });

debugLogWriteToFile("Static asset routes configured.");

// --- HTTP & WebSocket Server Setup ---
const server = http.createServer(app);
const io = new Server(server);

function broadcastUpdate(data) {
    io.emit('booking_update', data);
}

// --- Database Connection ---
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`FATAL: Error opening database ${dbPath}: ${err.message}`);
        process.exit(1); // Exit if the database can't be opened.
    } else {
        console.log(`Successfully connected to database ${dbPath}`);
        debugLogWriteToFile(`Successfully connected to database ${dbPath}`);

        // --- Schema Verification ---
        // Check if the database schema is up to date.
        const requiredSchema = {
            'customers': ['address_line1', 'address_line2', 'city', 'state_province', 'postal_code', 'country'],
            'bookings': ['pickup_method', 'return_method', 'schedule_date', 'schedule_time']
        };

        Object.entries(requiredSchema).forEach(([table, columns]) => {
            db.all(`PRAGMA table_info(${table})`, (err, rows) => {
                if (err || !rows) return;

                const existingColumns = rows.map(row => row.name);
                const missingColumns = columns.filter(col => !existingColumns.includes(col));

                if (missingColumns.length > 0) {
                    const msg = `[WARNING] Database schema mismatch detected in table '${table}'. Missing columns: ${missingColumns.join(', ')}. Please run 'node setup.js' to update your database schema.`;
                    console.warn(`\n${msg}\n`);
                    debugLogWriteToFile(msg);
                }
            });
        });
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

app.get('/admin', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/index.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/assets/html/login.html'));
})

app.get('/admin/bookings', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/assets/html/bookings.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin/banners', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/assets/html/banners.html'));
    } else {
        res.redirect('/admin-login');
    }
})

app.get('/admin/settings', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/assets/html/settings.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin/accounts', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/assets/html/accounts.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin/search', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/assets/html/search.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/admin/about', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/assets/html/about.html'));
    } else {
        res.redirect('/admin-login');
    }
});

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

app.post('/api/admin/login', (req, res) => {
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
                req.session.adminId = row.admin_id; // Set admin-specific session
                res.json({ message: "Login successful!" });
            } else {
                res.status(401).json({ error: "Invalid username or password." });
            }
        } catch (error) {
            res.status(500).json({ error: "Error during authentication." });
        }
    });
});

app.get('/api/admin/session-status', (req, res) => {
    debugLogWriteToFile("Checking admin session status.");
    if (req.session && req.session.adminId) {
        res.json({ loggedIn: true, adminId: req.session.adminId });
    } else {
        res.json({ loggedIn: false });
    }
});

app.post('/api/admin/logout', (req, res) => {
    debugLogWriteToFile("Admin logout request received.");
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ error: 'Could not log out.' });
        }
        res.json({ message: 'Logout successful.' });
    });
});

app.get('/api/admin/bookings', (req, res) => {
    debugLogWriteToFile("Admin request for all bookings received.");
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const sql = `
        SELECT
            b.booking_id,
            b.booking_date,
            b.total_price,
            b.status,
            b.schedule_date,
            b.schedule_time,
            c.first_name,
            c.last_name,
            c.email
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.customer_id
        ORDER BY b.booking_date DESC
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            debugLogWriteToFile(`Database error fetching all bookings: ${err.message}`);
            return res.status(500).json({ error: "Failed to retrieve bookings." });
        }
        res.json(rows || []);
    });
});

app.get('/api/admin/bookings/:bookingId', (req, res) => {
    debugLogWriteToFile("Admin request for a single booking received.");
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { bookingId } = req.params;

    const sql = `
        SELECT
            b.booking_id,
            b.booking_date,
            b.total_price,
            b.status,
            b.pickup_method,
            b.return_method,
            b.schedule_date,
            b.schedule_time,
            c.first_name,
            c.last_name,
            c.email,
            c.phone_number,
            c.address_line1,
            c.address_line2,
            c.city,
            c.state_province,
            c.postal_code,
            c.country,
            (
                SELECT json_group_array(
                    json_object(
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
        JOIN customers c ON b.customer_id = c.customer_id
        WHERE b.booking_id = ?
    `;

    db.get(sql, [bookingId], (err, row) => {
        if (err) {
            debugLogWriteToFile(`Database error fetching single booking: ${err.message}`);
            return res.status(500).json({ error: "Failed to retrieve booking details." });
        }
        if (!row) return res.status(404).json({ error: "Booking not found." });
        res.json(row);
    });
});

app.get('/admin/services', (req, res) => {
    if (req.session.adminId) {
        res.sendFile(path.join(__dirname, 'runtime/admin/assets/html/services.html'));
    } else {
        res.redirect('/admin-login');
    }
});

app.get('/api/admin/dashboard-stats', (req, res) => {
    debugLogWriteToFile("Admin request for dashboard stats received.");
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    // This single query uses conditional aggregation to get all stats at once.
    // It uses 'localtime' to count stats relative to the server's current day.
    const sql = `
        SELECT
            COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pendingTotal,
            COUNT(CASE WHEN status = 'Processing' THEN 1 END) as processingTotal,
            COUNT(CASE WHEN status = 'Completed' AND date(booking_date) = date('now', 'localtime') THEN 1 END) as completedToday,
            COUNT(CASE WHEN status = 'Canceled' AND date(booking_date) = date('now', 'localtime') THEN 1 END) as canceledToday
        FROM bookings;
    `;

    db.get(sql, [], (err, row) => {
        if (err) {
            debugLogWriteToFile(`Database error fetching dashboard stats: ${err.message}`);
            return res.status(500).json({ error: "Failed to retrieve dashboard statistics." });
        }
        res.json(row || { pendingTotal: 0, processingTotal: 0, completedToday: 0, canceledToday: 0 });
    });
});

app.get('/api/admin/services', (req, res) => {
    debugLogWriteToFile("Admin request for all services received.");
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }
    const sql = 'SELECT * FROM services ORDER BY service_name ASC';
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve services." });
        res.json(rows || []);
    });
});

app.post('/api/admin/services', upload.single('image'), (req, res) => {
    if (!req.session || !req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { service_name, service_type, description, base_price, is_active } = req.body;
    if (!service_name || !service_type) {
        return res.status(400).json({ error: "Service Name and Service Type are required." });
    }

    // Use uploaded file if available, otherwise use a placeholder.
    const image_url = req.file ? `/runtime/data/images/${req.file.filename}` : '/assets/runtime/data/images/s/placeholder.png';
    const sql = 'INSERT INTO services (service_name, service_type, description, base_price, is_active, image_url) VALUES (?, ?, ?, ?, ?, ?)';
    db.run(sql, [service_name, service_type, description, base_price, is_active === 'true' ? 1 : 0, image_url], function(err) {
        if (err) return res.status(500).json({ error: "Database error creating service." });
        res.status(201).json({ message: "Service created successfully.", serviceId: this.lastID });
    });
});

app.put('/api/admin/services/:id', upload.single('image'), (req, res) => {
    if (!req.session || !req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    const { service_name, service_type, description, base_price, is_active, remove_image } = req.body;

    if (!service_name || !service_type) {
        return res.status(400).json({ error: "Service Name and Service Type are required." });
    }

    // Handle image deletion if replacing or removing
    if (req.file || remove_image === 'true') {
        db.get('SELECT image_url FROM services WHERE service_id = ?', [id], (err, row) => {
            if (row && row.image_url && !row.image_url.includes('placeholder')) {
                try { fs.unlinkSync(path.join(__dirname, row.image_url)); } catch(e) {}
            }
        });
    }

    let sql = 'UPDATE services SET service_name = ?, service_type = ?, description = ?, base_price = ?, is_active = ?';
    const params = [service_name, service_type, description, base_price, is_active === 'true' ? 1 : 0];

    if (req.file) {
        sql += ', image_url = ?';
        params.push(`/runtime/data/images/${req.file.filename}`);
    } else if (remove_image === 'true') {
        sql += ', image_url = ?';
        params.push('/assets/runtime/data/images/s/placeholder.png');
    }

    sql += ' WHERE service_id = ?';
    params.push(id);

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: "Database error updating service." });
        res.json({ message: "Service updated successfully." });
    });
});

app.delete('/api/admin/services/:id', (req, res) => {
    if (!req.session || !req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    // First, get the image path to delete the file
    db.get('SELECT image_url FROM services WHERE service_id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: "Error finding service." });
        if (row && row.image_url) {
            // Construct the full file path
            const filePath = path.join(__dirname, row.image_url);
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error(`Failed to delete service image file: ${filePath}`, unlinkErr);
            });
        }

        // Then, delete the database record
        db.run('DELETE FROM services WHERE service_id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: "Database error deleting service." });
            if (this.changes === 0) return res.status(404).json({ error: "Service not found." });
            res.json({ message: "Service deleted successfully." });
        });
    });
});

app.get('/api/admin/search-bookings', (req, res) => {
    debugLogWriteToFile("Admin search for bookings received.");
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { bookingId, name, email, status, startDate, endDate } = req.query;

    let sql = `
        SELECT
            b.booking_id, b.booking_date, b.total_price, b.status, b.schedule_date, b.schedule_time,
            c.first_name, c.last_name, c.email
        FROM bookings b
        LEFT JOIN customers c ON b.customer_id = c.customer_id
        WHERE 1=1
    `;
    const params = [];

    if (bookingId) {
        sql += ' AND b.booking_id = ?';
        params.push(bookingId);
    }
    if (name) {
        sql += " AND (c.first_name LIKE ? OR c.last_name LIKE ? OR (c.first_name || ' ' || c.last_name) LIKE ?)";
        params.push(`%${name}%`, `%${name}%`, `%${name}%`);
    }
    if (email) {
        sql += ' AND c.email LIKE ?';
        params.push(`%${email}%`);
    }
    if (status) {
        sql += ' AND b.status = ?';
        params.push(status);
    }
    if (startDate) {
        sql += ' AND b.booking_date >= ?';
        params.push(startDate);
    }
    if (endDate) {
        // Add 1 day to the end date to make it inclusive
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        sql += ' AND b.booking_date < ?';
        params.push(nextDay.toISOString().split('T')[0]);
    }

    sql += ' ORDER BY b.booking_date DESC';

    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: "Database search failed." });
        res.json(rows || []);
    });
});

app.get('/api/admin/banners', (req, res) => {
    debugLogWriteToFile("Admin request for all banners received.");
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    // This query gets all fields for all banners, ordered for the admin view.
    const sql = 'SELECT banner_id, banner_name, image_url, link_url, display_order, is_active FROM promotion_banners ORDER BY display_order ASC, banner_name ASC';

    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve banners." });
        res.json(rows || []);
    });
});

app.get('/api/admin/customers', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }
    const sql = `
        SELECT customer_id, email, first_name, last_name, phone_number, created_at 
        FROM customers 
        ORDER BY created_at DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Failed to retrieve customer accounts." });
        }
        res.json(rows || []);
    });
});

app.post('/api/admin/banners', upload.single('image'), (req, res) => {
    if (!req.session || !req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { banner_name, link_url, display_order, is_active } = req.body;
    if (!banner_name || !req.file) {
        return res.status(400).json({ error: "Banner Name and an Image are required." });
    }

    const image_url = `/runtime/data/images/${req.file.filename}`;
    const sql = 'INSERT INTO promotion_banners (banner_name, image_url, link_url, display_order, is_active) VALUES (?, ?, ?, ?, ?)';
    db.run(sql, [banner_name, image_url, link_url, display_order, is_active === 'true' ? 1 : 0], function(err) {
        if (err) return res.status(500).json({ error: "Database error creating banner." });
        res.status(201).json({ message: "Banner created successfully.", bannerId: this.lastID });
    });
});

app.put('/api/admin/banners/:id', upload.single('image'), (req, res) => {
    if (!req.session || !req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    const { banner_name, link_url, display_order, is_active } = req.body;

    let sql = 'UPDATE promotion_banners SET banner_name = ?, link_url = ?, display_order = ?, is_active = ?';
    const params = [banner_name, link_url, display_order, is_active === 'true' ? 1 : 0];

    if (req.file) {
        sql += ', image_url = ?';
        params.push(`/runtime/data/images/${req.file.filename}`);
    }

    sql += ' WHERE banner_id = ?';
    params.push(id);

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: "Database error updating banner." });
        res.json({ message: "Banner updated successfully." });
    });
});

app.delete('/api/admin/banners/:id', (req, res) => {
    if (!req.session || !req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    // First, get the image path to delete the file
    db.get('SELECT image_url FROM promotion_banners WHERE banner_id = ?', [id], (err, row) => {
        if (err) return res.status(500).json({ error: "Error finding banner." });
        if (row && row.image_url) {
            // Construct the full file path and delete the image file
            const filePath = path.join(__dirname, row.image_url.replace('/runtime', 'runtime'));
            fs.unlink(filePath, (unlinkErr) => {
                if (unlinkErr) console.error(`Failed to delete banner image file: ${filePath}`, unlinkErr);
            });
        }

        // Then, delete the database record
        db.run('DELETE FROM promotion_banners WHERE banner_id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: "Database error deleting banner." });
            if (this.changes === 0) return res.status(404).json({ error: "Banner not found." });
            res.json({ message: "Banner deleted successfully." });
        });
    });
});

app.put('/api/admin/bookings/:bookingId/status', (req, res) => {
    debugLogWriteToFile("Admin request to update booking status received.");
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { status } = req.body;
    const { bookingId } = req.params;

    const sql = 'UPDATE bookings SET status = ? WHERE booking_id = ?';
    db.run(sql, [status, bookingId], function(err) {
        if (err) return res.status(500).json({ error: "Failed to update booking status." });
        broadcastUpdate({ type: 'booking_update', bookingId, status });
        res.json({ message: "Booking status updated successfully." });
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
    const sql = 'SELECT page_name, primary_color, secondary_color, page_logo, banner_image, currency_symbol FROM page_config WHERE config_id = 1';

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

    let sql = 'SELECT service_id, service_name, service_type, description, base_price, image_url FROM services WHERE is_active = 1';
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

app.get('/api/admin/get-configured-service-types', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const sql = "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'service_details_%'";

    db.all(sql, [], (err, tables) => {
        if (err) {
            debugLogWriteToFile(`Database error fetching configured service types: ${err.message}`);
            return res.status(500).json({ error: "Failed to retrieve configured service types." });
        }
        
        // Extract the type from the table name (e.g., 'service_details_laundry' -> 'laundry')
        const serviceTypes = tables.map(table => table.name.replace('service_details_', ''));
        res.json(serviceTypes);
    });
});

app.post('/api/admin/site-config', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
    if (!req.session || !req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { siteName, primaryColor, secondaryColor, currencySymbol, remove_logo, remove_banner } = req.body;
    const logoFile = req.files['logo'] ? req.files['logo'][0] : null;
    const bannerFile = req.files['banner'] ? req.files['banner'][0] : null;

    const logoPath = logoFile ? `/runtime/data/images/${logoFile.filename}` : null;
    const bannerPath = bannerFile ? `/runtime/data/images/${bannerFile.filename}` : null;

    // Handle file deletion
    db.get('SELECT page_logo, banner_image FROM page_config WHERE config_id = 1', [], (err, row) => {
        if (row) {
            if ((logoFile || remove_logo === 'true') && row.page_logo) {
                try { fs.unlinkSync(path.join(__dirname, row.page_logo)); } catch(e) {}
            }
            if ((bannerFile || remove_banner === 'true') && row.banner_image) {
                try { fs.unlinkSync(path.join(__dirname, row.banner_image)); } catch(e) {}
            }
        }
    });

    let sql = `UPDATE page_config SET page_name = ?, primary_color = ?, secondary_color = ?, currency_symbol = ?`;
    const params = [siteName, primaryColor, secondaryColor, currencySymbol];

    if (logoFile) { sql += `, page_logo = ?`; params.push(logoPath); }
    else if (remove_logo === 'true') { sql += `, page_logo = NULL`; }

    if (bannerFile) { sql += `, banner_image = ?`; params.push(bannerPath); }
    else if (remove_banner === 'true') { sql += `, banner_image = NULL`; }

    sql += ` WHERE config_id = 1`;

    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: "Failed to update site configuration." });
        res.json({ message: "Site configuration updated successfully." });
    });
});

app.post('/api/admin/accounts/:id/regenerate-recovery-code', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }

    const { id } = req.params;
    const newRecoveryCode = crypto.randomBytes(3).toString('hex').toUpperCase(); // Generate a new random code

    const sql = 'UPDATE admin_login SET recovery_code = ? WHERE admin_id = ?';
    db.run(sql, [newRecoveryCode, id], function(err) {
        if (err) {
            console.error(err.message);
            debugLogWriteToFile(`Database error regenerating recovery code: ${err.message}`);
            return res.status(500).json({ error: "Failed to regenerate recovery code." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Admin account not found." });
        }

        debugLogWriteToFile(`Recovery code regenerated for admin_id ${id}.`);
        res.json({
            message: "Recovery code regenerated successfully.",
            newRecoveryCode: newRecoveryCode
        });
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
            b.pickup_method,
            b.return_method,
            b.schedule_date,
            b.schedule_time,
            c.first_name,
            c.last_name,
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
        JOIN customers c ON b.customer_id = c.customer_id
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

app.get('/api/customer/bookings/:bookingId', (req, res) => {
    debugLogWriteToFile("Request for a single customer booking received.");
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    const customerId = req.session.customerId;
    const { bookingId } = req.params;

    const sql = `
        SELECT
            b.booking_id,
            b.booking_date,
            b.total_price,
            b.status,
            b.pickup_method,
            b.return_method,
            b.schedule_date,
            b.schedule_time,
            c.first_name,
            c.last_name,
            c.email,
            (
                SELECT json_group_array(
                    json_object(
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
        JOIN customers c ON b.customer_id = c.customer_id
        WHERE b.booking_id = ? AND b.customer_id = ?
    `;

    db.get(sql, [bookingId, customerId], (err, row) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve booking details." });
        if (!row) return res.status(404).json({ error: "Booking not found or you do not have permission to view it." });
        res.json(row);
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
    const sql = 'SELECT * FROM customers WHERE customer_id = ?';

    db.get(sql, [customerId], (err, row) => {
        if (err) {
            debugLogWriteToFile(`Database error fetching customer details: ${err.message}`);
            return res.status(500).json({ error: "Failed to retrieve customer details." });
        }
        if (!row) {
            return res.status(404).json({ error: "Customer not found." });
        }
        // Do not send the password hash to the client
        delete row.password_hash;
        res.json(row);
    });
});

app.post('/api/customer/update-address', (req, res) => {
    debugLogWriteToFile("Request to update customer address received.");
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    const customerId = req.session.customerId;
    const { address_line1, address_line2, city, state_province, postal_code, country } = req.body;

    const sql = 'UPDATE customers SET address_line1=?, address_line2=?, city=?, state_province=?, postal_code=?, country=? WHERE customer_id = ?';
    db.run(sql, [address_line1, address_line2, city, state_province, postal_code, country, customerId], function(err) {
        if (err) {
            return res.status(500).json({ error: "Failed to update address." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Customer not found." });
        }
        res.json({ message: "Address updated successfully." });
    });
});

app.post('/api/customer/create-booking', (req, res) => {
    debugLogWriteToFile("Received request to create a new booking.");

    // 1. Authentication Check: Ensure a customer is logged in.
    if (!req.session || !req.session.customerId) {
        return res.status(401).json({ error: "You must be logged in to place an order." });
    }

    const { items, pickup_method, return_method, schedule_date, schedule_time } = req.body;
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
            const bookingSql = 'INSERT INTO bookings (customer_id, total_price, status, pickup_method, return_method, schedule_date, schedule_time) VALUES (?, ?, ?, ?, ?, ?, ?)';
            db.run(bookingSql, [customerId, totalPrice, 'Pending', pickup_method, return_method, schedule_date, schedule_time], function(err) {
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

app.post('/api/admin/verify-recovery-code', (req, res) => {
    debugLogWriteToFile("Received request for /api/admin/verify-recovery-code");
    const { username, recovery_code } = req.body;

    if (!username || !recovery_code) {
        return res.status(400).json({ error: "Username and recovery code are required." });
    }

    const sql = 'SELECT recovery_code FROM admin_login WHERE username = ?';
    db.get(sql, [username], (err, row) => {
        if (err) {
            console.error(err.message);
            debugLogWriteToFile(`Database error during recovery code verification: ${err.message}`);
            return res.status(500).json({ error: "Database error during recovery." });
        }

        if (!row || !row.recovery_code) {
            // Respond with a generic error to prevent username enumeration
            return res.status(401).json({ success: false, error: "Invalid username or recovery code." });
        }

        // Constant-time comparison to mitigate timing attacks
        const storedCodeBuffer = Buffer.from(row.recovery_code);
        const providedCodeBuffer = Buffer.from(recovery_code);

        if (storedCodeBuffer.length !== providedCodeBuffer.length) {
            return res.status(401).json({ success: false, error: "Invalid username or recovery code." });
        }

        const match = crypto.timingSafeEqual(storedCodeBuffer, providedCodeBuffer);

        res.json({ success: match, message: match ? "Recovery code is valid." : "Invalid username or recovery code." });
    });
});

app.post('/api/admin/reset-password-with-recovery', async (req, res) => {
    debugLogWriteToFile("Received request for /api/admin/reset-password-with-recovery");
    const { username, recovery_code, new_password } = req.body;

    if (!username || !recovery_code || !new_password) {
        return res.status(400).json({ error: "Username, recovery code, and new password are required." });
    }

    // First, verify the recovery code (re-using logic from verify-recovery-code)
    db.get('SELECT recovery_code FROM admin_login WHERE username = ?', [username], async (err, row) => {
        if (err || !row || !row.recovery_code || !crypto.timingSafeEqual(Buffer.from(row.recovery_code), Buffer.from(recovery_code))) {
            return res.status(401).json({ error: "Invalid username or recovery code." });
        }

        try {
            const hashedPassword = await bcrypt.hash(new_password, 10);
            db.run('UPDATE admin_login SET password = ? WHERE username = ?', [hashedPassword, username], function(err) {
                if (err) return res.status(500).json({ error: "Failed to update password." });
                res.json({ message: "Password reset successfully." });
            });
        } catch (error) {
            res.status(500).json({ error: "Error hashing new password." });
        }
    });
});

app.get('/api/admin/accounts', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }
    const sql = 'SELECT admin_id, username, privilege FROM admin_login ORDER BY username ASC';
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Failed to retrieve accounts." });
        res.json(rows || []);
    });
});

app.get('/api/admin/accounts/:id', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ error: "Administrator not authenticated." });
    }
    const { id } = req.params;
    const sql = 'SELECT admin_id, username, privilege FROM admin_login WHERE admin_id = ?';
    db.get(sql, [id], (err, row) => {
        if (err) return res.status(500).json({ error: "Database error." });
        if (!row) return res.status(404).json({ error: "Account not found." });
        res.json(row);
    });
});

app.post('/api/admin/accounts', async (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { username, password, privilege } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO admin_login (username, password, privilege) VALUES (?, ?, ?)';
        db.run(sql, [username, hashedPassword, privilege || 'admin'], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ error: 'This username is already taken.' });
                }
                return res.status(500).json({ error: "Database error creating account." });
            }
            res.status(201).json({ message: "Admin account created successfully.", adminId: this.lastID });
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to process password." });
    }
});

app.put('/api/admin/accounts/:id', async (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    const { username, password, privilege } = req.body;

    if (!username) {
        return res.status(400).json({ error: "Username is required." });
    }

    let sql, params;
    if (password) {
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            sql = 'UPDATE admin_login SET username = ?, password = ?, privilege = ? WHERE admin_id = ?';
            params = [username, hashedPassword, privilege, id];
        } catch (error) {
            return res.status(500).json({ error: "Failed to process new password." });
        }
    } else {
        sql = 'UPDATE admin_login SET username = ?, privilege = ? WHERE admin_id = ?';
        params = [username, privilege, id];
    }

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(409).json({ error: 'This username is already taken.' });
            }
            return res.status(500).json({ error: "Database error updating account." });
        }
        res.json({ message: "Admin account updated successfully." });
    });
});

app.delete('/api/admin/accounts/:id', (req, res) => {
    if (!req.session.adminId) return res.status(401).json({ error: "Administrator not authenticated." });

    const { id } = req.params;
    if (parseInt(id, 10) === req.session.adminId) {
        return res.status(403).json({ error: "You cannot delete your own account." });
    }

    db.run('DELETE FROM admin_login WHERE admin_id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: "Database error deleting account." });
        if (this.changes === 0) return res.status(404).json({ error: "Account not found." });
        res.json({ message: "Admin account deleted successfully." });
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

    server.listen(port, () => {
        console.log(`Mitra Runtime server is running on http://localhost:${port}/\n`);
        console.log(`Mitra Runtime Admin service, alongside the Runtime server, is running on http://localhost:${port}/admin`);
    });
});