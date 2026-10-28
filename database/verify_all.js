const mysql = require('../backend/node_modules/mysql2/promise');
const bcrypt = require('../backend/node_modules/bcryptjs');

const BASE_URL = 'http://127.0.0.1:5000/api';

async function runVerification() {
  const report = {
    timestamp: new Date().toISOString(),
    testsPassed: 0,
    testsFailed: 0,
    details: []
  };

  function logPass(title, extra = '') {
    report.testsPassed++;
    report.details.push({ status: 'PASS', title, extra });
    console.log(`[PASS] ${title} ${extra ? `-> ${extra}` : ''}`);
  }

  function logFail(title, err) {
    report.testsFailed++;
    report.details.push({ status: 'FAIL', title, error: err.message || String(err) });
    console.error(`[FAIL] ${title} -> ${err.message || String(err)}`);
  }

  console.log('====================================================');
  console.log('   VALENCE-X FULL SYSTEM VERIFICATION SUITE');
  console.log('====================================================\n');

  // Reset database before tests to canonical starting state
  const { execSync } = require('child_process');
  execSync('npm run reset:demo', { stdio: 'ignore' });

  // 1. Direct MySQL Connectivity & Schema
  let conn;
  try {
    conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'students',
      database: 'unlisted_securities_exchange'
    });

    const [tables] = await conn.query('SHOW FULL TABLES');
    const baseTables = tables.filter(t => t.Table_type === 'BASE TABLE');
    const views = tables.filter(t => t.Table_type === 'VIEW');
    const [triggers] = await conn.query('SHOW TRIGGERS');

    if (baseTables.length >= 8 && views.length >= 7 && triggers.length >= 5) {
      logPass('Database Schema Integrity', `${baseTables.length} tables, ${views.length} views, ${triggers.length} triggers active`);
    } else {
      throw new Error(`Expected at least 8 tables, 7 views, 5 triggers. Got ${baseTables.length} tables, ${views.length} views, ${triggers.length} triggers`);
    }
  } catch (err) {
    logFail('Database Schema Integrity', err);
  }

  // 2. Market Data Endpoints
  try {
    const compRes = await fetch(`${BASE_URL}/companies`).then(r => r.json());
    const shareRes = await fetch(`${BASE_URL}/shares`).then(r => r.json());
    if (Array.isArray(compRes) && compRes.length >= 5 && Array.isArray(shareRes) && shareRes.length >= 4) {
      logPass('Market Securities API', `${compRes.length} companies, ${shareRes.length} securities listed`);
    } else {
      throw new Error('Companies or shares array incomplete');
    }
  } catch (err) {
    logFail('Market Securities API', err);
  }

  // 3. Authentication: Demo Users Login & Token/Profile Verification
  try {
    // A. Arjun Login
    const arjunAuth = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'arjun@valence.local', password: 'Password@123' })
    }).then(r => r.json());

    if (!arjunAuth.user || Number(arjunAuth.user.user_id) !== 2) throw new Error(arjunAuth.error || 'Failed Arjun login');
    if (!Array.isArray(arjunAuth.user.holdings) || arjunAuth.user.holdings.length === 0) throw new Error('Arjun missing holdings on login');
    if (Number(arjunAuth.user.wallet_balance) !== 50000) throw new Error(`Expected Arjun wallet 50000, got ${arjunAuth.user.wallet_balance}`);
    logPass('Seller Auth (Arjun)', `Holdings: ${arjunAuth.user.holdings[0].company_name} (${arjunAuth.user.shares_owned} shares), Wallet: ₹${arjunAuth.user.wallet_balance}`);

    // B. Kapil Login
    const kapilAuth = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kapil@valence.local', password: 'Password@123' })
    }).then(r => r.json());

    if (!kapilAuth.user || Number(kapilAuth.user.user_id) !== 1) throw new Error(kapilAuth.error || 'Failed Kapil login');
    if (Number(kapilAuth.user.wallet_balance) !== 100000) throw new Error(`Expected Kapil wallet 100000, got ${kapilAuth.user.wallet_balance}`);
    logPass('Buyer Auth (Kapil)', `Wallet: ₹${kapilAuth.user.wallet_balance}, Shares: ${kapilAuth.user.shares_owned}`);

    // C. Admin Login
    const adminAuth = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@valence.local', password: 'admin123' })
    }).then(r => r.json());
    if (!adminAuth.user || adminAuth.user.role !== 'Admin') throw new Error(adminAuth.error || 'Failed Admin login');
    logPass('Market Admin Auth', `Role: ${adminAuth.user.role}, Name: ${adminAuth.user.name}`);

  } catch (err) {
    logFail('Authentication Verification', err);
  }

  // 4. Registration Flow for New User
  const testEmail = `viva_test_${Date.now()}@valence.local`;
  let registeredUserId;
  try {
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Viva Test Investor',
        email: testEmail,
        password: 'Password@123',
        role: 'Investor'
      })
    }).then(r => r.json());

    if (!signupRes.user || !signupRes.user.user_id) throw new Error(signupRes.error || 'Failed signup');
    registeredUserId = signupRes.user.user_id;

    if (Number(signupRes.user.wallet_balance) !== 100000) {
      throw new Error(`Expected new user wallet 100000, got ${signupRes.user.wallet_balance}`);
    }
    logPass('New User Registration', `User #${registeredUserId} registered with ₹${signupRes.user.wallet_balance} default funds`);
  } catch (err) {
    logFail('New User Registration', err);
  }

  // 5. Wallet Management (PATCH /api/users/:id/wallet)
  try {
    if (registeredUserId) {
      const patchRes = await fetch(`${BASE_URL}/users/${registeredUserId}/wallet`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 150000.50, action: 'set' })
      }).then(r => r.json());

      if (Number(patchRes.user.wallet_balance) !== 150000.50) {
        throw new Error(`Wallet balance mismatch: ${patchRes.user.wallet_balance}`);
      }
      logPass('Wallet Adjustment API', `Updated User #${registeredUserId} wallet to ₹${patchRes.user.wallet_balance}`);
    }
  } catch (err) {
    logFail('Wallet Adjustment API', err);
  }

  // 6. User Profile Card / Dossier Endpoint
  try {
    const dossier = await fetch(`${BASE_URL}/users/profile-card/2`).then(r => r.json());
    if (!dossier.user || !dossier.summary) throw new Error('Dossier structure invalid');
    logPass('Participant Dossier API', `Retrieved dossier for ${dossier.user.name} (Valuation: ₹${dossier.summary.total_portfolio_value})`);
  } catch (err) {
    logFail('Participant Dossier API', err);
  }

  // 7. Order Placement & Matching Engine End-to-End
  try {
    // Place a Sell order as Arjun: 10 shares of NovaTech (share_id: 1) @ ₹245
    const sellRes = await fetch(`${BASE_URL}/sell`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 2,
        share_id: 1,
        quantity: 10,
        price: 245
      })
    }).then(r => r.json());

    if (!sellRes.sell_id) throw new Error(sellRes.error || 'Failed to place sell order');
    logPass('Sell Order Submission', `Order #${sellRes.sell_id} placed by Arjun (10 shares @ ₹245)`);

    // Place a Buy order as Kapil: 10 shares of NovaTech (share_id: 1) @ ₹245
    const buyRes = await fetch(`${BASE_URL}/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1,
        share_id: 1,
        quantity: 10,
        price: 245
      })
    }).then(r => r.json());

    if (!buyRes.buy_id) throw new Error(buyRes.error || 'Failed to place buy order');
    logPass('Buy Order Submission', `Order #${buyRes.buy_id} placed by Kapil (10 shares @ ₹245)`);

    // Record balances prior to match
    const kapilBefore = await fetch(`${BASE_URL}/users/1`).then(r => r.json());
    const arjunBefore = await fetch(`${BASE_URL}/users/2`).then(r => r.json());

    // Execute Order Matching Engine
    const matchRes = await fetch(`${BASE_URL}/match`, { method: 'POST' }).then(r => r.json());
    if (matchRes.matched_count < 1) throw new Error(`Matching failed: ${matchRes.message}`);
    logPass('ACID Order Matching Engine', `Executed ${matchRes.matched_count} trade(s) successfully`);

    // Verify Balances & Custody Post-Match
    const kapilAfter = await fetch(`${BASE_URL}/users/1`).then(r => r.json());
    const arjunAfter = await fetch(`${BASE_URL}/users/2`).then(r => r.json());

    const expectedCost = 10 * 245; // 2450
    const kapilDeduction = Number(kapilBefore.wallet_balance) - Number(kapilAfter.wallet_balance);
    const arjunCredit = Number(arjunAfter.wallet_balance) - Number(arjunBefore.wallet_balance);

    if (Math.abs(kapilDeduction - expectedCost) > 0.01) {
      throw new Error(`Kapil wallet deduction expected ₹${expectedCost}, got ₹${kapilDeduction}`);
    }
    if (Math.abs(arjunCredit - expectedCost) > 0.01) {
      throw new Error(`Arjun wallet credit expected ₹${expectedCost}, got ₹${arjunCredit}`);
    }
    if (Number(kapilAfter.shares_owned) !== Number(kapilBefore.shares_owned) + 10) {
      throw new Error('Kapil custody shares did not increment by 10');
    }
    if (Number(arjunAfter.shares_owned) !== Number(arjunBefore.shares_owned) - 10) {
      throw new Error('Arjun custody shares did not decrement by 10');
    }

    logPass('Atomic Wallet & Custody Settlement', `Buyer: -₹${expectedCost} (+10 shares) | Seller: +₹${expectedCost} (-10 shares)`);

  } catch (err) {
    logFail('Order Execution & Settlement', err);
  }

  // 8. DBMS Analytical Views & Triggers Check
  try {
    const viewsList = await fetch(`${BASE_URL}/stats/views`).then(r => r.json());
    const sampleView = await fetch(`${BASE_URL}/stats/views/vw_company_securities`).then(r => r.json());
    if (viewsList.length >= 7 && Array.isArray(sampleView.rows)) {
      logPass('Phase III Analytical Views', `${viewsList.length} views operational (${sampleView.rows.length} rows in vw_company_securities)`);
    } else {
      throw new Error('Views listing or data failed');
    }

    const queriesList = await fetch(`${BASE_URL}/stats/queries`).then(r => r.json());
    if (queriesList.length >= 16) {
      logPass('Phase II 16 Core Queries', `${queriesList.length} assignment queries ready in DBMS Explorer`);
    } else {
      throw new Error(`Expected 16 queries, found ${queriesList.length}`);
    }
  } catch (err) {
    logFail('Phase II/III Academic Deliverables', err);
  }

  // Cleanup: Delete the registered test user
  if (conn && registeredUserId) {
    try {
      await conn.query('DELETE FROM users WHERE user_id = ?', [registeredUserId]);
    } catch {}
  }
  if (conn) await conn.end();

  // Reset database after tests so live demo is fresh
  execSync('npm run reset:demo', { stdio: 'ignore' });

  console.log('\n====================================================');
  console.log(`VERIFICATION COMPLETE: ${report.testsPassed} PASSED, ${report.testsFailed} FAILED`);
  console.log('====================================================');

  return report;
}

runVerification();
