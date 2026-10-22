/**
 * VALENCE-X — Clean Viva Demonstration Reset Script
 * ====================================================
 * Wipes and re-seeds the database with:
 * - 5 Companies & 4 Share Classes
 * - Real ESOP Grants & Corporate Debentures
 * - ONLY 2 Investors (Kapil Joshi & Arjun Verma) + 1 Admin
 * - ZERO existing orders or transactions (clean slate for ma'am demo!)
 *
 * Arjun Verma starts with 300 shares of NovaTech (can SELL).
 * Kapil Joshi starts with 0 shares (can BUY).
 * When you match, TXN-1 is created right before her eyes!
 *
 * Run anytime:
 *   npm run reset:demo
 */

const backendDir = require('path').join(__dirname, '..', 'backend');
require(require('path').join(backendDir, 'node_modules', 'dotenv')).config({ path: require('path').join(backendDir, '.env') });
const mysql = require(require('path').join(backendDir, 'node_modules', 'mysql2', 'promise'));

const DB = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'unlisted_securities_exchange',
  port: Number(process.env.DB_PORT) || 3307,
  multipleStatements: true,
};

async function reset() {
  const conn = await mysql.createConnection(DB);
  console.log('[VALENCE-X] Connected to MySQL on port', DB.port);

  try {
    // Disable FK checks so we can truncate cleanly
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE transactions');
    await conn.query('TRUNCATE TABLE buy');
    await conn.query('TRUNCATE TABLE sell');
    await conn.query('TRUNCATE TABLE esops');
    await conn.query('TRUNCATE TABLE debentures');
    await conn.query('TRUNCATE TABLE shares');
    await conn.query('TRUNCATE TABLE users');
    await conn.query('TRUNCATE TABLE companies');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('[RESET]  All tables cleared.');

    // ── 1. COMPANIES (5 companies as per DBMS assignment) ──────────────────────
    await conn.query(`
      INSERT INTO companies (company_id, company_name, sector, description, company_status, founded_year, created_at)
      VALUES
        (1, 'NovaTech Innovations', 'Enterprise Cloud & AI',       'High-throughput distributed compute platform and AI inference engine.', 'Active', 2019, '2026-01-01 10:00:00'),
        (2, 'GreenGrid Energy',      'Clean Tech & Mobility',       'Smart grid management and renewable energy storage infrastructure.',   'Active', 2020, '2026-01-02 10:00:00'),
        (3, 'UrbanNest Developers',  'Real Estate & Infrastructure','Commercial tech parks and modern residential infrastructure.',          'Active', 2016, '2026-01-03 10:00:00'),
        (4, 'BioHealth Diagnostics', 'Healthcare & Life Sciences',   'Molecular diagnostic informatics and genomic data warehousing.',       'Active', 2018, '2026-01-04 10:00:00'),
        (5, 'AeroSpace Dynamics',    'Aerospace & Defense',         'Next-generation satellite telemetry and payload guidance systems.',    'Active', 2022, '2026-01-05 10:00:00')
    `);
    console.log('[SEED]   companies: 5 rows');

    // ── 2. SHARES (4 equity securities across companies) ──────────────────────
    await conn.query(`
      INSERT INTO shares (share_id, company_id, share_type, total_shares, available_shares, face_value, current_price, created_at)
      VALUES
        (1, 1, 'Equity', 50000, 4200, 10.00, 250.00, '2026-01-06 10:00:00'),
        (2, 2, 'Equity', 60000, 3100,  5.00,  95.00, '2026-01-07 10:00:00'),
        (3, 3, 'Equity', 40000, 1850, 10.00, 150.00, '2026-01-08 10:00:00'),
        (4, 4, 'Equity', 30000, 2500, 10.00, 320.00, '2026-01-09 10:00:00')
    `);
    console.log('[SEED]   shares: 4 rows');

    // ── 3. USERS: Only 2 Real Participants (You + Friend) + 1 Admin ───────────
    // Hashes for 'Password@123' and 'admin123'
    const investorHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const adminHash    = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p362kim6oh55u.7M5aCCMK';

    await conn.query(`
      INSERT INTO users (user_id, name, email, password, role, kyc_status, share_id, shares_owned, created_at)
      VALUES
        (1, 'Kapil Joshi', 'kapil@valence.local', ?, 'Investor', 'VERIFIED', NULL,   0, '2026-01-10 09:00:00'),
        (2, 'Arjun Verma', 'arjun@valence.local', ?, 'Investor', 'VERIFIED',    1, 300, '2026-01-11 11:30:00'),
        (3, 'Market Admin','admin@valence.local', ?, 'Admin',    'VERIFIED', NULL,   0, '2026-01-01 08:00:00')
    `, [investorHash, investorHash, adminHash]);
    console.log('[SEED]   users: 3 rows (Kapil Joshi [Buyer], Arjun Verma [Seller, 300 shares], Market Admin)');

    // ── 4. ESOPS (Belonging to Kapil and Arjun) ────────────────────────────────
    await conn.query(`
      INSERT INTO esops (esop_id, user_id, company_id, number_of_options, exercise_price, vesting_period, exercise_status, grant_date, expiry_date)
      VALUES
        (1, 1, 1, 5000, 200.00, '36 Months (Graded)', 'Partially Vested', '2024-03-01', '2029-03-01'),
        (2, 2, 2,  800,  80.00, '24 Months (Cliff)',  'Unvested',         '2025-06-15', '2030-06-15'),
        (3, 1, 3, 2000, 120.00, '48 Months (Graded)', 'Vested',           '2023-01-10', '2028-01-10')
    `);
    console.log('[SEED]   esops: 3 rows');

    // ── 5. DEBENTURES (Corporate Fixed-Income Debt) ────────────────────────────
    await conn.query(`
      INSERT INTO debentures (debenture_id, company_id, debenture_name, face_value, interest_rate, issue_quantity, issue_date, maturity_date, status)
      VALUES
        (1, 1, 'NovaTech 8.50% Senior Series A',       1000.00, 8.50, 500, '2024-01-15', '2030-01-15', 'Active'),
        (2, 2, 'GreenGrid 7.50% Renewable Green Bond', 1000.00, 7.50, 700, '2024-06-01', '2031-06-01', 'Active'),
        (3, 3, 'UrbanNest 9.00% Property Infra Bond',  1000.00, 9.00, 400, '2023-11-01', '2032-11-01', 'Active')
    `);
    console.log('[SEED]   debentures: 3 rows');

    // ── 6. ORDERS & TRANSACTIONS: CLEAN SLATE ─────────────────────────────────
    console.log('[SEED]   buy orders: 0 (Ready for live demo!)');
    console.log('[SEED]   sell orders: 0 (Ready for live demo!)');
    console.log('[SEED]   transactions: 0 (Ready for live demo!)');

    console.log('\n[DONE] ✅ Clean viva demonstration dataset active in MySQL!');
    console.log('       Accounts:');
    console.log('         1. Kapil Joshi (Buyer):        kapil@valence.local  / Password@123  (0 shares)');
    console.log('         2. Arjun Verma (Seller/Friend): arjun@valence.local  / Password@123  (300 shares NovaTech)');
    console.log('         3. Market Admin:               admin@valence.local  / admin123');

  } catch (err) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('[ERROR]', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

reset();
