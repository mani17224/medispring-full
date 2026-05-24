// src/config/database.js
"use strict";

let _prisma = null;

/**
 * Returns the shared PrismaClient instance, creating it on first call.
 * Using a lazy singleton avoids Windows startup crash when the module is
 * required before dotenv has loaded the DATABASE_URL.
 */
function getPrisma() {
  if (_prisma) return _prisma;

  const { PrismaClient } = require("@prisma/client");

  _prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return _prisma;
}

// Proxy: `prisma.user.findMany()` works exactly as before
// but the client is only created when first used
const prisma = new Proxy(
  {},
  {
    get(_, prop) {
      return getPrisma()[prop];
    },
  }
);

async function connectDB() {
  const logger = require("./logger");
  const client = getPrisma();

  try {
    await client.$connect();
    logger.info("✅  MySQL connected via Prisma");
  } catch (err) {
    logger.error("❌  Database connection failed!");
    logger.error("");
    logger.error("  Possible causes:");
    logger.error("  1. MySQL is not running → start the MySQL80 service");
    logger.error("  2. Wrong password in DATABASE_URL → check your .env file");
    logger.error("  3. Database does not exist → run:");
    logger.error('     mysql -u root -p -e "CREATE DATABASE medispring;"');
    logger.error("  4. Wrong port → MySQL default is 3306");
    logger.error("");
    logger.error(`  Error: ${err.message}`);
    throw err;
  }
}

module.exports = { prisma, connectDB };
