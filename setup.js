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


// Redundancy configuration here
