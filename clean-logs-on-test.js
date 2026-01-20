// Log Deleter

const fs = require('fs');
const path = require('path');
const glob = require('glob'); // Import the glob module

const logDir = path.join(__dirname, 'development', 'logs');
const targetPattern = path.join(logDir, '*.log'); // Use path.join for cross-platform compatibility

glob(targetPattern, (err, files) => {
    if (err) {
        console.error('Error finding log files:', err);
        process.exit(1);
    }

    if (files.length === 0) {
        console.log('No log files found to delete in:', logDir);
        process.exit(0);
    }

    console.log(`Found ${files.length} log files to delete.`);
    files.forEach(file => {
        fs.unlink(file, (unlinkErr) => {
            if (unlinkErr) {
                console.error(`Error deleting file ${file}:`, unlinkErr);
            } else {
                console.log(`Successfully deleted: ${file}`);
            }
        });
    });
    console.log('Log file deletion process initiated for all matched files.');
});