-- ============================================================================
-- VALENCE-X: Unlisted Securities Exchange
-- PHASE II: ADVANCED SQL QUERIES (16 CORE ASSIGNMENT QUERIES)
-- ============================================================================
-- Academic Focus: Multi-table Joins, Aggregation & Grouping, Nested Subqueries,
-- Correlated Subqueries, Referential Integrity, and Volume-Weighted Average Price.
-- Compatible with: MySQL 8.0+ / MySQL Workbench
-- Database: unlisted_securities_exchange
-- ============================================================================

USE unlisted_securities_exchange;

-- ============================================================================
-- PART A: MULTI-TABLE JOINS (Q1 - Q5)
-- ============================================================================

-- Q1. Full Transaction Ledger
-- Objective: Trace settled trades across orders, buyers, sellers, securities, and companies.
-- Demonstrates: 6-table INNER JOIN connecting weak entity identifying relationships.
SELECT 
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
ORDER BY t.transaction_id ASC;


-- Q2. Open Buy Orders with Security and Company Details
-- Objective: Retrieve pending or partially filled bids awaiting counterparties.
-- Demonstrates: Filtering on order status and calculating remaining commitments.
SELECT 
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
ORDER BY b.price DESC, b.created_at ASC;


-- Q3. ESOP Grants and Employee Option Profiles
-- Objective: Display employee stock option plans with vesting terms and current status.
-- Demonstrates: Connecting user grants with corporate issuers and financial terms.
SELECT 
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
ORDER BY e.esop_id ASC;


-- Q4. Companies Without Listed Securities
-- Objective: Identify newly incorporated or registered companies that have not yet issued shares.
-- Demonstrates: LEFT OUTER JOIN and IS NULL check for anti-join pattern.
SELECT 
    c.company_id,
    c.company_name,
    c.sector,
    c.company_status,
    c.founded_year
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
WHERE s.share_id IS NULL
ORDER BY c.company_id ASC;


-- Q5. Potential Buy-Sell Order Matches
-- Objective: Discover matching opportunities where Buyer Bid >= Seller Ask for the same security,
-- ensuring distinct parties and positive remaining quantities.
-- Demonstrates: Cross-table matching conditions without self-trading.
SELECT 
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
ORDER BY potential_match_quantity DESC, b.price DESC;


-- ============================================================================
-- PART B: AGGREGATE FUNCTIONS & GROUPING (Q6 - Q10)
-- ============================================================================

-- Q6. Trade Statistics by Company
-- Objective: Summarize total trading volume, turnover value, and trade counts per company.
-- Demonstrates: Multi-table LEFT JOIN with GROUP BY and COALESCE handling.
SELECT 
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
ORDER BY total_turnover_value DESC, total_trades DESC;


-- Q7. Execution Price Statistics and Volume-Weighted Average Price (VWAP)
-- Objective: Compute minimum, maximum, arithmetic average, and volume-weighted average price.
-- Demonstrates: Mathematical financial modeling in SQL using SUM(qty * price) / SUM(qty).
SELECT 
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
ORDER BY s.share_id ASC;


-- Q8. Active Investors with Three or More Total Orders
-- Objective: Detect frequent exchange traders based on total order submissions (buy + sell).
-- Demonstrates: Derived table with UNION ALL, GROUP BY, and HAVING clause.
SELECT 
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
ORDER BY total_order_count DESC;


-- Q9. Active Debenture Capital Value and Average Coupon Rate by Company
-- Objective: Measure outstanding corporate debt commitments and weighted interest burden.
-- Demonstrates: Aggregation over active financial instruments with filtering.
SELECT 
    c.company_id,
    c.company_name,
    COUNT(d.debenture_id) AS total_debenture_series,
    COALESCE(SUM(d.issue_quantity * d.face_value), 0) AS total_debt_capital,
    ROUND(COALESCE(AVG(d.interest_rate), 0.00), 2) AS average_coupon_rate_pct
FROM companies c
JOIN debentures d ON c.company_id = d.company_id
WHERE d.status = 'Active'
GROUP BY c.company_id, c.company_name
ORDER BY total_debt_capital DESC;


-- Q10. Security Distribution and Share Inventory Summary by Sector
-- Objective: Macro-level analysis of sector depth, company count, and available liquidity.
-- Demonstrates: Multi-entity DISTINCT counting and inventory aggregation.
SELECT 
    c.sector,
    COUNT(DISTINCT c.company_id) AS total_companies,
    COUNT(DISTINCT s.share_id) AS total_security_classes,
    COALESCE(SUM(s.available_shares), 0) AS total_available_shares,
    ROUND(COALESCE(SUM(s.available_shares * s.current_price), 0), 2) AS estimated_sector_market_value
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
GROUP BY c.sector
ORDER BY estimated_sector_market_value DESC;


-- ============================================================================
-- PART C: ADVANCED SUBQUERIES & SET MEMBERSHIP (Q11 - Q16)
-- ============================================================================

-- Q11. Securities Priced Above Exchange-Wide Average Current Price
-- Objective: Identify premium securities currently trading above market mean.
-- Demonstrates: Scalar subquery in WHERE clause comparison.
SELECT 
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
ORDER BY s.current_price DESC;


-- Q12. Users Who Have Placed Buy Orders but Have Never Sold
-- Objective: Identify net capital allocators (pure buyers) on the exchange.
-- Demonstrates: Set difference using uncorrelated IN and NOT IN subqueries.
SELECT 
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
ORDER BY u.user_id ASC;


-- Q13. Highest-Value Settled Transaction
-- Objective: Retrieve the single largest recorded execution by total monetary value.
-- Demonstrates: Correlated or scalar aggregate subquery matching MAX value.
SELECT 
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
);


-- Q14. Companies with Both Debentures and ESOP Plans
-- Objective: Find structured companies employing both debt financing and equity incentives.
-- Demonstrates: Dual correlated EXISTS predicates ensuring intersection semantics.
SELECT 
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
ORDER BY c.company_id ASC;


-- Q15. Sell Orders Below Their Security's Average Asking Price
-- Objective: Detect competitive sell listings offering discounts below peer asks.
-- Demonstrates: Correlated subquery computing group average dynamically.
SELECT 
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
ORDER BY sl.share_id, sl.price ASC;


-- Q16. Securities with No Open Sell Orders
-- Objective: Find illiquid securities where buyers have no active sellers to purchase from.
-- Demonstrates: Correlated NOT EXISTS subquery checking order book liquidity.
SELECT 
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
ORDER BY s.share_id ASC;
