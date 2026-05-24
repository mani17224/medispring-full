// test-startup.js
// Run: node test-startup.js
// This checks every component before you run npm run dev
"use strict";

const line = "═".repeat(58);
console.log("\n" + line);
console.log("  MediSpring — Startup Diagnostics");
console.log(line);

let allOk = true;
function ok(msg)   { console.log("  ✅  " + msg); }
function fail(msg) { console.error("  ❌  " + msg); allOk = false; }
function warn(msg) { console.warn ("  ⚠️   " + msg); }
function info(msg) { console.log ("  ℹ️   " + msg); }

// ── 1. Node version ──────────────────────────────────────────────────────────
const [major] = process.version.replace("v","").split(".").map(Number);
if (major >= 18) ok(`Node.js ${process.version}`);
else             fail(`Node.js ${process.version} — need v18 or higher`);

// ── 2. .env file ─────────────────────────────────────────────────────────────
const fs   = require("fs");
const path = require("path");
const envPath = path.join(__dirname, ".env");

if (fs.existsSync(envPath)) {
  ok(".env file found");
  require("dotenv").config();
} else {
  fail(".env file NOT found");
  info("Fix: copy .env.example to .env and fill in your values");
  info(`     copy ${path.join(__dirname, ".env.example")} .env`);
  allOk = false;
}

// ── 3. Required env vars ─────────────────────────────────────────────────────
const required = {
  DATABASE_URL:       "mysql://root:PASSWORD@localhost:3306/medispring",
  JWT_SECRET:         "any-long-random-string-minimum-32-characters",
  JWT_REFRESH_SECRET: "a-different-long-random-string-minimum-32-chars",
};

for (const [key, example] of Object.entries(required)) {
  const val = process.env[key];
  if (!val) {
    fail(`${key} is missing from .env`);
    info(`     Example: ${key}=${example}`);
  } else if (val.includes("yourpassword") || val.includes("change_this")) {
    warn(`${key} still has a placeholder value — update it!`);
  } else {
    ok(`${key} is set`);
  }
}

// ── 4. DATABASE_URL format ───────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL || "";
if (dbUrl && !dbUrl.startsWith("mysql://")) {
  fail("DATABASE_URL must start with  mysql://");
  info("     Format: mysql://USER:PASSWORD@HOST:PORT/DBNAME");
} else if (dbUrl) {
  ok("DATABASE_URL format looks correct");
}

// ── 5. Prisma client ─────────────────────────────────────────────────────────
try {
  require("@prisma/client");
  ok("@prisma/client module is generated");
} catch {
  fail("@prisma/client is not generated");
  info("Fix: npx prisma generate");
  allOk = false;
}

// ── 6. Required npm packages ─────────────────────────────────────────────────
const packages = ["express","cors","helmet","bcryptjs","jsonwebtoken","zod","multer","winston","morgan","nodemailer"];
for (const pkg of packages) {
  try { require(pkg); ok(`${pkg} installed`); }
  catch { fail(`${pkg} is missing  →  run: npm install`); allOk = false; }
}

// ── 7. Database connection ───────────────────────────────────────────────────
console.log("\n" + line);
console.log("  Testing database connection…");
console.log(line);

if (!allOk) {
  console.log("\n  ⛔  Fix the errors above before testing the database.\n");
  process.exit(1);
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

prisma.$connect()
  .then(async () => {
    ok("MySQL connection SUCCESSFUL");

    // Check if tables exist
    try {
      const count = await prisma.user.count();
      ok(`Users table exists (${count} records)`);
      if (count === 0) warn("Database is empty — run: node src/utils/seed.js");
    } catch {
      warn("Tables may not exist yet — run: npx prisma db push");
    }

    await prisma.$disconnect();

    console.log("\n" + line);
    console.log("  🚀  All checks passed! Start the server:");
    console.log("      npm run dev");
    console.log(line + "\n");
  })
  .catch((err) => {
    fail("Database connection FAILED: " + err.message);
    console.log("\n  Common fixes:");
    console.log("  • Start MySQL:  Open Services → MySQL80 → Start");
    console.log('  • Create DB:    mysql -u root -p -e "CREATE DATABASE medispring;"');
    console.log("  • Check .env:   DATABASE_URL password matches MySQL root password");
    console.log("  • Default port: MySQL uses 3306\n");
    process.exit(1);
  });
