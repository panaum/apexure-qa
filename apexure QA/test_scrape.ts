
async function test() {
    const url = 'http://localhost:5000/api/scrape-webpage';
    const body = JSON.stringify({ url: 'https://example.com' });

    console.log('Calling', url, 'with body:', body);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', JSON.stringify(data, null, 2));
        if (data.stack) {
            console.log('Server-side stack trace:');
            console.log(data.stack);
        }
    } catch (error) {
        console.error('Test script error:', error);
    }
}

test();
