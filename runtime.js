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
    const sql = 'SELECT service_id, service_name, description, base_price, image_url FROM services WHERE is_active = 1';

    db.all(sql, [], (err, rows) => {
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