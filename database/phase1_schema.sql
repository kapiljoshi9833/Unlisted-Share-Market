-- ============================================================================
-- VALENCE-X: Unlisted Securities Exchange
-- PHASE I: DATABASE SCHEMA & RELATIONAL MODEL
-- ============================================================================
-- Academic Focus: Unlisted Company Securities, Weak Entity Modeling,
-- Referential Integrity, Domain Constraints, and Normalized Design.
-- Target RDBMS: MySQL 8.0+
-- Database Name: unlisted_securities_exchange
-- ============================================================================

CREATE DATABASE IF NOT EXISTS unlisted_securities_exchange
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE unlisted_securities_exchange;

-- ----------------------------------------------------------------------------
-- Drop existing tables in reverse dependency order for clean recreation
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS buy;
DROP TABLE IF EXISTS sell;
DROP TABLE IF EXISTS esops;
DROP TABLE IF EXISTS debentures;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS shares;
DROP TABLE IF EXISTS companies;

-- ============================================================================
-- 1. COMPANIES TABLE
-- Strong entity representing private/unlisted enterprises on the exchange.
-- ============================================================================
CREATE TABLE companies (
    company_id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    description TEXT NULL,
    company_status VARCHAR(30) NOT NULL DEFAULT 'Active',
    founded_year INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_company_name UNIQUE (company_name),
    CONSTRAINT chk_company_status CHECK (company_status IN ('Active', 'Pending', 'Suspended', 'Inactive')),
    CONSTRAINT chk_founded_year CHECK (founded_year >= 1800 AND founded_year <= 2100)
) ENGINE=InnoDB;

-- ============================================================================
-- 2. SHARES TABLE
-- Strong entity representing security classes issued by companies.
-- ============================================================================
CREATE TABLE shares (
    share_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    share_type VARCHAR(50) NOT NULL DEFAULT 'Equity',
    total_shares INT NOT NULL,
    available_shares INT NOT NULL,
    face_value DECIMAL(12, 2) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_shares_company 
        FOREIGN KEY (company_id) REFERENCES companies(company_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uq_company_share_type UNIQUE (company_id, share_type),
    CONSTRAINT chk_share_type CHECK (share_type IN ('Equity', 'Preference', 'Class A', 'Class B')),
    CONSTRAINT chk_total_shares CHECK (total_shares > 0),
    CONSTRAINT chk_available_shares CHECK (available_shares >= 0 AND available_shares <= total_shares),
    CONSTRAINT chk_face_value CHECK (face_value > 0),
    CONSTRAINT chk_current_price CHECK (current_price > 0)
) ENGINE=InnoDB;

-- ============================================================================
-- 3. USERS TABLE
-- Strong entity representing exchange participants (investors, admins).
-- Tracks identity, role, KYC status, and direct share holdings.
-- ============================================================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'Investor',
    kyc_status VARCHAR(30) NOT NULL DEFAULT 'VERIFIED',
    share_id INT NULL,
    shares_owned INT NOT NULL DEFAULT 0,
    wallet_balance DECIMAL(15, 2) NOT NULL DEFAULT 100000.00,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_email UNIQUE (email),
    CONSTRAINT fk_users_share 
        FOREIGN KEY (share_id) REFERENCES shares(share_id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT chk_user_role CHECK (role IN ('Investor', 'Admin', 'Institutional', 'Broker')),
    CONSTRAINT chk_kyc_status CHECK (kyc_status IN ('VERIFIED', 'PENDING', 'REJECTED')),
    CONSTRAINT chk_shares_owned CHECK (shares_owned >= 0),
    CONSTRAINT chk_wallet_balance CHECK (wallet_balance >= 0)
) ENGINE=InnoDB;

-- ============================================================================
-- 4. BUY TABLE (Weak Entity)
-- Represents purchase bids placed by a user.
-- ER Justification: A buy order cannot exist independently of the owning User.
-- Primary Key: Composite (user_id, buy_id) enforcing identifying relationship.
-- Note: buy_id is indexed to support AUTO_INCREMENT and efficient order lookups.
-- ============================================================================
CREATE TABLE buy (
    buy_id INT AUTO_INCREMENT,
    user_id INT NOT NULL,
    share_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    remaining_quantity INT NOT NULL,
    buy_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, buy_id),
    KEY idx_buy_id (buy_id),
    KEY idx_buy_matching (share_id, buy_status, price),

    CONSTRAINT fk_buy_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_buy_share 
        FOREIGN KEY (share_id) REFERENCES shares(share_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_buy_quantity CHECK (quantity > 0),
    CONSTRAINT chk_buy_price CHECK (price > 0),
    CONSTRAINT chk_buy_remaining CHECK (remaining_quantity >= 0 AND remaining_quantity <= quantity),
    CONSTRAINT chk_buy_status CHECK (buy_status IN ('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED'))
) ENGINE=InnoDB;

-- ============================================================================
-- 5. SELL TABLE (Weak Entity)
-- Represents sell asks placed by a user.
-- ER Justification: A sell order cannot exist independently of the owning User.
-- Primary Key: Composite (user_id, sell_id) enforcing identifying relationship.
-- Note: sell_id is indexed to support AUTO_INCREMENT and efficient order lookups.
-- ============================================================================
CREATE TABLE sell (
    sell_id INT AUTO_INCREMENT,
    user_id INT NOT NULL,
    share_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    remaining_quantity INT NOT NULL,
    sell_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, sell_id),
    KEY idx_sell_id (sell_id),
    KEY idx_sell_matching (share_id, sell_status, price),

    CONSTRAINT fk_sell_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_sell_share 
        FOREIGN KEY (share_id) REFERENCES shares(share_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_sell_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sell_price CHECK (price > 0),
    CONSTRAINT chk_sell_remaining CHECK (remaining_quantity >= 0 AND remaining_quantity <= quantity),
    CONSTRAINT chk_sell_status CHECK (sell_status IN ('PENDING', 'PARTIAL', 'COMPLETED', 'CANCELLED'))
) ENGINE=InnoDB;

-- ============================================================================
-- 6. TRANSACTIONS TABLE
-- Represents settled executions between a Buyer's Buy Order and a Seller's Sell Order.
-- Foreign keys link back to both weak entity composite keys:
-- (buyer_id, buy_id) -> buy(user_id, buy_id)
-- (seller_id, sell_id) -> sell(user_id, sell_id)
-- Referential Action: RESTRICT on delete and update (financial ledger immutability).
-- Domain Constraint: A user cannot trade with themselves (buyer_id <> seller_id).
-- ============================================================================
CREATE TABLE transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    buyer_id INT NOT NULL,
    buy_id INT NOT NULL,
    seller_id INT NOT NULL,
    sell_id INT NOT NULL,
    share_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    transaction_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    KEY idx_txn_buy (buy_id),
    KEY idx_txn_sell (sell_id),
    KEY idx_txn_share (share_id),

    CONSTRAINT fk_txn_buy_order 
        FOREIGN KEY (buyer_id, buy_id) REFERENCES buy(user_id, buy_id) 
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_txn_sell_order 
        FOREIGN KEY (seller_id, sell_id) REFERENCES sell(user_id, sell_id) 
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_txn_share 
        FOREIGN KEY (share_id) REFERENCES shares(share_id) 
        ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT chk_txn_quantity CHECK (quantity > 0),
    CONSTRAINT chk_txn_price CHECK (price > 0),
    CONSTRAINT chk_txn_distinct_parties CHECK (buyer_id <> seller_id)
) ENGINE=InnoDB;

