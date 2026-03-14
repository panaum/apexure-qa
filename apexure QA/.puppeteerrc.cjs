const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
    // Keeps the browser binary inside your project for the agent to find
    cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};