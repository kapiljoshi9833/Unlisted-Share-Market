/**
 * VALENCE-X — Clean Viva Demonstration Seed Script
 * ====================================================
 * Wipes and re-seeds the database with:
 * - 5 Companies & 4 Share Classes (AeroSpace Dynamics has no shares for Q4 anti-join)
 * - 4 Market Participants (Arjun Verma, Rohan Mehta, Priya Sharma, Vikram Malhotra) + 1 Admin
 * - NO Kapil Joshi or Dhruvan Joshi (Reserved for live sign-up / sign-in during evaluation!)
 * - Active Buy & Sell Orders for live order book (vw_open_buy_orders, vw_open_sell_orders)
 * - Settled Historical Transactions for ledger (vw_transaction_history, VWAP Q7, 6-table join Q1)
 * - Real ESOP Grants (vw_esop_information) & Corporate Debentures (vw_debenture_information)
 *
 * Run anytime:
 *   node database/reset_demo.js  or  npm run reset:demo
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

async function seed() {
  const conn = await mysql.createConnection(DB);
  console.log('[VALENCE-X] Connected to MySQL on port', DB.port);

  try {
    // Disable FK checks and Triggers temporarily to populate clean seed data
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

    // ── 1. COMPANIES (5 companies) ─────────────────────────────────────────────
    // Note: AeroSpace Dynamics intentionally has NO shares to satisfy Phase II Q4 (anti-join)
    await conn.query(`
      INSERT INTO companies (company_id, company_name, sector, description, company_status, founded_year, created_at)
      VALUES
        (1, 'NovaTech Innovations', 'Enterprise Cloud & AI',        'High-throughput distributed compute platform and AI inference engine.', 'Active', 2019, '2026-01-01 10:00:00'),
        (2, 'GreenGrid Energy',      'Clean Tech & Mobility',        'Smart grid management and renewable energy storage infrastructure.',   'Active', 2020, '2026-01-02 10:00:00'),
        (3, 'UrbanNest Developers',  'Real Estate & Infrastructure', 'Commercial tech parks and modern residential infrastructure.',          'Active', 2016, '2026-01-03 10:00:00'),
        (4, 'BioHealth Diagnostics', 'Healthcare & Life Sciences',    'Molecular diagnostic informatics and genomic data warehousing.',       'Active', 2018, '2026-01-04 10:00:00'),
        (5, 'AeroSpace Dynamics',    'Aerospace & Defense',          'Next-generation satellite telemetry and payload guidance systems.',    'Active', 2022, '2026-01-05 10:00:00')
    `);
    console.log('[SEED]   companies: 5 rows');

    // ── 2. SHARES (4 equity securities across companies) ───────────────────────
    await conn.query(`
      INSERT INTO shares (share_id, company_id, share_type, total_shares, available_shares, face_value, current_price, created_at)
      VALUES
        (1, 1, 'Equity', 50000, 4200, 10.00, 245.00, '2026-01-06 10:00:00'),
        (2, 2, 'Equity', 60000, 3100,  5.00,  94.00, '2026-01-07 10:00:00'),
        (3, 3, 'Equity', 40000, 1850, 10.00, 150.00, '2026-01-08 10:00:00'),
        (4, 4, 'Equity', 30000, 2500, 10.00, 320.00, '2026-01-09 10:00:00')
    `);
    console.log('[SEED]   shares: 4 rows');

    // ── 3. USERS (Market Participants + Admin — NO Kapil Joshi or Dhruvan Joshi) ─
    // bcrypt hash for 'Password@123' and 'admin123'
    const investorHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const adminHash    = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p362kim6oh55u.7M5aCCMK';

    await conn.query(`
      INSERT INTO users (user_id, name, email, password, role, kyc_status, share_id, shares_owned, created_at)
      VALUES
        (1, 'Arjun Verma',     'arjun@valence.local',   ?, 'Investor', 'VERIFIED',    1, 400, '2026-01-10 09:00:00'),
        (2, 'Rohan Mehta',     'rohan@valence.local',   ?, 'Investor', 'VERIFIED',    2, 300, '2026-01-11 10:30:00'),
        (3, 'Priya Sharma',    'priya@valence.local',   ?, 'Investor', 'VERIFIED',    4, 200, '2026-01-12 11:15:00'),
        (4, 'Vikram Malhotra', 'vikram@valence.local',  ?, 'Investor', 'VERIFIED', NULL,   0, '2026-01-13 14:00:00'),
        (5, 'Market Admin',    'admin@valence.local',   ?, 'Admin',    'VERIFIED', NULL,   0, '2026-01-01 08:00:00')
    `, [investorHash, investorHash, investorHash, investorHash, adminHash]);
    console.log('[SEED]   users: 5 rows (Arjun, Rohan, Priya, Vikram, Admin — Kapil & Dhruvan ready for live signup)');

    // ── 4. BUY ORDERS (Weak entity with composite PK: user_id, buy_id) ─────────
    await conn.query(`
      INSERT INTO buy (buy_id, user_id, share_id, quantity, price, remaining_quantity, buy_status, created_at)
      VALUES
        (1, 4, 1, 150, 245.00,  50, 'PARTIAL', '2026-10-14 10:00:00'),
        (2, 4, 2, 100,  92.00, 100, 'PENDING', '2026-10-15 11:15:00'),
        (3, 2, 4,  50, 315.00,  50, 'PENDING', '2026-10-16 14:30:00'),
        (4, 3, 2,  80,  94.00,  40, 'PARTIAL', '2026-10-17 09:45:00')
    `);
    console.log('[SEED]   buy orders: 4 rows (Active bids in order book)');

    // ── 5. SELL ORDERS (Weak entity with composite PK: user_id, sell_id) ────────
    await conn.query(`
      INSERT INTO sell (sell_id, user_id, share_id, quantity, price, remaining_quantity, sell_status, created_at)
      VALUES
        (1, 1, 1, 100, 255.00, 100, 'PENDING',   '2026-10-14 09:30:00'),
        (2, 2, 2, 100,  96.00, 100, 'PENDING',   '2026-10-15 10:00:00'),
        (3, 3, 4,  50, 325.00,  50, 'PENDING',   '2026-10-16 12:00:00'),
        (4, 1, 1, 100, 245.00,   0, 'COMPLETED', '2026-10-14 10:30:00'),
        (5, 2, 2,  40,  94.00,   0, 'COMPLETED', '2026-10-17 10:15:00')
    `);
    console.log('[SEED]   sell orders: 5 rows (3 open asks, 2 filled counterparties)');

    // ── 6. TRANSACTIONS (Settled audit ledger) ─────────────────────────────────
    await conn.query(`
      INSERT INTO transactions (transaction_id, buyer_id, buy_id, seller_id, sell_id, share_id, quantity, price, transaction_time)
      VALUES
        (1, 4, 1, 1, 4, 1, 100, 245.00, '2026-10-15 11:30:00'),
        (2, 3, 4, 2, 5, 2,  40,  94.00, '2026-10-18 14:15:00')
    `);
    console.log('[SEED]   transactions: 2 rows (Executed trades connecting buyer, seller, securities)');

    // ── 7. ESOPS (Employee Stock Options) ──────────────────────────────────────
    await conn.query(`
      INSERT INTO esops (esop_id, user_id, company_id, number_of_options, exercise_price, vesting_period, exercise_status, grant_date, expiry_date)
      VALUES
        (1, 1, 1, 2500, 200.00, '36 Months (Graded)', 'Partially Vested', '2024-03-01', '2029-03-01'),
        (2, 2, 2, 1200,  80.00, '24 Months (Cliff)',  'Unvested',         '2025-06-15', '2030-06-15'),
        (3, 3, 3, 1500, 120.00, '48 Months (Graded)', 'Vested',           '2023-01-10', '2028-01-10')
    `);
    console.log('[SEED]   esops: 3 rows');

    // ── 8. DEBENTURES (Corporate Fixed-Income Debt) ────────────────────────────
    await conn.query(`
      INSERT INTO debentures (debenture_id, company_id, debenture_name, face_value, interest_rate, issue_quantity, issue_date, maturity_date, status)
      VALUES
        (1, 1, 'NovaTech 8.50% Senior Series A',       1000.00, 8.50, 500, '2024-01-15', '2030-01-15', 'Active'),
        (2, 2, 'GreenGrid 7.50% Renewable Green Bond', 1000.00, 7.50, 700, '2024-06-01', '2031-06-01', 'Active'),
        (3, 3, 'UrbanNest 9.00% Property Infra Bond',  1000.00, 9.00, 400, '2023-11-01', '2032-11-01', 'Active')
    `);
    console.log('[SEED]   debentures: 3 rows');

    console.log('\n[DONE] ✅ Demonstration dataset seeded successfully into MySQL!');
    console.log('       Sample Accounts:');
    console.log('         1. Arjun Verma:     arjun@valence.local   / Password@123  (400 shs NovaTech)');
    console.log('         2. Rohan Mehta:     rohan@valence.local   / Password@123  (300 shs GreenGrid)');
    console.log('         3. Priya Sharma:    priya@valence.local   / Password@123  (200 shs BioHealth)');
    console.log('         4. Vikram Malhotra: vikram@valence.local  / Password@123  (0 shs, Pure Buyer)');
    console.log('         5. Market Admin:    admin@valence.local   / admin123');
    console.log('       * Kapil Joshi & Dhruvan Joshi are completely free for live sign-up during viva!\n');

  } catch (err) {
    console.error('Error seeding demo data:', err);
    throw err;
  } finally {
    await conn.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
