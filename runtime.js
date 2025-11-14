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

// --- Static Asset Serving ---
debugLogWriteToFile("Configuring static asset hosting.");
app.use('/assets/npm', express.static(path.join(__dirname, 'node_modules')));
app.use('/assets/runtime', express.static(path.join(__dirname, 'runtime/assets')));

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
    res.sendFile(path.join(__dirname, 'runtime/client/index.html'));
});

app.get('/admin-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/admin/index.html'));
})

app.get('/login-customer', (req, res) => {
    res.sendFile(path.join(__dirname, 'runtime/client/assets/html/login.html'));
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

// --- Server Start ---
app.listen(port, () => {
    console.log(`Mitra Runtime server is running on http://localhost:${port}/`);
});