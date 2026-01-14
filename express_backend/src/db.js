const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;
let cachedDbName = null;

/**
 * Resolves the database name to use. Prefer:
 * 1) Explicit override argument
 * 2) process.env.MONGO_DB_NAME
 * 3) Database name parsed from URI path (/dbname)
 * If none found, return null (Mongo will still connect, but db selection may be required later).
 */
function resolveDbName(mongoUri, explicitDbName) {
  const envDbName = process.env.MONGO_DB_NAME;
  if (explicitDbName) return explicitDbName;
  if (envDbName) return envDbName;

  try {
    // new URL supports mongodb+srv scheme in modern Node
    const url = new URL(mongoUri);
    const pathname = (url.pathname || '').replace(/^\//, '');
    return pathname ? decodeURIComponent(pathname) : null;
  } catch (e) {
    // If URL parsing fails, do not block; caller can still connect and choose db later.
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 * Get a cached MongoDB client connection. Connects once on-demand.
 * Reads connection string from process.env.MONGO_URI.
 *
 * @param {Object} [options]
 * @param {string} [options.dbName] Optional db name override.
 * @returns {Promise<{client: MongoClient, db: import('mongodb').Db | null, dbName: string | null}>}
 */
async function getMongoConnection(options = {}) {
  /** This is a public function. */
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    const err = new Error('MONGO_URI is not set');
    err.code = 'MONGO_URI_MISSING';
    throw err;
  }

  // If already connected, reuse.
  if (cachedClient) {
    return { client: cachedClient, db: cachedDb, dbName: cachedDbName };
  }

  const dbName = resolveDbName(mongoUri, options.dbName);
  const client = new MongoClient(mongoUri, {
    // Keep defaults minimal; MongoClient handles pooling internally.
  });

  try {
    await client.connect();
    cachedClient = client;
    cachedDbName = dbName;
    cachedDb = dbName ? client.db(dbName) : null;

    console.log(`[mongo] connected${dbName ? ` (db=${dbName})` : ''}`);
    return { client: cachedClient, db: cachedDb, dbName: cachedDbName };
  } catch (error) {
    console.error('[mongo] connection failed:', error.message);
    // Ensure we don't cache a broken client.
    cachedClient = null;
    cachedDb = null;
    cachedDbName = null;
    throw error;
  }
}

/**
 * PUBLIC_INTERFACE
 * Pings MongoDB using the admin command. This is used for readiness checks.
 *
 * @returns {Promise<void>}
 */
async function pingMongo() {
  /** This is a public function. */
  const { client } = await getMongoConnection();
  // Use admin ping which does not depend on a specific db name.
  await client.db('admin').command({ ping: 1 });
}

/**
 * PUBLIC_INTERFACE
 * Close MongoDB connection (primarily for tests/shutdown).
 *
 * @returns {Promise<void>}
 */
async function closeMongoConnection() {
  /** This is a public function. */
  if (!cachedClient) return;
  try {
    await cachedClient.close();
  } finally {
    cachedClient = null;
    cachedDb = null;
    cachedDbName = null;
  }
}

module.exports = {
  getMongoConnection,
  pingMongo,
  closeMongoConnection,
};

