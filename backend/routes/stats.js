const express = require('express');
const router = express.Router();
const db = require('../db');

// Phase III Views Catalog with metadata and SQL definitions
const VIEWS_CATALOG = [
  {
    name: 'vw_company_securities',
    title: 'Company Securities Directory',
    category: 'Securities & Market Cap',
    description: 'Consolidates corporate profiles with listed share classes, total issuance, circulating float, face value, and estimated market capitalization.',
    tables_joined: ['companies', 'shares'],
    sql: `CREATE VIEW vw_company_securities AS
SELECT 
    c.company_id,
    c.company_name,
    c.sector,
    c.company_status,
    c.founded_year,
    s.share_id,
    s.share_type,
    s.total_shares,
    s.available_shares,
    s.face_value,
    s.current_price,
    ROUND(s.total_shares * s.current_price, 2) AS estimated_market_cap,
    s.created_at AS security_listed_at
FROM companies c
JOIN shares s ON c.company_id = s.company_id;`
  },
  {
    name: 'vw_open_buy_orders',
    title: 'Live Order Book — Bids (Market Depth)',
    category: 'Order Book',
    description: 'Real-time order book for active buy orders (PENDING / PARTIAL) prioritized by highest bid price and earliest placement time.',
    tables_joined: ['buy', 'users', 'shares', 'companies'],
    sql: `CREATE VIEW vw_open_buy_orders AS
SELECT 
    b.buy_id,
    b.user_id AS buyer_id,
    u.name AS buyer_name,
    u.kyc_status,
    s.share_id,
    c.company_name,
    s.share_type,
    b.quantity AS original_quantity,
    b.remaining_quantity,
    b.price AS bid_price,
    ROUND(b.remaining_quantity * b.price, 2) AS total_commitment_value,
    b.buy_status,
    b.created_at
FROM buy b
JOIN users u ON b.user_id = u.user_id
JOIN shares s ON b.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
WHERE b.buy_status IN ('PENDING', 'PARTIAL')
  AND b.remaining_quantity > 0;`
  },
  {
    name: 'vw_open_sell_orders',
    title: 'Live Order Book — Asks (Market Depth)',
    category: 'Order Book',
    description: 'Real-time order book for active sell orders (PENDING / PARTIAL) prioritized by lowest asking price and earliest placement time.',
    tables_joined: ['sell', 'users', 'shares', 'companies'],
    sql: `CREATE VIEW vw_open_sell_orders AS
SELECT 
    sl.sell_id,
    sl.user_id AS seller_id,
    u.name AS seller_name,
    u.kyc_status,
    s.share_id,
    c.company_name,
    s.share_type,
    sl.quantity AS original_quantity,
    sl.remaining_quantity,
    sl.price AS asking_price,
    ROUND(sl.remaining_quantity * sl.price, 2) AS total_offering_value,
    sl.sell_status,
    sl.created_at
FROM sell sl
JOIN users u ON sl.user_id = u.user_id
JOIN shares s ON sl.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
WHERE sl.sell_status IN ('PENDING', 'PARTIAL')
  AND sl.remaining_quantity > 0;`
  },
  {
    name: 'vw_transaction_history',
    title: 'Settled Trade Audit Ledger',
    category: 'Audit & Settlement',
    description: 'Complete audit trail of all executed transactions, connecting buyer, seller, security class, execution price, and total settlement consideration.',
    tables_joined: ['transactions', 'shares', 'companies', 'users (buyer)', 'users (seller)'],
    sql: `CREATE VIEW vw_transaction_history AS
SELECT 
    t.transaction_id,
    t.share_id,
    c.company_name,
    s.share_type,
    t.buyer_id,
    ub.name AS buyer_name,
    t.seller_id,
    us.name AS seller_name,
    t.quantity,
    t.price AS execution_price,
    ROUND(t.quantity * t.price, 2) AS total_settlement_amount,
    t.transaction_time
FROM transactions t
JOIN shares s ON t.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
JOIN users ub ON t.buyer_id = ub.user_id
JOIN users us ON t.seller_id = us.user_id;`
  },
  {
    name: 'vw_company_trading_summary',
    title: 'Corporate Trading & Turnover Summary',
    category: 'Analytics',
    description: 'Aggregates volume, turnover value, and execution count per company, while reporting the most recent transaction price.',
    tables_joined: ['companies', 'shares', 'transactions'],
    sql: `CREATE VIEW vw_company_trading_summary AS
SELECT 
    c.company_id,
    c.company_name,
    c.sector,
    COUNT(t.transaction_id) AS total_trades_executed,
    COALESCE(SUM(t.quantity), 0) AS total_shares_traded,
    COALESCE(ROUND(SUM(t.quantity * t.price), 2), 0.00) AS total_turnover_value,
    (
        SELECT t2.price 
        FROM transactions t2 
        JOIN shares s2 ON t2.share_id = s2.share_id 
        WHERE s2.company_id = c.company_id 
        ORDER BY t2.transaction_time DESC, t2.transaction_id DESC 
        LIMIT 1
    ) AS last_traded_price
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
LEFT JOIN transactions t ON s.share_id = t.share_id
GROUP BY c.company_id, c.company_name, c.sector;`
  },
  {
    name: 'vw_esop_information',
    title: 'Employee Stock Options (ESOP) Registry',
    category: 'Incentive Plans',
    description: 'Exposes employee option grants, strike prices, total exercise value, vesting period terms, and current grant lifecycle status.',
    tables_joined: ['esops', 'users', 'companies'],
    sql: `CREATE VIEW vw_esop_information AS
SELECT 
    e.esop_id,
    e.user_id,
    u.name AS employee_name,
    u.email AS employee_email,
    e.company_id,
    c.company_name,
    e.number_of_options,
    e.exercise_price,
    ROUND(e.number_of_options * e.exercise_price, 2) AS total_exercise_value,
    e.vesting_period,
    e.exercise_status,
    e.grant_date,
    e.expiry_date
FROM esops e
JOIN users u ON e.user_id = u.user_id
JOIN companies c ON e.company_id = c.company_id;`
  },
  {
    name: 'vw_debenture_information',
    title: 'Corporate Debt & Debentures Ledger',
    category: 'Debt Instruments',
    description: 'Presents unlisted corporate debenture series, coupon interest rates, total issuance quantity, par value, and aggregate debt capitalization.',
    tables_joined: ['debentures', 'companies'],
    sql: `CREATE VIEW vw_debenture_information AS
SELECT 
    d.debenture_id,
    d.company_id,
    c.company_name,
    c.sector,
    d.interest_rate AS coupon_rate_pct,
    d.maturity_date,
    d.issue_quantity,
    d.face_value,
    ROUND(d.issue_quantity * d.face_value, 2) AS total_debt_value,
    d.status AS debenture_status,
    d.created_at
FROM debentures d
JOIN companies c ON d.company_id = c.company_id;`
  }
];

