-- ============================================================================
-- VALENCE-X: Unlisted Securities Exchange
-- PHASE III: ACTIVE DATABASE PROGRAMMING — TRIGGERS
-- ============================================================================
-- Academic Focus: Automated Business Rules, KYC Compliance Enforcement,
-- Share Balance Validation, Order State Transitions, and Price Discovery.
-- Target RDBMS: MySQL 8.0+ / MySQL Workbench
-- Database: unlisted_securities_exchange
-- ============================================================================

USE unlisted_securities_exchange;

-- ----------------------------------------------------------------------------
-- Drop existing triggers if present
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_validate_buy_before_insert;
DROP TRIGGER IF EXISTS trg_validate_sell_before_insert;
DROP TRIGGER IF EXISTS trg_buy_order_status_update;
DROP TRIGGER IF EXISTS trg_sell_order_status_update;
DROP TRIGGER IF EXISTS trg_after_transaction_settlement;

DELIMITER $$

-- ============================================================================
-- 1. TRIGGER: trg_validate_buy_before_insert
-- Purpose: Enforce compliance and default order state before placing a BUY order.
-- Rules:
--  a) Investor's KYC status must be 'VERIFIED'.
--  b) Automatically sets remaining_quantity = quantity if omitted or null.
--  c) Company must have 'Active' status.
-- ============================================================================
CREATE TRIGGER trg_validate_buy_before_insert
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
END$$


-- ============================================================================
-- 2. TRIGGER: trg_validate_sell_before_insert
-- Purpose: Validate seller shareholding balance and KYC prior to order submission.
-- Rules:
--  a) Seller's KYC status must be 'VERIFIED'.
--  b) Seller cannot put up more shares for sale than they actually hold in portfolio.
--  c) Automatically sets remaining_quantity = quantity if omitted or null.
-- ============================================================================
CREATE TRIGGER trg_validate_sell_before_insert
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

    -- Check if active pending sell orders already commit these shares
    SELECT COALESCE(SUM(remaining_quantity), 0) INTO v_pending_sells
    FROM sell
    WHERE user_id = NEW.user_id 
      AND share_id = NEW.share_id 
      AND sell_status IN ('PENDING', 'PARTIAL');

    IF (v_shares_owned - v_pending_sells) < NEW.quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order Rejected: Insufficient available shares to cover this sell order.';
    END IF;

    -- Default remaining_quantity if null
    IF NEW.remaining_quantity IS NULL THEN
        SET NEW.remaining_quantity = NEW.quantity;
    END IF;
END$$


-- ============================================================================
-- 3. TRIGGER: trg_buy_order_status_update
-- Purpose: Protect state integrity during execution of BUY orders.
-- Rules:
--  a) remaining_quantity cannot increase on an existing order.
--  b) If remaining_quantity reaches 0, order status must automatically become 'COMPLETED'.
-- ============================================================================
CREATE TRIGGER trg_buy_order_status_update
BEFORE UPDATE ON buy
FOR EACH ROW
BEGIN
    IF NEW.remaining_quantity > OLD.remaining_quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order Integrity Error: Remaining quantity cannot increase on an active order.';
    END IF;

    IF NEW.remaining_quantity = 0 THEN
        SET NEW.buy_status = 'COMPLETED';
    ELSEIF NEW.remaining_quantity < NEW.quantity AND NEW.buy_status = 'PENDING' THEN
        SET NEW.buy_status = 'PARTIAL';
    END IF;
END$$


-- ============================================================================
-- 4. TRIGGER: trg_sell_order_status_update
-- Purpose: Protect state integrity during execution of SELL orders.
-- Rules:
--  a) remaining_quantity cannot increase on an existing order.
--  b) If remaining_quantity reaches 0, order status must automatically become 'COMPLETED'.
-- ============================================================================
CREATE TRIGGER trg_sell_order_status_update
BEFORE UPDATE ON sell
FOR EACH ROW
BEGIN
    IF NEW.remaining_quantity > OLD.remaining_quantity THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Order Integrity Error: Remaining quantity cannot increase on an active order.';
    END IF;

    IF NEW.remaining_quantity = 0 THEN
        SET NEW.sell_status = 'COMPLETED';
    ELSEIF NEW.remaining_quantity < NEW.quantity AND NEW.sell_status = 'PENDING' THEN
        SET NEW.sell_status = 'PARTIAL';
    END IF;
END$$


-- ============================================================================
-- 5. TRIGGER: trg_after_transaction_settlement
-- Purpose: Automatic market price discovery following trade execution.
-- When a transaction settles, update the current market price of the share
-- to match the last traded price (LTP).
-- ============================================================================
CREATE TRIGGER trg_after_transaction_settlement
AFTER INSERT ON transactions
FOR EACH ROW
BEGIN
    UPDATE shares 
    SET current_price = NEW.price
    WHERE share_id = NEW.share_id;
END$$

DELIMITER ;
