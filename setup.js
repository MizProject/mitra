// Setup JS for Mitra, a business booking application

console.log("Starting Setup for Mitra...");
console.log("Initializing Core Dependencies...");

const fs = require('fs');
const path = require('path');
// This one is platform specific, though may or may not be needed
const windows_path = require('path/win32');
// For creating directories recursively
const mkdirp = require('mkdirp');

// Global variables
const crypto = require('crypto');
let debugMode = false;
let logFilePath;
let argenv = process.argv.slice(2);

// Check if being run by nodemon
if (argenv.includes('--debug')) {
    console.log("Setup is being run with --debug flag.");
    console.log("Which means, its being run in development mode.");
    console.log("Enabling extreme debug logging for development.");
    debugMode = true; // This was a const, changed to let.
    // Now, create the logfile
    const __dayToday = new Date();
    const __timeToday = __dayToday.toLocaleTimeString().replace(/:/g, '-');
    const __dateToday = __dayToday.toLocaleDateString().replace(/\//g, '-');
    // Variable for logfile name should be exposed at runtime so no new file
    // is created every time a log is written to.
    const logFileName = `debug-Mitra-log-${__dateToday}_${__timeToday}.log`;
    const logDir = path.join(__dirname, 'development', 'logs');
    mkdirp.sync(logDir); // Ensure the directory exists
    logFilePath = path.join(logDir, logFileName); // Assign to the higher-scoped variable
    fs.writeFileSync(logFilePath, `Debug Log Created on ${__dateToday} at ${__timeToday}\n\n`);
    debugLogWriteToFile(`Debug logging started. Log file: ${logFilePath}`);
}

function debugLogWriteToFile(message) {
    if (debugMode === false) return;
    // Fetch timedate for stamping
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] ${message}\n`;
    fs.appendFileSync(logFilePath, logEntry); // logFilePath is now in scope
}

// Override console.log to also write to log file in debug mode
console.error = function(message) {
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] ERROR: ${message}\n`;
    if (debugMode) {
        fs.appendFileSync(logFilePath, logEntry);
        process.stdout.write(logEntry);
    } else {
        // In non-debug mode, spit it out to the console only
        process.stdout.write(logEntry);
    }
};

// Also pass the warn to log
console.warn = function(message) {
    const dayToday = new Date();
    const timeToday = dayToday.toLocaleTimeString();
    const dateToday = dayToday.toLocaleDateString().replace(/\//g, '-');
    const logEntry = `[${dateToday} ${timeToday}] WARNING: ${message}\n`;
    if (debugMode) {
        fs.appendFileSync(logFilePath, logEntry);
        process.stdout.write(logEntry);
    } else {
        process.stdout.write(logEntry);
    }
};

// Capture process terminations while on debug
process.on('exit', (code) => {
    debugLogWriteToFile(`Setup process exiting with code: ${code}`);
})

process.on('SIGINT', () => {
    debugLogWriteToFile("Setup process interrupted (SIGINT). Exiting...");
    process.exit(0);
})

process.on('uncaughtException', (err) => {
    debugLogWriteToFile(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});


// For now, let's test the logs
// lets put entries on loop
// for (let i =1 ; i <= 10000000; i++) {
//     console.log(`Writing debug log entry number ${i}, as test...`);
//     debugLogWriteToFile(`This is debug log entry number ${i}, as test...`);
// }

// Real dependencies load

const express = require('express');
debugLogWriteToFile("Express module loaded.");
const app = express();
const port = 7500;
debugLogWriteToFile(`Express app configured to listen on port ${port}.`);
const bodyParser = require('body-parser');
debugLogWriteToFile("Body-Parser module loaded.");
const sequelize = require('sequelize');
debugLogWriteToFile("Sequelize module loaded.");
const sqlite3 = require('sqlite3').verbose();
debugLogWriteToFile("SQLite3 module loaded.");
const bcrypt = require('bcrypt');
debugLogWriteToFile("Bcrypt module loaded.");
const saltRounds = 10;
debugLogWriteToFile(`Bcrypt Salt rounds set to ${saltRounds}.`)
const multer = require('multer');
debugLogWriteToFile("Multer module loaded for file uploads.");

// Make express Listen to network port
app.listen(port, () => {
    debugLogWriteToFile(`Mitra Setup server is running on port ${port} and under the IP: http://localhost:${port}/`);
    console.log(`Mitra Setup server is running on port ${port} and under the IP: http://localhost:${port}/`);
})

// NPM packages, hosted as static, under /assets/npm
debugLogWriteToFile("Hosting NPM Packages as static assets...");
app.use('/assets/npm', express.static(path.join(__dirname, 'node_modules')));
debugLogWriteToFile("NPM Packages are being hosted as static assets at /assets/npm");

// Others, like custom CSS, JS, images, etc
debugLogWriteToFile("Hosting Custom Assets as static assets...");
app.use('/assets/setup', express.static(path.join(__dirname, 'setup/assets')));
debugLogWriteToFile("Custom Assets are being hosted as static assets at /assets/setup");

// Runtime Directory
// For submitting changes
// Note: uploading images should be at /runtime/data/images/
debugLogWriteToFile("Hosting Runtime Directory as static assets...");
const uploadDir = path.join(__dirname, 'runtime/data/images');
mkdirp.sync(uploadDir); // Ensure the upload directory exists
debugLogWriteToFile(`Upload directory ensured at: ${uploadDir}`);
app.use('/runtime/data/images', express.static(uploadDir));

app.use('/runtime', express.static(path.join(__dirname, 'runtime')));
debugLogWriteToFile("Runtime Directory is being hosted as static assets at /runtime");


// Frontend setup here
// 1. Root would be index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'setup/index.html'))
})