// Phase III Triggers Catalog with metadata and explanations
const TRIGGERS_CATALOG = [
  {
    name: 'trg_validate_buy_before_insert',
    event: 'INSERT',
    timing: 'BEFORE',
    table: 'buy',
    purpose: 'Enforces KYC verification, issuer status checks, and remaining quantity initialization before inserting a BUY order.',
    rules: [
      'Buyer KYC status must be strictly VERIFIED in users table.',
      'Issuer company of the requested share must have Active status.',
      'Automatically assigns remaining_quantity = quantity if null.'
    ],
    sql: `CREATE TRIGGER trg_validate_buy_before_insert
BEFORE INSERT ON buy
FOR EACH ROW
BEGIN
    DECLARE v_kyc VARCHAR(30);
    DECLARE v_company_status VARCHAR(30);

    -- Check Buyer KYC
    SELECT kyc_status INTO v_kyc 
    FROM users 
    WHERE user_id = NEW.user_id;

    IF v_kyc IS NULL OR v_kyc <> 'VERIFIED' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order Rejected: Buyer KYC status must be VERIFIED to submit buy orders.';
    END IF;

    -- Check Issuer Company Status
    SELECT c.company_status INTO v_company_status
    FROM shares s
    JOIN companies c ON s.company_id = c.company_id
    WHERE s.share_id = NEW.share_id;

    IF v_company_status IS NOT NULL AND v_company_status <> 'Active' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order Rejected: Cannot place buy order for an inactive company security.';
    END IF;

    -- Default remaining_quantity if null
    IF NEW.remaining_quantity IS NULL THEN
        SET NEW.remaining_quantity = NEW.quantity;
    END IF;
END;`
  },
  {
    name: 'trg_validate_sell_before_insert',
    event: 'INSERT',
    timing: 'BEFORE',
    table: 'sell',
    purpose: 'Strict pre-order validation ensuring seller KYC verification, actual custody balance verification, and remaining quantity initialization.',
    rules: [
      'Seller KYC status must be strictly VERIFIED in users table.',
      'Seller MUST hold the requested share_id in their portfolio custody.',
      'Available units (shares_owned minus existing open sell orders) must be >= NEW.quantity.',
      'Automatically assigns remaining_quantity = quantity if null.'
    ],
    sql: `CREATE TRIGGER trg_validate_sell_before_insert
BEFORE INSERT ON sell
FOR EACH ROW
BEGIN
    DECLARE v_kyc VARCHAR(30);
    DECLARE v_shares_owned INT DEFAULT 0;
    DECLARE v_held_share_id INT;
    DECLARE v_pending_sells INT DEFAULT 0;

    -- Check Seller KYC and Holdings
    SELECT kyc_status, COALESCE(shares_owned, 0), share_id 
    INTO v_kyc, v_shares_owned, v_held_share_id
    FROM users 
    WHERE user_id = NEW.user_id;

    IF v_kyc IS NULL OR v_kyc <> 'VERIFIED' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order Rejected: Seller KYC status must be VERIFIED to submit sell orders.';
    END IF;

    -- Strict shareholding check: Seller MUST hold this specific security in portfolio
    IF v_held_share_id IS NULL OR v_held_share_id <> NEW.share_id OR v_shares_owned <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order Rejected: You do not own any shares of this security in your custody portfolio.';
    END IF;

    -- Calculate already committed shares in open orders
    SELECT COALESCE(SUM(remaining_quantity), 0) INTO v_pending_sells
    FROM sell
    WHERE user_id = NEW.user_id
      AND share_id = NEW.share_id
      AND sell_status IN ('PENDING', 'PARTIAL');

    -- Validate that seller has enough uncommitted shares
    IF (v_shares_owned - v_pending_sells) < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order Rejected: Insufficient uncommitted shares in portfolio for this sell order.';
    END IF;

    IF NEW.remaining_quantity IS NULL THEN
        SET NEW.remaining_quantity = NEW.quantity;
    END IF;
END;`
  },
  {
    name: 'trg_buy_order_status_update',
    event: 'UPDATE',
    timing: 'BEFORE',
    table: 'buy',
    purpose: 'Automated state machine managing BUY order lifecycle transitions based on remaining execution quantities.',
    rules: [
      'If remaining_quantity == 0, transitions status automatically to COMPLETED.',
      'If 0 < remaining_quantity < original quantity, transitions status automatically to PARTIAL.',
      'If remaining_quantity == original quantity, keeps status as PENDING.'
    ],
    sql: `CREATE TRIGGER trg_buy_order_status_update
BEFORE UPDATE ON buy
FOR EACH ROW
BEGIN
    IF NEW.remaining_quantity <= 0 THEN
        SET NEW.remaining_quantity = 0;
        SET NEW.buy_status = 'COMPLETED';
    ELSEIF NEW.remaining_quantity < NEW.quantity THEN
        SET NEW.buy_status = 'PARTIAL';
    ELSE
        SET NEW.buy_status = 'PENDING';
    END IF;
END;`
  },
  {
    name: 'trg_sell_order_status_update',
    event: 'UPDATE',
    timing: 'BEFORE',
    table: 'sell',
    purpose: 'Automated state machine managing SELL order lifecycle transitions based on remaining execution quantities.',
    rules: [
      'If remaining_quantity == 0, transitions status automatically to COMPLETED.',
      'If 0 < remaining_quantity < original quantity, transitions status automatically to PARTIAL.',
      'If remaining_quantity == original quantity, keeps status as PENDING.'
    ],
    sql: `CREATE TRIGGER trg_sell_order_status_update
BEFORE UPDATE ON sell
FOR EACH ROW
BEGIN
    IF NEW.remaining_quantity <= 0 THEN
        SET NEW.remaining_quantity = 0;
        SET NEW.sell_status = 'COMPLETED';
    ELSEIF NEW.remaining_quantity < NEW.quantity THEN
        SET NEW.sell_status = 'PARTIAL';
    ELSE
        SET NEW.sell_status = 'PENDING';
    END IF;
END;`
  },
  {
    name: 'trg_after_transaction_settlement',
    event: 'INSERT',
    timing: 'AFTER',
    table: 'transactions',
    purpose: 'Post-settlement price discovery engine updating the official market quote of the security upon executed trade.',
    rules: [
      'Executes automatically upon successful trade execution in transactions table.',
      'Updates shares.current_price to match NEW.price (last traded price).',
      'Guarantees immediate mark-to-market valuation across the entire exchange.'
    ],
    sql: `CREATE TRIGGER trg_after_transaction_settlement
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    -- Update the latest traded price of the security (Price Discovery)
    UPDATE shares 
    SET current_price = NEW.price
    WHERE share_id = NEW.share_id;
END;`
  }
];

