import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Prefer a single connection string (works with Supabase / managed Postgres)
const connectionString =
  process.env.SUPABASE_DB_URL ||
  process.env.DATABASE_URL ||
  process.env.DB_CONNECTION_STRING;

const useConnectionString = Boolean(connectionString);

// Supabase pooler + some hosts use self-signed certs; relax TLS for serverless envs
if (useConnectionString) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED || '0';
}

// Database connection pool
const pool = new Pool(
  useConnectionString
    ? {
        connectionString,
        // Allow self-signed in pooler; Supabase uses valid certs but some environments need this
        ssl: { rejectUnauthorized: false },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 4000,
        allowExitOnIdle: true,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'snowy',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        allowExitOnIdle: true,
      }
);

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Database connection error:', err);
});

// Helper function to execute queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    // Don't log database errors if database isn't available
    if (error.code === '28000' || error.code === '3D000') {
      // Authentication or database doesn't exist - expected if PostgreSQL isn't set up
      throw error;
    }
    console.error('Query error:', error);
    throw error;
  }
};

// Helper function to get a client from the pool for transactions
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

// Initialize database schema
export const initDatabase = async () => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema (split by semicolons for individual statements)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await query(statement);
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
          console.warn('Schema execution warning:', error.message);
        }
      }
    }
    
    console.log('✅ Database schema initialized');
  } catch (error) {
    // Silently fail if database isn't available
    if (error.code === '28000' || error.code === '3D000' || error.code === 'ECONNREFUSED') {
      console.warn('⚠️  Database not available - app will run without database features');
      return;
    }
    console.error('❌ Failed to initialize database schema:', error.message);
    // Don't throw - allow app to continue if tables already exist
  }
};

export default pool;
