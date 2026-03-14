const { Client } = require('pg');

// REMOVED ?sslmode=require from the end here
const connectionString = "postgres://postgres.xpbcolmpyzbymccxucuu:diffcheck.217@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres";

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // This tells Node to ignore the certificate error
    }
});

async function runTest() {
    console.log("Forcing SSL bypass...");
    try {
        await client.connect();
        const res = await client.query('SELECT NOW()');
        console.log("✅ SUCCESS! DATABASE CONNECTED!");
        console.log("Server Time:", res.rows[0].now);
    } catch (err) {
        console.error("❌ STILL FAILING:");
        console.error("- Message:", err.message);
    } finally {
        await client.end();
    }
}

runTest();