// Phase II 16 Core Queries Catalog
const QUERIES_CATALOG = [
  {
    id: 'Q1',
    title: 'Full Transaction Ledger',
    category: 'Multi-Table Joins (Q1-Q5)',
    concept: '6-Table Inner Join connecting transactions, buy, sell, users (buyer/seller), shares, and companies',
    sql: `SELECT 
    t.transaction_id,
    c.company_name,
    s.share_type,
    ub.name AS buyer_name,
    us.name AS seller_name,
    t.quantity,
    t.price AS execution_price,
    ROUND(t.quantity * t.price, 2) AS total_trade_value,
    t.transaction_time
FROM transactions t
JOIN buy b ON (t.buyer_id = b.user_id AND t.buy_id = b.buy_id)
JOIN sell sl ON (t.seller_id = sl.user_id AND t.sell_id = sl.sell_id)
JOIN users ub ON t.buyer_id = ub.user_id
JOIN users us ON t.seller_id = us.user_id
JOIN shares s ON t.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
ORDER BY t.transaction_id ASC;`
  },
  {
    id: 'Q2',
    title: 'Open Buy Orders with Security & Company Details',
    category: 'Multi-Table Joins (Q1-Q5)',
    concept: 'Filtering on order status and computing outstanding monetary commitments',
    sql: `SELECT 
    b.buy_id,
    u.name AS investor_name,
    c.company_name,
    s.share_type,
    b.quantity AS original_quantity,
    b.remaining_quantity,
    b.price AS bid_price,
    ROUND(b.remaining_quantity * b.price, 2) AS outstanding_commitment,
    b.buy_status,
    b.created_at
FROM buy b
JOIN users u ON b.user_id = u.user_id
JOIN shares s ON b.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
WHERE b.buy_status IN ('PENDING', 'PARTIAL')
ORDER BY b.price DESC, b.created_at ASC;`
  },
  {
    id: 'Q3',
    title: 'ESOP Grants and Employee Option Profiles',
    category: 'Multi-Table Joins (Q1-Q5)',
    concept: 'Relating incentive grants with corporate issuers and financial exercise terms',
    sql: `SELECT 
    e.esop_id,
    u.name AS employee_name,
    c.company_name,
    e.number_of_options,
    e.exercise_price,
    ROUND(e.number_of_options * e.exercise_price, 2) AS total_exercise_value,
    e.vesting_period,
    e.exercise_status,
    e.grant_date,
    e.expiry_date
FROM esops e
JOIN users u ON e.user_id = u.user_id
JOIN companies c ON e.company_id = c.company_id
ORDER BY e.esop_id ASC;`
  },
  {
    id: 'Q4',
    title: 'Companies Without Listed Securities (Anti-Join)',
    category: 'Multi-Table Joins (Q1-Q5)',
    concept: 'LEFT OUTER JOIN with IS NULL check for anti-join pattern detection',
    sql: `SELECT 
    c.company_id,
    c.company_name,
    c.sector,
    c.company_status,
    c.founded_year
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
WHERE s.share_id IS NULL
ORDER BY c.company_id ASC;`
  },
  {
    id: 'Q5',
    title: 'Potential Buy-Sell Order Matches (Cross Matching)',
    category: 'Multi-Table Joins (Q1-Q5)',
    concept: 'Cross-table matching condition (bid >= ask) without self-trading and calculating price spread',
    sql: `SELECT 
    b.buy_id,
    ub.name AS buyer_name,
    sl.sell_id,
    us.name AS seller_name,
    s.share_id,
    c.company_name,
    b.price AS buyer_bid,
    sl.price AS seller_ask,
    (b.price - sl.price) AS price_spread,
    LEAST(b.remaining_quantity, sl.remaining_quantity) AS potential_match_quantity,
    ROUND(LEAST(b.remaining_quantity, sl.remaining_quantity) * sl.price, 2) AS estimated_settlement_value
FROM buy b
JOIN sell sl ON b.share_id = sl.share_id
JOIN users ub ON b.user_id = ub.user_id
JOIN users us ON sl.user_id = us.user_id
JOIN shares s ON b.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
WHERE b.price >= sl.price
  AND b.user_id <> sl.user_id
  AND b.buy_status IN ('PENDING', 'PARTIAL')
  AND sl.sell_status IN ('PENDING', 'PARTIAL')
  AND b.remaining_quantity > 0
  AND sl.remaining_quantity > 0
ORDER BY potential_match_quantity DESC, b.price DESC;`
  },
  {
    id: 'Q6',
    title: 'Trade Statistics & Turnover by Company',
    category: 'Aggregates & Grouping (Q6-Q10)',
    concept: 'Multi-table LEFT JOIN with GROUP BY and COALESCE aggregation handling',
    sql: `SELECT 
    c.company_id,
    c.company_name,
    c.sector,
    COUNT(t.transaction_id) AS total_trades,
    COALESCE(SUM(t.quantity), 0) AS total_shares_traded,
    COALESCE(ROUND(SUM(t.quantity * t.price), 2), 0.00) AS total_turnover_value
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
LEFT JOIN transactions t ON s.share_id = t.share_id
GROUP BY c.company_id, c.company_name, c.sector
ORDER BY total_turnover_value DESC, total_trades DESC;`
  },
  {
    id: 'Q7',
    title: 'Price Statistics and Volume-Weighted Average Price (VWAP)',
    category: 'Aggregates & Grouping (Q6-Q10)',
    concept: 'Financial mathematical modeling in SQL: SUM(qty * price) / NULLIF(SUM(qty), 0)',
    sql: `SELECT 
    s.share_id,
    c.company_name,
    s.share_type,
    COUNT(t.transaction_id) AS total_executions,
    COALESCE(MIN(t.price), s.current_price) AS minimum_executed_price,
    COALESCE(MAX(t.price), s.current_price) AS maximum_executed_price,
    ROUND(COALESCE(AVG(t.price), s.current_price), 2) AS average_executed_price,
    ROUND(
        COALESCE(SUM(t.quantity * t.price) / NULLIF(SUM(t.quantity), 0), s.current_price),
        2
    ) AS volume_weighted_average_price_vwap
FROM shares s
JOIN companies c ON s.company_id = c.company_id
LEFT JOIN transactions t ON s.share_id = t.share_id
GROUP BY s.share_id, c.company_name, s.share_type, s.current_price
ORDER BY s.share_id ASC;`
  },
  {
    id: 'Q8',
    title: 'Active Investors with Three or More Total Orders',
    category: 'Aggregates & Grouping (Q6-Q10)',
    concept: 'Derived table with UNION ALL, GROUP BY, and HAVING clause filtering',
    sql: `SELECT 
    u.user_id,
    u.name AS investor_name,
    u.email,
    COUNT(*) AS total_order_count,
    SUM(CASE WHEN combined.order_type = 'BUY' THEN 1 ELSE 0 END) AS buy_orders_count,
    SUM(CASE WHEN combined.order_type = 'SELL' THEN 1 ELSE 0 END) AS sell_orders_count
FROM users u
JOIN (
    SELECT user_id, 'BUY' AS order_type FROM buy
    UNION ALL
    SELECT user_id, 'SELL' AS order_type FROM sell
) AS combined ON u.user_id = combined.user_id
GROUP BY u.user_id, u.name, u.email
HAVING COUNT(*) >= 3
ORDER BY total_order_count DESC;`
  },
  {
    id: 'Q9',
    title: 'Active Debenture Capital Value and Average Coupon Rate',
    category: 'Aggregates & Grouping (Q6-Q10)',
    concept: 'Aggregation over active corporate debt instruments with filtered grouping',
    sql: `SELECT 
    c.company_id,
    c.company_name,
    COUNT(d.debenture_id) AS total_debenture_series,
    COALESCE(SUM(d.issue_quantity * d.face_value), 0) AS total_debt_capital,
    ROUND(COALESCE(AVG(d.interest_rate), 0.00), 2) AS average_coupon_rate_pct
FROM companies c
JOIN debentures d ON c.company_id = d.company_id
WHERE d.status = 'Active'
GROUP BY c.company_id, c.company_name
ORDER BY total_debt_capital DESC;`
  },
  {
    id: 'Q10',
    title: 'Security Distribution and Inventory Summary by Sector',
    category: 'Aggregates & Grouping (Q6-Q10)',
    concept: 'Macro-level analysis with multi-entity DISTINCT counting and inventory aggregation',
    sql: `SELECT 
    c.sector,
    COUNT(DISTINCT c.company_id) AS total_companies,
    COUNT(DISTINCT s.share_id) AS total_security_classes,
    COALESCE(SUM(s.available_shares), 0) AS total_available_shares,
    ROUND(COALESCE(SUM(s.available_shares * s.current_price), 0), 2) AS estimated_sector_market_value
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
GROUP BY c.sector
ORDER BY estimated_sector_market_value DESC;`
  },
  {
    id: 'Q11',
    title: 'Securities Priced Above Exchange-Wide Average',
    category: 'Advanced Subqueries & Sets (Q11-Q16)',
    concept: 'Scalar subquery in WHERE clause comparing against global mean price',
    sql: `SELECT 
    s.share_id,
    c.company_name,
    s.share_type,
    s.current_price,
    ROUND((SELECT AVG(current_price) FROM shares), 2) AS exchange_average_price,
    ROUND(s.current_price - (SELECT AVG(current_price) FROM shares), 2) AS premium_over_average
FROM shares s
JOIN companies c ON s.company_id = c.company_id
WHERE s.current_price > (
    SELECT AVG(current_price) FROM shares
)
ORDER BY s.current_price DESC;`
  },
  {
    id: 'Q12',
    title: 'Pure Buyers (Placed Buy Orders but Never Sold)',
    category: 'Advanced Subqueries & Sets (Q11-Q16)',
    concept: 'Set difference using uncorrelated IN and NOT IN subqueries',
    sql: `SELECT 
    u.user_id,
    u.name AS investor_name,
    u.email,
    u.role,
    u.shares_owned
FROM users u
WHERE u.user_id IN (
    SELECT DISTINCT user_id FROM buy
)
AND u.user_id NOT IN (
    SELECT DISTINCT user_id FROM sell
)
ORDER BY u.user_id ASC;`
  },
  {
    id: 'Q13',
    title: 'Highest-Value Settled Transaction on Exchange',
    category: 'Advanced Subqueries & Sets (Q11-Q16)',
    concept: 'Scalar aggregate subquery filtering for MAX(quantity * price)',
    sql: `SELECT 
    t.transaction_id,
    c.company_name,
    s.share_type,
    ub.name AS buyer_name,
    us.name AS seller_name,
    t.quantity,
    t.price,
    ROUND(t.quantity * t.price, 2) AS total_transaction_value,
    t.transaction_time
FROM transactions t
JOIN shares s ON t.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
JOIN users ub ON t.buyer_id = ub.user_id
JOIN users us ON t.seller_id = us.user_id
WHERE (t.quantity * t.price) = (
    SELECT MAX(quantity * price) FROM transactions
);`
  },
  {
    id: 'Q14',
    title: 'Companies with Both Debentures and ESOP Plans',
    category: 'Advanced Subqueries & Sets (Q11-Q16)',
    concept: 'Dual correlated EXISTS predicates ensuring set intersection semantics',
    sql: `SELECT 
    c.company_id,
    c.company_name,
    c.sector,
    c.founded_year
FROM companies c
WHERE EXISTS (
    SELECT 1 FROM debentures d
    WHERE d.company_id = c.company_id
      AND d.status = 'Active'
)
AND EXISTS (
    SELECT 1 FROM esops e
    WHERE e.company_id = c.company_id
)
ORDER BY c.company_id ASC;`
  },
  {
    id: 'Q15',
    title: 'Sell Orders Below Their Security’s Average Ask Price',
    category: 'Advanced Subqueries & Sets (Q11-Q16)',
    concept: 'Correlated subquery computing group average dynamically in WHERE clause',
    sql: `SELECT 
    sl.sell_id,
    u.name AS seller_name,
    c.company_name,
    sl.quantity,
    sl.remaining_quantity,
    sl.price AS asking_price,
    ROUND(
        (SELECT AVG(s2.price) FROM sell s2 WHERE s2.share_id = sl.share_id),
        2
    ) AS security_average_ask,
    ROUND(
        (SELECT AVG(s2.price) FROM sell s2 WHERE s2.share_id = sl.share_id) - sl.price,
        2
    ) AS discount_spread,
    sl.sell_status
FROM sell sl
JOIN users u ON sl.user_id = u.user_id
JOIN shares s ON sl.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
WHERE sl.price < (
    SELECT AVG(s2.price)
    FROM sell s2
    WHERE s2.share_id = sl.share_id
)
ORDER BY sl.share_id, sl.price ASC;`
  },
  {
    id: 'Q16',
    title: 'Securities with No Open Sell Orders (Illiquid)',
    category: 'Advanced Subqueries & Sets (Q11-Q16)',
    concept: 'Correlated NOT EXISTS subquery checking order book liquidity',
    sql: `SELECT 
    s.share_id,
    c.company_name,
    s.share_type,
    s.current_price,
    s.available_shares
FROM shares s
JOIN companies c ON s.company_id = c.company_id
WHERE NOT EXISTS (
    SELECT 1
    FROM sell sl
    WHERE sl.share_id = s.share_id
      AND sl.sell_status IN ('PENDING', 'PARTIAL')
      AND sl.remaining_quantity > 0
)
ORDER BY s.share_id ASC;`
  }
];

