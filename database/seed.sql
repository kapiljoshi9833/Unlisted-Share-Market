-- ============================================================================
-- VALENCE-X: Unlisted Securities Exchange
-- SEED DATA SCRIPT
-- ============================================================================
-- Academic Demonstration Dataset
-- Fully complies with all Phase I constraints, foreign keys, and domain checks.
-- Passwords are encrypted using bcrypt (cost 10) for 'Password@123' / 'admin123'.
-- ============================================================================

USE unlisted_securities_exchange;

-- Clean existing data in reverse dependency order
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE transactions;
TRUNCATE TABLE buy;
TRUNCATE TABLE sell;
TRUNCATE TABLE esops;
TRUNCATE TABLE debentures;
TRUNCATE TABLE users;
TRUNCATE TABLE shares;
TRUNCATE TABLE companies;
SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- 1. COMPANIES
-- Note: 'AeroSpace Dynamics' intentionally has NO shares to satisfy Phase II Q4.
-- ----------------------------------------------------------------------------
INSERT INTO companies (company_id, company_name, sector, description, company_status, founded_year, created_at) VALUES
(1, 'NovaTech Innovations', 'Enterprise Cloud & AI', 'High-throughput distributed compute platform and AI inference engine.', 'Active', 2019, '2026-01-01 10:00:00'),
(2, 'GreenGrid Energy', 'Clean Tech & Mobility', 'Smart grid management and renewable energy storage infrastructure.', 'Active', 2020, '2026-01-02 10:00:00'),
(3, 'UrbanNest Developers', 'Real Estate & Infrastructure', 'Commercial tech parks and modern residential infrastructure development.', 'Active', 2016, '2026-01-03 10:00:00'),
(4, 'BioHealth Diagnostics', 'Healthcare & Life Sciences', 'Molecular diagnostic informatics and genomic data warehousing.', 'Active', 2018, '2026-01-04 10:00:00'),
(5, 'AeroSpace Dynamics', 'Aerospace & Defense', 'Next-generation satellite telemetry and payload guidance systems.', 'Active', 2022, '2026-01-05 10:00:00');

-- ----------------------------------------------------------------------------
-- 2. SHARES
-- ----------------------------------------------------------------------------
INSERT INTO shares (share_id, company_id, share_type, total_shares, available_shares, face_value, current_price, created_at) VALUES
(1, 1, 'Equity', 50000, 4200, 10.00, 250.00, '2026-01-06 10:00:00'),
(2, 2, 'Equity', 60000, 3100, 5.00, 95.00, '2026-01-07 10:00:00'),
(3, 3, 'Equity', 40000, 1850, 10.00, 150.00, '2026-01-08 10:00:00'),
(4, 4, 'Equity', 30000, 2500, 10.00, 320.00, '2026-01-09 10:00:00');

-- ----------------------------------------------------------------------------
-- 3. USERS
-- Password hash corresponds to 'Password@123' for investors, 'admin123' for admin.
-- ----------------------------------------------------------------------------
INSERT INTO users (user_id, name, email, password, role, kyc_status, share_id, shares_owned, created_at) VALUES
(1, 'Kapil Sharma', 'kapil@valence.local', '$2b$10$.SCbei2NqemCMcdzULjylOf66mgKyImhVlh45hcvG7/S2ckx2kjhi', 'Investor', 'VERIFIED', 1, 450, '2026-01-10 09:00:00'),
(2, 'Arjun Verma', 'arjun@valence.local', '$2b$10$.SCbei2NqemCMcdzULjylOf66mgKyImhVlh45hcvG7/S2ckx2kjhi', 'Investor', 'VERIFIED', 2, 300, '2026-01-11 11:30:00'),
(3, 'Pooja Mehta', 'pooja@valence.local', '$2b$10$.SCbei2NqemCMcdzULjylOf66mgKyImhVlh45hcvG7/S2ckx2kjhi', 'Investor', 'VERIFIED', 1, 150, '2026-01-12 14:15:00'),
(4, 'Rahul Nair', 'rahul@valence.local', '$2b$10$.SCbei2NqemCMcdzULjylOf66mgKyImhVlh45hcvG7/S2ckx2kjhi', 'Investor', 'VERIFIED', 3, 200, '2026-01-13 16:45:00'),
(5, 'Sneha Patel', 'sneha@valence.local', '$2b$10$.SCbei2NqemCMcdzULjylOf66mgKyImhVlh45hcvG7/S2ckx2kjhi', 'Investor', 'VERIFIED', 4, 100, '2026-01-14 10:20:00'),
(6, 'Market Admin', 'admin@valence.local', '$2b$10$pROU933JZFdvDiDIS4yRie.Obb0qRtw9mg9DJJ9PRH2LL2jLHFmIS', 'Admin', 'VERIFIED', NULL, 0, '2026-01-01 08:00:00');

