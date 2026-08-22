const { Pool } = require("pg");
require("dotenv").config();

// Support DATABASE_URL, POSTGRES_URL (Railway Postgres), or DATABASE_PRIVATE_URL
const dbUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_PRIVATE_URL ||
  process.env.PGURL;

if (!dbUrl) {
  console.warn(
    "⚠️ WARNING: Missing DATABASE_URL in environment variables. Please set DATABASE_URL in Railway Variables dashboard."
  );
}

const isLocalhost = dbUrl ? dbUrl.includes("localhost") : false;

const pool = dbUrl
  ? new Pool({
      connectionString: dbUrl,
      ssl: isLocalhost
        ? false
        : {
            rejectUnauthorized: false
          }
    })
  : {
      query: async () => {
        throw new Error(
          "DATABASE_URL is missing in environment variables. Please configure DATABASE_URL in Railway Variables tab."
        );
      }
    };

module.exports = pool;
