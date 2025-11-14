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


// Frontend setup here
// 1. Root would be index
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'setup/index.html'))
})


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
    }
});

app.use(bodyParser.json());

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

// Redundancy configuration here
// Somewhat unrelated to the mitra env, but maybe-maybe?