// GET /api/stats/overview - Exchange high-level aggregate numbers
router.get('/overview', async (req, res) => {
  try {
    const [companiesCount] = await db.query('SELECT COUNT(*) as c FROM companies');
    const [sharesCount] = await db.query('SELECT COUNT(*) as c FROM shares');
    const [usersCount] = await db.query('SELECT COUNT(*) as c FROM users');
    const [txnCount] = await db.query('SELECT COUNT(*) as count, COALESCE(SUM(quantity * price), 0) as turnover FROM transactions');
    const [openBuys] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(remaining_quantity), 0) as qty FROM buy WHERE buy_status IN ('PENDING', 'PARTIAL')");
    const [openSells] = await db.query("SELECT COUNT(*) as count, COALESCE(SUM(remaining_quantity), 0) as qty FROM sell WHERE sell_status IN ('PENDING', 'PARTIAL')");

    res.status(200).json({
      companies: companiesCount[0].c,
      securities: sharesCount[0].c,
      users: usersCount[0].c,
      settled_trades: txnCount[0].count,
      total_turnover: Number(txnCount[0].turnover),
      open_buy_orders: openBuys[0].count,
      open_sell_orders: openSells[0].count
    });
  } catch (err) {
    console.error('Error fetching exchange overview:', err);
    res.status(500).json({ error: 'Failed to fetch exchange overview stats' });
  }
});

