
USE unlisted_securities_exchange;

-- PHASE III: ADVANCED DATABASE PROGRAM
-- VALENCE-X: Unlisted Securities Exchange


USE unlisted_securities_exchange;

-- PHASE III: SIGN UP AND SIGN IN SUPPORT

-- 1. Ensure every user has a unique email
ALTER TABLE users
ADD CONSTRAINT unique_user_email UNIQUE (email);

-- 2. View registered users (without passwords)
SELECT user_id, name, email, role, kyc_status, created_at
FROM users;

-- 3. Find a user during sign in
SELECT user_id, name, email, password, role
FROM users
WHERE email = 'user@example.com';

-- 4. Check whether an email is already registered
SELECT user_id
FROM users
WHERE email = 'user@example.com';



-- 1. Validate BUY orders
ALTER TABLE `buy`
ADD CONSTRAINT chk_buy_quantity
CHECK (quantity > 0);

ALTER TABLE `buy`
ADD CONSTRAINT chk_buy_price
CHECK (price > 0);

ALTER TABLE `buy`
ADD CONSTRAINT chk_buy_remaining
CHECK (
    remaining_quantity IS NULL
    OR (remaining_quantity >= 0
        AND remaining_quantity <= quantity)
);

-- 2. Validate SELL orders
ALTER TABLE `sell`
ADD CONSTRAINT chk_sell_quantity
CHECK (quantity > 0);

ALTER TABLE `sell`
ADD CONSTRAINT chk_sell_price
CHECK (price > 0);

ALTER TABLE `sell`
ADD CONSTRAINT chk_sell_remaining
CHECK (
    remaining_quantity IS NULL
    OR (remaining_quantity >= 0
        AND remaining_quantity <= quantity)
);

-- 3. Get user order history
SELECT 'BUY' AS order_type,
       buy_id AS order_id,
       share_id, quantity, price,
       remaining_quantity,
       buy_status AS order_status,
       created_at
FROM `buy`
WHERE user_id = 1

UNION ALL

SELECT 'SELL' AS order_type,
       sell_id AS order_id,
       share_id, quantity, price,
       remaining_quantity,
       sell_status AS order_status,
       created_at
FROM `sell`
WHERE user_id = 1
ORDER BY created_at DESC;