-- ============================================================================
-- 7. ESOPS TABLE
-- Employee Stock Ownership Plan grants issued by companies to eligible users.
-- ============================================================================
CREATE TABLE esops (
    esop_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    number_of_options INT NOT NULL,
    exercise_price DECIMAL(12, 2) NOT NULL,
    vesting_period VARCHAR(100) NOT NULL DEFAULT '36 Months (Graded)',
    exercise_status VARCHAR(30) NOT NULL DEFAULT 'Unvested',
    grant_date DATE NOT NULL,
    expiry_date DATE NOT NULL,

    CONSTRAINT fk_esops_user 
        FOREIGN KEY (user_id) REFERENCES users(user_id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_esops_company 
        FOREIGN KEY (company_id) REFERENCES companies(company_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_esop_options CHECK (number_of_options > 0),
    CONSTRAINT chk_esop_exercise_price CHECK (exercise_price > 0),
    CONSTRAINT chk_esop_status CHECK (exercise_status IN ('Unvested', 'Partially Vested', 'Vested', 'Exercised', 'Expired', 'Cancelled')),
    CONSTRAINT chk_esop_dates CHECK (expiry_date > grant_date)
) ENGINE=InnoDB;

-- ============================================================================
-- 8. DEBENTURES TABLE
-- Long-term debt instruments issued by unlisted companies.
-- ============================================================================
CREATE TABLE debentures (
    debenture_id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    debenture_name VARCHAR(150) NOT NULL,
    face_value DECIMAL(12, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,
    issue_quantity INT NOT NULL,
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    CONSTRAINT fk_debentures_company 
        FOREIGN KEY (company_id) REFERENCES companies(company_id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT chk_debenture_face_value CHECK (face_value > 0),
    CONSTRAINT chk_debenture_interest_rate CHECK (interest_rate >= 0.00 AND interest_rate <= 100.00),
    CONSTRAINT chk_debenture_issue_quantity CHECK (issue_quantity > 0),
    CONSTRAINT chk_debenture_dates CHECK (maturity_date > issue_date),
    CONSTRAINT chk_debenture_status CHECK (status IN ('Active', 'Redeemed', 'Defaulted', 'Matured'))
) ENGINE=InnoDB;
