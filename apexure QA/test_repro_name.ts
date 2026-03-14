
import puppeteer from 'puppeteer';

async function test() {
    console.log('Testing page.evaluate with a function to see if __name is injected...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.goto('https://example.com');

        // This function will likely be transformed by tsx
        const result = await page.evaluate(() => {
            function testFunc() { }
            return typeof testFunc;
        });

        console.log('Result of evaluate:', result);
    } catch (err) {
        console.error('Evaluate error:', err);
    } finally {
        await browser.close();
    }
}

test();
