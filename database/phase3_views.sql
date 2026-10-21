-- ============================================================================
-- VALENCE-X: Unlisted Securities Exchange
-- PHASE III: ACTIVE DATABASE PROGRAMMING — VIEWS
-- ============================================================================
-- Academic Focus: Data Abstraction, Real-Time Market Depth, Security Ledger,
-- Portfolio Valuations, and Aggregated Reporting.
-- Target RDBMS: MySQL 8.0+ / MySQL Workbench
-- Database: unlisted_securities_exchange
-- ============================================================================

USE unlisted_securities_exchange;

-- ----------------------------------------------------------------------------
-- Drop existing views if present
-- ----------------------------------------------------------------------------
DROP VIEW IF EXISTS vw_company_securities;
DROP VIEW IF EXISTS vw_open_buy_orders;
DROP VIEW IF EXISTS vw_open_sell_orders;
DROP VIEW IF EXISTS vw_transaction_history;
DROP VIEW IF EXISTS vw_company_trading_summary;
DROP VIEW IF EXISTS vw_esop_information;
DROP VIEW IF EXISTS vw_debenture_information;

-- ============================================================================
-- 1. VIEW: vw_company_securities
-- Purpose: Consolidate company profiles with their listed security classes,
-- total supply, public float, and current valuation.
-- ============================================================================
CREATE VIEW vw_company_securities AS
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
JOIN shares s ON c.company_id = s.company_id;


-- ============================================================================
-- 2. VIEW: vw_open_buy_orders (Market Depth - Bids)
-- Purpose: Real-time order book for buyers, sorted by highest bid price
-- (price-time priority).
-- ============================================================================
CREATE VIEW vw_open_buy_orders AS
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
  AND b.remaining_quantity > 0;


-- ============================================================================
-- 3. VIEW: vw_open_sell_orders (Market Depth - Asks)
-- Purpose: Real-time order book for sellers, sorted by lowest ask price
-- (price-time priority).
-- ============================================================================
CREATE VIEW vw_open_sell_orders AS
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
  AND sl.remaining_quantity > 0;


-- ============================================================================
-- 4. VIEW: vw_transaction_history
-- Purpose: Certified trade execution ledger joining buyers, sellers, orders,
-- and issuers for regulatory audits.
-- ============================================================================
CREATE VIEW vw_transaction_history AS
SELECT 
    t.transaction_id,
    t.buy_id,
    t.buyer_id,
    ub.name AS buyer_name,
    t.sell_id,
    t.seller_id,
    us.name AS seller_name,
    s.share_id,
    c.company_name,
    s.share_type,
    t.quantity,
    t.price AS execution_price,
    ROUND(t.quantity * t.price, 2) AS total_transaction_value,
    t.transaction_time
FROM transactions t
JOIN buy b ON (t.buyer_id = b.user_id AND t.buy_id = b.buy_id)
JOIN sell sl ON (t.seller_id = sl.user_id AND t.sell_id = sl.sell_id)
JOIN users ub ON t.buyer_id = ub.user_id
JOIN users us ON t.seller_id = us.user_id
JOIN shares s ON t.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id;


-- ============================================================================
-- 5. VIEW: vw_company_trading_summary
-- Purpose: Exchange-level trade analytics displaying corporate liquidity,
-- volume, and transaction counts.
-- ============================================================================
CREATE VIEW vw_company_trading_summary AS
SELECT 
    c.company_id,
    c.company_name,
    c.sector,
    COUNT(t.transaction_id) AS total_settled_trades,
    COALESCE(SUM(t.quantity), 0) AS total_shares_traded,
    COALESCE(ROUND(SUM(t.quantity * t.price), 2), 0.00) AS total_gross_turnover,
    MIN(t.price) AS lowest_traded_price,
    MAX(t.price) AS highest_traded_price
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
LEFT JOIN transactions t ON s.share_id = t.share_id
GROUP BY c.company_id, c.company_name, c.sector;


-- ============================================================================
-- 6. VIEW: vw_esop_information
-- Purpose: Employee equity grants, vesting schedules, exercise price,
-- and current implied unrealized gains.
-- ============================================================================
CREATE VIEW vw_esop_information AS
SELECT 
    e.esop_id,
    e.user_id AS employee_id,
    u.name AS employee_name,
    u.email AS employee_email,
    c.company_id,
    c.company_name,
    e.number_of_options,
    e.exercise_price,
    s.current_price AS current_share_price,
    ROUND(e.number_of_options * (s.current_price - e.exercise_price), 2) AS potential_unrealized_gain,
    e.vesting_period,
    e.exercise_status,
    e.grant_date,
    e.expiry_date
FROM esops e
JOIN users u ON e.user_id = u.user_id
JOIN companies c ON e.company_id = c.company_id
LEFT JOIN shares s ON c.company_id = s.company_id;


-- ============================================================================
-- 7. VIEW: vw_debenture_information
-- Purpose: Fixed income instrument monitoring, displaying issuer status,
-- annual interest obligation, and maturity schedule.
-- ============================================================================
CREATE VIEW vw_debenture_information AS
SELECT 
    d.debenture_id,
    c.company_id,
    c.company_name,
    c.sector,
    d.debenture_name,
    d.face_value,
    d.interest_rate AS annual_coupon_pct,
    d.issue_quantity,
    ROUND(d.issue_quantity * d.face_value, 2) AS total_principal_issued,
    ROUND((d.issue_quantity * d.face_value * d.interest_rate) / 100, 2) AS annual_interest_expense,
    d.issue_date,
    d.maturity_date,
    DATEDIFF(d.maturity_date, CURDATE()) AS days_to_maturity,
    d.status AS debenture_status
FROM debentures d
JOIN companies c ON d.company_id = c.company_id;
