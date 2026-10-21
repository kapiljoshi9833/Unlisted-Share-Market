-- ============================================================================
-- VALENCE-X: Unlisted Securities Exchange
-- PHASE II: DATA MANIPULATION LANGUAGE (DML) DEMONSTRATION
-- ============================================================================
-- Academic Focus: Controlled INSERT, UPDATE, and DELETE operations,
-- demonstrating complete order life cycle, partial fills, cancellations,
-- and constraint validation in MySQL.
-- Database: unlisted_securities_exchange
-- ============================================================================

USE unlisted_securities_exchange;

-- ============================================================================
-- 1. INSERT DEMONSTRATIONS (ORDER CREATION & INSTRUMENT ISSUANCE)
-- ============================================================================

-- A. Submit a new BUY order for User 2 (Arjun Verma) targeting NovaTech Innovations
-- Automatically initializes remaining_quantity to match original order quantity.
INSERT INTO buy (user_id, share_id, quantity, price, remaining_quantity, buy_status, created_at)
VALUES (2, 1, 100, 248.00, 100, 'PENDING', NOW());

-- B. Submit a new SELL order for User 3 (Pooja Mehta) selling NovaTech Innovations
INSERT INTO sell (user_id, share_id, quantity, price, remaining_quantity, sell_status, created_at)
VALUES (3, 1, 50, 248.00, 50, 'PENDING', NOW());

-- C. Issue a new series of Debentures for BioHealth Diagnostics
INSERT INTO debentures (company_id, debenture_name, face_value, interest_rate, issue_quantity, issue_date, maturity_date, status)
VALUES (4, 'BioHealth 8.75% Secured Series B', 1000.00, 8.75, 300, '2026-02-01', '2031-02-01', 'Active');


-- ============================================================================
-- 2. UPDATE DEMONSTRATIONS (PARTIAL FILLS & STATUS ADVANCEMENT)
-- ============================================================================

-- A. Simulate partial execution of Buy Order 1:
-- Reduce remaining quantity by 25 shares and maintain 'PARTIAL' status.
UPDATE buy 
SET remaining_quantity = remaining_quantity - 25,
    buy_status = CASE WHEN (remaining_quantity - 25) = 0 THEN 'COMPLETED' ELSE 'PARTIAL' END
WHERE user_id = 1 AND buy_id = 1 AND remaining_quantity >= 25;

-- B. Update current market price of a security following transaction price discovery
UPDATE shares 
SET current_price = 248.00
WHERE share_id = 1;

-- C. Update user KYC verification status after compliance approval
UPDATE users 
SET kyc_status = 'VERIFIED'
WHERE user_id = 5;

-- D. Update ESOP exercise status upon employee milestone achievement
UPDATE esops 
SET exercise_status = 'Vested'
WHERE esop_id = 2;


-- ============================================================================
-- 3. DELETE DEMONSTRATIONS (SAFE CANCELLATIONS & EXPIRED INSTRUMENTS)
-- ============================================================================

-- A. Soft or hard cancellation of an unfilled PENDING order:
-- Note: A transaction-linked order with settled fills should not be hard-deleted,
-- but a pure PENDING order with remaining_quantity = quantity can be safely cancelled.
DELETE FROM buy 
WHERE user_id = 2 
  AND buy_id = (SELECT MAX(buy_id) FROM (SELECT buy_id FROM buy WHERE user_id = 2) AS b2)
  AND buy_status = 'PENDING'
  AND remaining_quantity = quantity;

-- B. Clean up unexercised and cancelled ESOP grants
DELETE FROM esops 
WHERE exercise_status = 'Cancelled' 
  AND expiry_date < CURDATE();
