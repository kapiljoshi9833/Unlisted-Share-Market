/**
 * VALENCE-X — Demo Reset Script
 * ====================================================
 * Wipes and re-seeds the database to a clean demo state.
 * Run this before a viva or demonstration:
 *
 *   node database/reset_demo.js
 *
 * From the project root (after npm install in backend/):
 *   cd backend && node ../database/reset_demo.js && cd ..
 */

// Load modules from backend/node_modules (script can run from any directory)
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
    // Disable FK checks so we can truncate in any order
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Clear all transactional tables
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

    // ── SEED: Companies ───────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO companies (company_id, company_name, sector, description, company_status, founded_year, created_at)
      VALUES
        (1, 'NovaTech Systems',    'Enterprise Cloud & AI',   'B2B enterprise infrastructure and multi-cloud security engine.',       'Active', 2019, '2026-01-01'),
        (2, 'FinEdge Networks',    'Fintech & Payments',      'Cross-border settlement ledger and neobanking API infrastructure.',   'Active', 2021, '2026-01-02'),
        (3, 'GreenGrid Energy',    'Clean Tech & Mobility',   'Grid storage management and decentralized battery network software.', 'Active', 2020, '2026-01-05'),
        (4, 'MediCore Analytics', 'Health Informatics',      'Deep diagnostics indexing and healthcare interoperability layer.',    'Active', 2018, '2026-01-08'),
        (5, 'UrbanChain Realty',  'PropTech & Infrastructure','Tokenised fractional commercial real-estate registry.',              'Active', 2022, '2026-01-10')
    `);
    console.log('[SEED]   companies: 5 rows');

    // ── SEED: Shares ──────────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO shares (share_id, company_id, share_type, total_shares, available_shares, face_value, current_price)
      VALUES
        (1, 1, 'Equity',     50000, 42000, 10.00, 250.00),
        (2, 2, 'Equity',     40000, 18500, 10.00,  94.00),
        (3, 3, 'Equity',     60000, 31000,  5.00, 145.00),
        (4, 4, 'Preference', 35000,  9500, 10.00, 315.00),
        (5, 5, 'Class A',    25000, 12000, 10.00, 180.00)
    `);
    console.log('[SEED]   shares: 5 rows');

    // ── SEED: Users (bcryptjs hash of "Password@123" and "admin123") ──────────
    // Hashes pre-computed — avoids requiring bcryptjs at seed time
    const investorHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // "Password@123"
    const adminHash    = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p362kim6oh55u.7M5aCCMK'; // "admin123"
    await conn.query(`
      INSERT INTO users (user_id, name, email, password, role, kyc_status, share_id, shares_owned, created_at)
      VALUES
        (1, 'Kapil Sharma', 'kapil@valence.local', ?, 'Investor', 'VERIFIED', 1, 450, '2026-01-10 09:00:00'),
        (2, 'Arjun Verma',  'arjun@valence.local', ?, 'Investor', 'VERIFIED', 1, 300, '2026-01-12 10:00:00'),
        (3, 'Pooja Mehta',  'pooja@valence.local', ?, 'Investor', 'VERIFIED', 2, 150, '2026-02-01 08:30:00'),
        (4, 'Rahul Nair',   'rahul@valence.local', ?, 'Investor', 'VERIFIED', 2, 200, '2026-02-10 11:00:00'),
        (5, 'Sneha Patel',  'sneha@valence.local', ?, 'Investor', 'VERIFIED', 3, 100, '2026-02-15 09:45:00'),
        (6, 'Market Admin', 'admin@valence.local', ?, 'Admin',    'VERIFIED', NULL, 0, '2026-01-01 00:00:00')
    `, [investorHash, investorHash, investorHash, investorHash, investorHash, adminHash]);
    console.log('[SEED]   users: 6 rows  (passwords: Investors=Password@123, Admin=admin123)');

    // ── SEED: Buy Orders ──────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO buy (buy_id, user_id, share_id, quantity, price, remaining_quantity, buy_status, created_at)
      VALUES
        (1, 1, 1, 200, 250.00,  50, 'PARTIAL',  '2026-10-01 10:15:00'),
        (2, 3, 1, 100, 250.00, 100, 'PENDING',  '2026-10-02 11:30:00'),
        (3, 2, 3, 150, 145.00, 150, 'PENDING',  '2026-10-02 15:00:00'),
        (4, 3, 2, 120,  95.00,  70, 'PARTIAL',  '2026-10-03 10:15:00'),
        (5, 1, 4,  80, 315.00,  80, 'PENDING',  '2026-10-03 16:30:00'),
        (6, 1, 2, 100,  90.00, 100, 'PENDING',  '2026-10-04 11:45:00')
    `);
    console.log('[SEED]   buy orders: 6 rows');

    // ── SEED: Sell Orders ─────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO sell (sell_id, user_id, share_id, quantity, price, remaining_quantity, sell_status, created_at)
      VALUES
        (1, 2, 1, 300, 245.00, 150, 'PARTIAL',   '2026-09-30 10:00:00'),
        (2, 4, 2, 200,  94.00, 150, 'PARTIAL',   '2026-10-01 10:30:00'),
        (3, 3, 3, 100, 155.00, 100, 'PENDING',   '2026-10-02 12:30:00'),
        (4, 5, 4,  75, 325.00,   0, 'COMPLETED', '2026-10-03 13:50:00'),
        (5, 4, 1,  80, 230.00,  80, 'PENDING',   '2026-10-04 16:10:00')
    `);
    console.log('[SEED]   sell orders: 5 rows');

    // ── SEED: Transactions ────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO transactions (transaction_id, buyer_id, buy_id, seller_id, sell_id, share_id, quantity, price, transaction_time)
      VALUES
        (1, 1, 1, 2, 1, 1, 150, 245.00, '2026-10-01 11:00:00'),
        (2, 3, 4, 4, 2, 2,  50,  94.00, '2026-10-03 10:45:00')
    `);
    console.log('[SEED]   transactions: 2 rows');

    // ── SEED: ESOPs ───────────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO esops (esop_id, user_id, company_id, number_of_options, exercise_price, vesting_period, grant_date, expiry_date, exercise_status)
      VALUES
        (1, 1, 1, 5000, 200.00, '3 years cliff',  '2026-03-01', '2029-03-01', 'Unvested'),
        (2, 3, 2,  800,  80.00, '4 years monthly','2026-04-15', '2030-04-15', 'Unvested'),
        (3, 2, 3, 2000, 120.00, '2 years cliff',  '2026-05-01', '2028-05-01', 'Vested'),
        (4, 4, 4, 1200, 290.00, '3 years monthly','2026-06-01', '2029-06-01', 'Partially Vested'),
        (5, 5, 1, 3500, 215.00, '4 years cliff',  '2026-07-01', '2030-07-01', 'Unvested')
    `);
    console.log('[SEED]   esops: 5 rows');

    // ── SEED: Debentures ──────────────────────────────────────────────────────
    await conn.query(`
      INSERT INTO debentures (debenture_id, company_id, debenture_name, face_value, interest_rate, issue_quantity, issue_date, maturity_date, status)
      VALUES
        (1, 1, 'NovaTech 9.5% NCD 2029',   1000, 9.50, 10000, '2026-02-01', '2029-02-01', 'Active'),
        (2, 3, 'GreenGrid 8.2% Bond 2028',   500, 8.20,  5000, '2026-03-15', '2028-03-15', 'Active'),
        (3, 4, 'MediCore 10.1% NCD 2030',  1000,10.10,  8000, '2026-04-01', '2030-04-01', 'Active'),
        (4, 2, 'FinEdge 7.8% Bond 2027',    500, 7.80,  6000, '2026-01-20', '2027-01-20', 'Active'),
        (5, 5, 'UrbanChain 9.0% NCD 2031', 1000, 9.00,  4000, '2026-05-01', '2031-05-01', 'Active')
    `);
    console.log('[SEED]   debentures: 5 rows');

    console.log('\n[DONE] ✅  Database reset and seeded successfully!');
    console.log('       Demo accounts:');
    console.log('         kapil@valence.local  / Password@123');
    console.log('         arjun@valence.local  / Password@123');
    console.log('         pooja@valence.local  / Password@123');
    console.log('         rahul@valence.local  / Password@123');
    console.log('         sneha@valence.local  / Password@123');
    console.log('         admin@valence.local  / admin123');

  } catch (err) {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('[ERROR]', err.message);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

reset();
