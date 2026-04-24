require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'stayhub',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const runFile = async (client, filePath, label) => {
  console.log(`\nRunning ${label}...`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await client.query(sql);
  console.log(`${label} completed successfully.`);
};

const migrate = async () => {
  const client = await pool.connect();
  const shouldSeed = process.argv.includes('--seed');

  try {
    await client.query('BEGIN');

    const schemaPath = path.join(__dirname, 'schema.sql');
    await runFile(client, schemaPath, 'Schema migration');

    if (shouldSeed) {
      const seedPath = path.join(__dirname, 'seed.sql');
      await runFile(client, seedPath, 'Seed data');
    }

    await client.query('COMMIT');
    console.log('\nMigration completed successfully!');

    if (shouldSeed) {
      console.log('\nSample accounts created:');
      console.log('  Host:  sarah@example.com / password123');
      console.log('  Guest: john@example.com  / password123');
      console.log('  Guest: emily@example.com / password123');
      console.log('  Admin: admin@example.com / password123');
    }
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nMigration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