-- ----------------------------------------------------------------------------
-- 4. BUY ORDERS (Weak Entity with Composite PK: user_id, buy_id)
-- ----------------------------------------------------------------------------
INSERT INTO buy (buy_id, user_id, share_id, quantity, price, remaining_quantity, buy_status, created_at) VALUES
(1, 1, 1, 200, 250.00, 50, 'PARTIAL', '2026-10-01 10:15:00'),
(2, 3, 1, 100, 250.00, 100, 'PENDING', '2026-10-02 11:00:00'),
(3, 2, 3, 150, 145.00, 150, 'PENDING', '2026-10-02 14:30:00'),
(4, 3, 2, 120, 95.00, 70, 'PARTIAL', '2026-10-03 09:45:00'),
(5, 1, 4, 80, 315.00, 80, 'PENDING', '2026-10-03 16:00:00'),
(6, 1, 2, 100, 90.00, 100, 'PENDING', '2026-10-04 11:15:00');

-- ----------------------------------------------------------------------------
-- 5. SELL ORDERS (Weak Entity with Composite PK: user_id, sell_id)
-- Order 4 is COMPLETED so BioHealth (share 4) has no active open sell orders,
-- satisfying Phase II Q16 with realistic positive output.
-- ----------------------------------------------------------------------------
INSERT INTO sell (sell_id, user_id, share_id, quantity, price, remaining_quantity, sell_status, created_at) VALUES
(1, 2, 1, 300, 245.00, 150, 'PARTIAL', '2026-09-30 09:30:00'),
(2, 4, 2, 200, 94.00, 150, 'PARTIAL', '2026-10-01 10:00:00'),
(3, 3, 3, 100, 155.00, 100, 'PENDING', '2026-10-02 12:00:00'),
(4, 5, 4, 75, 325.00, 0, 'COMPLETED', '2026-10-03 13:20:00'),
(5, 4, 1, 80, 230.00, 80, 'PENDING', '2026-10-04 15:40:00');

-- ----------------------------------------------------------------------------
-- 6. TRANSACTIONS
-- Weak entity composite references: (buyer_id, buy_id) and (seller_id, sell_id).
-- ----------------------------------------------------------------------------
INSERT INTO transactions (transaction_id, buyer_id, buy_id, seller_id, sell_id, share_id, quantity, price, transaction_time) VALUES
(1, 1, 1, 2, 1, 1, 150, 245.00, '2026-10-01 10:30:00'),
(2, 3, 4, 4, 2, 2, 50, 94.00, '2026-10-03 10:15:00');

-- ----------------------------------------------------------------------------
-- 7. ESOPS
-- ----------------------------------------------------------------------------
INSERT INTO esops (esop_id, user_id, company_id, number_of_options, exercise_price, vesting_period, exercise_status, grant_date, expiry_date) VALUES
(1, 1, 1, 500, 120.00, '36 Months (Graded)', 'Partially Vested', '2024-03-01', '2029-03-01'),
(2, 3, 2, 250, 65.00, '24 Months (Cliff)', 'Unvested', '2025-06-15', '2030-06-15'),
(3, 4, 3, 300, 110.00, '48 Months (Graded)', 'Vested', '2023-01-10', '2028-01-10');

-- ----------------------------------------------------------------------------
-- 8. DEBENTURES
-- ----------------------------------------------------------------------------
INSERT INTO debentures (debenture_id, company_id, debenture_name, face_value, interest_rate, issue_quantity, issue_date, maturity_date, status) VALUES
(1, 1, 'NovaTech 8.50% Senior Series A', 1000.00, 8.50, 500, '2024-01-15', '2030-01-15', 'Active'),
(2, 2, 'GreenGrid 7.50% Renewable Green Bond', 1000.00, 7.50, 700, '2024-06-01', '2031-06-01', 'Active'),
(3, 3, 'UrbanNest 9.00% Property Infra Debenture', 1000.00, 9.00, 400, '2023-11-01', '2032-11-01', 'Active');