// GET /api/stats/views - Catalog of all 7 Phase III SQL Views
router.get('/views', (req, res) => {
  res.status(200).json(VIEWS_CATALOG);
});

// GET /api/stats/views/:viewName - Fetch data directly from a Phase III SQL View
router.get('/views/:viewName', async (req, res) => {
  try {
    const allowedViews = VIEWS_CATALOG.map(v => v.name);
    const { viewName } = req.params;

    if (!allowedViews.includes(viewName)) {
      return res.status(400).json({ error: 'Invalid view requested' });
    }

    const startTime = process.hrtime();
    const [rows, fields] = await db.query(`SELECT * FROM ${viewName}`);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const executionTimeMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

    res.status(200).json({
      viewName,
      rowCount: rows.length,
      executionTimeMs: Number(executionTimeMs),
      columns: fields ? fields.map(f => f.name) : (rows.length > 0 ? Object.keys(rows[0]) : []),
      rows
    });
  } catch (err) {
    console.error('Error querying view:', err);
    res.status(500).json({ error: 'Failed to query database view: ' + err.message });
  }
});

// GET /api/stats/triggers - Catalog of all 5 Phase III Triggers
router.get('/triggers', (req, res) => {
  res.status(200).json(TRIGGERS_CATALOG);
});

// GET /api/stats/queries - Catalog of all 16 Phase II Queries
router.get('/queries', (req, res) => {
  res.status(200).json(QUERIES_CATALOG);
});

