
USE unlisted_securities_exchange;

-- PART A: JOINS

-- Q1. Full transaction ledger
SELECT t.transaction_id, c.company_name, s.share_type,
       ub.name AS buyer, us.name AS seller,
       t.quantity, t.price, t.quantity * t.price AS total_value,
       t.transaction_time
FROM transactions t
JOIN buy b ON t.buy_id = b.buy_id
JOIN sell sl ON t.sell_id = sl.sell_id
JOIN users ub ON b.user_id = ub.user_id
JOIN users us ON sl.user_id = us.user_id
JOIN shares s ON t.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
ORDER BY t.transaction_id;

-- Q2. Open buy orders
SELECT b.buy_id, u.name, c.company_name,
       b.quantity, b.remaining_quantity, b.price, b.buy_status
FROM buy b
JOIN users u ON b.user_id = u.user_id
JOIN shares s ON b.share_id = s.share_id
JOIN companies c ON s.company_id = c.company_id
WHERE b.buy_status IN ('PENDING', 'PARTIAL')
ORDER BY b.buy_id;

-- Q3. ESOP details
SELECT e.esop_id, u.name, c.company_name,
       e.number_of_options, e.exercise_price,
       e.vesting_period, e.exercise_status
FROM esops e
JOIN users u ON e.user_id = u.user_id
JOIN companies c ON e.company_id = c.company_id
ORDER BY e.esop_id;

-- Q4. Companies without securities
SELECT c.company_id, c.company_name
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
WHERE s.share_id IS NULL;

-- Q5. Potential buy-sell matches
SELECT b.buy_id, sl.sell_id, b.share_id,
       b.price AS buy_price, sl.price AS sell_price,
       LEAST(b.remaining_quantity, sl.remaining_quantity) AS match_quantity
FROM buy b
JOIN sell sl ON b.share_id = sl.share_id
WHERE b.price >= sl.price
  AND b.user_id <> sl.user_id
  AND b.buy_status IN ('PENDING', 'PARTIAL')
  AND sl.sell_status IN ('PENDING', 'PARTIAL')
  AND b.remaining_quantity > 0
  AND sl.remaining_quantity > 0
ORDER BY b.buy_id, sl.sell_id;


-- PART B: AGGREGATE FUNCTIONS

-- Q6. Trade statistics by company
SELECT c.company_name,
       COUNT(t.transaction_id) AS total_trades,
       COALESCE(SUM(t.quantity), 0) AS total_shares,
       COALESCE(SUM(t.quantity * t.price), 0) AS trade_value
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
LEFT JOIN transactions t ON s.share_id = t.share_id
GROUP BY c.company_id, c.company_name
ORDER BY c.company_id;

-- Q7. Execution price statistics
SELECT share_id, COUNT(*) AS total_trades,
       MIN(price) AS minimum_price,
       MAX(price) AS maximum_price,
       AVG(price) AS average_price,
       SUM(quantity * price) / NULLIF(SUM(quantity), 0) AS vwap
FROM transactions
GROUP BY share_id
ORDER BY share_id;

-- Q8. Users with three or more orders
SELECT u.user_id, u.name, COUNT(*) AS total_orders
FROM users u
JOIN (
    SELECT user_id FROM buy
    UNION ALL
    SELECT user_id FROM sell
) orders ON u.user_id = orders.user_id
GROUP BY u.user_id, u.name
HAVING COUNT(*) >= 3
ORDER BY total_orders DESC;

-- Q9. Active debenture value by company
SELECT c.company_name,
       SUM(d.issue_quantity * d.face_value) AS total_value,
       AVG(d.interest_rate) AS average_interest_rate
FROM companies c
JOIN debentures d ON c.company_id = d.company_id
WHERE d.status = 'Active'
GROUP BY c.company_id, c.company_name
ORDER BY total_value DESC;

-- Q10. Security summary by sector
SELECT c.sector,
       COUNT(DISTINCT c.company_id) AS total_companies,
       COUNT(DISTINCT s.share_id) AS total_securities,
       COALESCE(SUM(s.available_shares), 0) AS available_shares
FROM companies c
LEFT JOIN shares s ON c.company_id = s.company_id
GROUP BY c.sector
ORDER BY c.sector;


-- PART C: SUBQUERIES

-- Q11. Securities priced above average
SELECT share_id, share_type, current_price
FROM shares
WHERE current_price > (
    SELECT AVG(current_price) FROM shares
)
ORDER BY share_id;

-- Q12. Users who bought but never sold
SELECT u.user_id, u.name
FROM users u
WHERE u.user_id IN (SELECT user_id FROM buy)
  AND u.user_id NOT IN (SELECT user_id FROM sell)
ORDER BY u.user_id;

-- Q13. Highest-value transaction
SELECT transaction_id, quantity, price,
       quantity * price AS total_value
FROM transactions
WHERE quantity * price = (
    SELECT MAX(quantity * price)
    FROM transactions
);

-- Q14. Companies with both debentures and ESOPs
SELECT c.company_id, c.company_name
FROM companies c
WHERE EXISTS (
    SELECT 1 FROM debentures d
    WHERE d.company_id = c.company_id
)
AND EXISTS (
    SELECT 1 FROM esops e
    WHERE e.company_id = c.company_id
)
ORDER BY c.company_id;

-- Q15. Sell orders below their security's average ask
SELECT sl.sell_id, sl.share_id, sl.price, sl.sell_status
FROM sell sl
WHERE sl.price < (
    SELECT AVG(s2.price)
    FROM sell s2
    WHERE s2.share_id = sl.share_id
)
ORDER BY sl.sell_id;

-- Q16. Securities with no open sell orders
SELECT s.share_id, c.company_name, s.share_type
FROM shares s
JOIN companies c ON s.company_id = c.company_id
WHERE NOT EXISTS (
    SELECT 1
    FROM sell sl
    WHERE sl.share_id = s.share_id
      AND sl.sell_status IN ('PENDING', 'PARTIAL')
)
ORDER BY s.share_id;