// Use body-parser for all API routes below
app.use(bodyParser.json());


// API Calls here

const dbPath = path.join(__dirname, 'database.sqlite'); // Remember that database.sqlite is at root project dir, do not modify unless if you switch the database tables
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`Error opening database ${dbPath}: ${err.message}`);
        debugLogWriteToFile(`Error opening database ${dbPath}: ${err.message}`);
    } else {
        console.log(`Successfully connected to database ${dbPath}`);
        debugLogWriteToFile(`Successfully connected to database ${dbPath}`);
        // Create benchmark table if it doesn't exist
        // Meant to autospawn
        db.run(`CREATE TABLE IF NOT EXISTS benchmark_test (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            col_text1 TEXT,
            col_text2 TEXT,
            col_int1 INTEGER,
            col_int2 INTEGER,
            col_real1 REAL,
            col_real2 REAL,
            col_blob1 BLOB,
            col_date1 DATE,
            col_bool1 BOOLEAN
        )`, (err) => {
            if (err) {
                console.error(`Error creating table: ${err.message}`);
                debugLogWriteToFile(`Error creating table: ${err.message}`);
            }
        });
        // Create page_config table
        db.run(`CREATE TABLE IF NOT EXISTS page_config (
            config_id INTEGER PRIMARY KEY DEFAULT 1,
            page_name TEXT,
            primary_color TEXT,
            secondary_color TEXT,
            banner_image TEXT,
            page_logo TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error(`Error creating page_config table: ${err.message}`);
                debugLogWriteToFile(`Error creating page_config table: ${err.message}`);
            } else {
                debugLogWriteToFile(`page_config table checked/created.`);
            }
        });

        // Create a trigger to automatically update `updated_at` on row change
        db.run(`
            CREATE TRIGGER IF NOT EXISTS update_page_config_updated_at
            AFTER UPDATE ON page_config
            FOR EACH ROW
            BEGIN
                UPDATE page_config SET updated_at = CURRENT_TIMESTAMP WHERE config_id = OLD.config_id;
            END;
        `, (err) => {
            if (err) {
                console.error(`Error creating trigger for page_config: ${err.message}`);
                debugLogWriteToFile(`Error creating trigger for page_config: ${err.message}`);
            }
        });


    }
});

app.post('/api/test-db', (req, res) => {
    debugLogWriteToFile("Received request for /api/test-db");
    const insert = 'INSERT INTO benchmark_test (col_text1, col_text2, col_int1) VALUES (?,?,?)';
    db.run(insert, ["test_data", `random_text_${Math.random()}`, Math.floor(Math.random() * 1000)], function(err) {
        if (err) {
            return console.error(err.message);
        }
        debugLogWriteToFile(`A row has been inserted with rowid ${this.lastID}`);
        db.all("SELECT * FROM benchmark_test", [], (err, rows) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return;
            }
            res.json({
                message: "success",
                data: rows
            });
        });
    });
});

app.post('/api/benchmark/sequential-write', (req, res) => {
    const insert = 'INSERT INTO benchmark_test (col_text1, col_text2, col_int1) VALUES (?,?,?)';
    db.run(insert, ["seq_write", `random_text_${Math.random()}`, Math.floor(Math.random() * 1000)], function(err) {
        if (err) {
            res.status(500).json({ "error": err.message });
            return console.error(err.message);
        }
        res.json({ message: "success", id: this.lastID });
    });
});

app.post('/api/benchmark/bulk-write', (req, res) => {
    const records = req.body.records;
    if (!records || !Array.isArray(records)) {
        return res.status(400).json({ error: "Invalid payload. 'records' array not found." });
    }

    const insert = db.prepare('INSERT INTO benchmark_test (col_text1, col_text2, col_int1) VALUES (?,?,?)');
    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        records.forEach(record => {
            insert.run(record.col_text1, record.col_text2, record.col_int1);
        });
        db.run("COMMIT", (err) => {
            if (err) {
                res.status(500).json({ "error": err.message });
                return console.error(err.message);
            }
            res.json({ message: "success", count: records.length });
        });
    });
    insert.finalize();
});

app.get('/api/benchmark/read-all', (req, res) => {
    db.all("SELECT id FROM benchmark_test", [], (err, rows) => {
        if (err) {
            res.status(500).json({ "error": err.message });
            return;
        }
        res.json({ message: "success", data: rows });
    });
});

app.post('/api/benchmark/cleanup', (req, res) => {
    db.run('DELETE FROM benchmark_test', function(err) {
        if (err) {
            res.status(500).json({ "error": err.message });
            return console.error(err.message);
        }
        // Reset autoincrement counter
        db.run("DELETE FROM sqlite_sequence WHERE name='benchmark_test'", (err) => {
            debugLogWriteToFile(`Cleanup complete for benchmark_test. ${this.changes} rows deleted.`);
            res.json({ message: "success", deleted_rows: this.changes });
        });
    });
});

app.post('/api/create-admin', async (req, res) => {
    const { username, password, recovery_code } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insert = 'INSERT INTO admin_login (username, password, recovery_code, privilege) VALUES (?, ?, ?, ?)';
        db.run(insert, [username, hashedPassword, recovery_code, 'admin'], function(err) {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: err.message });
            }

            debugLogWriteToFile(`Admin account created with rowid ${this.lastID}`);
            res.json({
                message: "Admin account created successfully",
                adminId: this.lastID
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to hash password" });
    }
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
    }

    const sql = 'SELECT * FROM admin_login WHERE username = ?';

    db.get(sql, [username], async (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }

        // If no user is found, or if a password comparison is needed
        if (!row) {
            return res.status(401).json({ error: "Invalid username or password." });
        }

        try {
            const match = await bcrypt.compare(password, row.password);

            if (match) {
                debugLogWriteToFile(`Successful login for user: ${username}`);
                res.json({ message: "Login successful!" });
            } else {
                res.status(401).json({ error: "Invalid username or password." });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Error during authentication." });
        }
    });
});

app.post('/api/save-colors', (req, res) => {
    debugLogWriteToFile("Received request for /api/save-colors");
    const { primaryColor, secondaryColor } = req.body;

    if (!primaryColor) {
        return res.status(400).json({ error: "Primary color is required." });
    }

    const sql = `
        INSERT INTO page_config (config_id, primary_color, secondary_color)
        VALUES (1, ?, ?)
        ON CONFLICT(config_id) DO UPDATE SET
            primary_color = excluded.primary_color,
            secondary_color = excluded.secondary_color;
    `;

    db.run(sql, [primaryColor, secondaryColor], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Color configuration saved successfully." });
    });
});

app.post('/api/validate-recovery-code', (req, res) => {
    debugLogWriteToFile("Received request for /api/validate-recovery-code");
    const { username, recovery_code } = req.body;

    if (!username || !recovery_code) {
        return res.status(400).json({ error: "Username and recovery code are required." });
    }

    const sql = 'SELECT recovery_code FROM admin_login WHERE username = ?';
    db.get(sql, [username], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Database error during recovery." });
        }

        if (!row || !row.recovery_code) {
            // Respond with a generic error to prevent username enumeration
            return res.status(401).json({ error: "Invalid username or recovery code." });
        }

        // Constant-time comparison to mitigate timing attacks
        const storedCodeBuffer = Buffer.from(row.recovery_code);
        const providedCodeBuffer = Buffer.from(recovery_code);

        if (storedCodeBuffer.length !== providedCodeBuffer.length) {
            return res.status(401).json({ error: "Invalid username or recovery code." });
        }

        const match = crypto.timingSafeEqual(storedCodeBuffer, providedCodeBuffer);

        res.json({ success: match, message: match ? "Recovery code is valid." : "Invalid username or recovery code." });
    });
});

// --- Site Configuration (Colors, Name, Files) ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Use the fieldname from multer (e.g., 'logo', 'banner')
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

app.post('/api/save-site-config', upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
    debugLogWriteToFile("Received request for /api/save-site-config");
    const { siteName, primaryColor, secondaryColor } = req.body;

    if (!siteName || !primaryColor) {
        return res.status(400).json({ error: "Site name and primary color are required." });
    }

    const logoFile = req.files['logo'] ? req.files['logo'][0] : null;
    const bannerFile = req.files['banner'] ? req.files['banner'][0] : null;

    const logoPath = logoFile ? `/runtime/data/images/${logoFile.filename}` : null;
    const bannerPath = bannerFile ? `/runtime/data/images/${bannerFile.filename}` : null;

    const sql = `
        INSERT INTO page_config (config_id, page_name, primary_color, secondary_color, page_logo, banner_image)
        VALUES (1, ?, ?, ?, ?, ?)
        ON CONFLICT(config_id) DO UPDATE SET
            page_name = COALESCE(excluded.page_name, page_name),
            primary_color = COALESCE(excluded.primary_color, primary_color),
            secondary_color = COALESCE(excluded.secondary_color, secondary_color),
            page_logo = COALESCE(excluded.page_logo, page_logo),
            banner_image = COALESCE(excluded.banner_image, banner_image);
    `;

    db.run(sql, [siteName, primaryColor, secondaryColor, logoPath, bannerPath], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Site configuration saved successfully." });
    });
});

app.post('/api/setup-servicing-tables', (req, res) => {
    debugLogWriteToFile("Received request to set up servicing tables.");
    const { services: selectedServices } = req.body;

    if (!selectedServices || !Array.isArray(selectedServices) || selectedServices.length === 0) {
        return res.status(400).json({ error: 'An array of selected services is required.' });
    }

    const coreTables = ['services', 'bookings', 'booking_items', 'service_availability'];
    
    const schemaPath = path.join(__dirname, '.servicing_vischem.sql');
    fs.readFile(schemaPath, 'utf8', (err, sqlScript) => {
        if (err) {
            console.error(`Error reading schema file: ${err.message}`);
            debugLogWriteToFile(`Error reading schema file: ${err.message}`);
            return res.status(500).json({ error: 'Could not read the servicing schema file.' });
        }

        // Split the script into individual statements. This handles comments and multiple lines.
        const statements = sqlScript.split(';').filter(s => s.trim().length > 0);
        let filteredScript = '';

        statements.forEach(statement => {
            // First, remove comments from the statement to reliably check its start.
            const cleanStatement = statement.replace(/--.*$/gm, '').trim();
            if (cleanStatement.length === 0) return;

            const statementTrimmed = cleanStatement.toLowerCase();
            if (statementTrimmed.startsWith('create table')) {
                // Use a regex to robustly find the table name after "CREATE TABLE"
                // It handles "IF NOT EXISTS" and varying whitespace.
                const match = statementTrimmed.match(/create table(?:\s+if\s+not\s+exists)?\s+`?([a-z0-9_]+)`?/);
                if (!match) return;
                const tableName = match[1];
                // Check if it's a core table or a selected service details table
                if (coreTables.includes(tableName) || (tableName.startsWith('service_details_') && selectedServices.includes(tableName.substring('service_details_'.length)))) {
                    filteredScript += statement + ';\n';
                }
            }
        });

        db.exec(filteredScript, function(err) {
            if (err) {
                console.error(`Error executing servicing schema: ${err.message}`);
                debugLogWriteToFile(`Error executing servicing schema: ${err.message}`);
                return res.status(500).json({ error: `Failed to create servicing tables: ${err.message}` });
            }

            const createdCount = (filteredScript.match(/CREATE TABLE/gi) || []).length;
            debugLogWriteToFile(`Servicing tables created successfully (${createdCount} tables).`);
            res.json({ message: `Successfully created ${createdCount} e-commerce service tables.` });
        });
    });
});

// Redundancy configuration here
// Somewhat unrelated to the mitra env, but maybe-maybe?