// POST /api/stats/queries/run - Run one of the 16 Phase II Queries
router.post('/queries/run', async (req, res) => {
  try {
    const { queryId } = req.body;
    const targetQuery = QUERIES_CATALOG.find(q => q.id === queryId);

    if (!targetQuery) {
      return res.status(404).json({ error: `Query ${queryId} not found in catalog.` });
    }

    const startTime = process.hrtime();
    const [rows, fields] = await db.query(targetQuery.sql);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const executionTimeMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

    res.status(200).json({
      queryId: targetQuery.id,
      title: targetQuery.title,
      category: targetQuery.category,
      concept: targetQuery.concept,
      sql: targetQuery.sql,
      rowCount: rows.length,
      executionTimeMs: Number(executionTimeMs),
      columns: fields ? fields.map(f => f.name) : (rows.length > 0 ? Object.keys(rows[0]) : []),
      rows
    });
  } catch (err) {
    console.error(`Error running query:`, err);
    res.status(500).json({ error: 'Query execution failed: ' + err.message });
  }
});

// POST /api/stats/run-custom-sql - Run custom SELECT / EXPLAIN statement (read-only guard)
router.post('/run-custom-sql', async (req, res) => {
  try {
    const { sql } = req.body;
    if (!sql || typeof sql !== 'string') {
      return res.status(400).json({ error: 'SQL query string is required' });
    }

    const trimmed = sql.trim();
    const upper = trimmed.toUpperCase();
    
    // Strict read-only guard: Only allow SELECT, SHOW, EXPLAIN, DESCRIBE
    const isReadOnly = upper.startsWith('SELECT') || upper.startsWith('SHOW') || upper.startsWith('EXPLAIN') || upper.startsWith('DESCRIBE');
    if (!isReadOnly) {
      return res.status(403).json({ error: 'Security policy: Only read-only queries (SELECT, SHOW, EXPLAIN) are permitted in this console.' });
    }

    const startTime = process.hrtime();
    const [rows, fields] = await db.query(trimmed);
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const executionTimeMs = (seconds * 1000 + nanoseconds / 1e6).toFixed(2);

    res.status(200).json({
      sql: trimmed,
      rowCount: Array.isArray(rows) ? rows.length : 0,
      executionTimeMs: Number(executionTimeMs),
      columns: fields ? fields.map(f => f.name) : (Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : []),
      rows: Array.isArray(rows) ? rows : []
    });
  } catch (err) {
    console.error('Custom query execution failed:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
