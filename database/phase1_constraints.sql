-- ============================================================================
-- VALENCE-X: Unlisted Securities Exchange
-- PHASE I: CONSTRAINTS SPECIFICATION & RELATIONAL MAPPING DOCUMENTATION
-- ============================================================================
-- Academic Focus: Formal ER-to-Relational Mapping, Weak Entity Proof,
-- Constraint Invariants, and Normalization Analysis.
-- ============================================================================

USE unlisted_securities_exchange;

/*
===============================================================================
SECTION 1: ER-TO-RELATIONAL MAPPING & WEAK ENTITY JUSTIFICATION
===============================================================================

1. THE WEAK ENTITY PROBLEM:
   In our initial schema, `buy` and `sell` were modeled with synthetic single-column
   primary keys (buy_id and sell_id), and a foreign key referencing `users(user_id)`.
   Conceptually and academically:
   - An order (BUY or SELL) has no existential meaning without the User who placed it.
   - If a User is removed from the exchange, all their pending orders cease to exist.
   - Therefore, in the ER model:
     * USERS is the STRONG (IDENTIFYING) ENTITY SET.
     * BUY and SELL are WEAK ENTITY SETS.
     * The relationship PLACES (Users -> Buy) and POSTS (Users -> Sell) are 
       IDENTIFYING RELATIONSHIPS (double diamonds / double rectangles in Chen notation).

2. RELATIONAL MAPPING OF WEAK ENTITY SETS:
   According to standard DBMS relational mapping algorithm (Step 2 of ER-to-Relational):
   - The relation schema for a weak entity W with owner E includes all attributes of W
     plus the primary key attributes of E.
   - The primary key of the weak entity relation is the combination of:
     [Primary Key of the Owner Entity] + [Partial Key / Discriminator of the Weak Entity]
   - Relational Representation:
     BUY  ( user_id [FK], buy_id [Discriminator], share_id [FK], quantity, price, remaining_quantity, buy_status, created_at )
          PRIMARY KEY: (user_id, buy_id)
     SELL ( user_id [FK], sell_id [Discriminator], share_id [FK], quantity, price, remaining_quantity, sell_status, created_at )
          PRIMARY KEY: (user_id, sell_id)

3. DEPENDENT IDENTIFYING FOREIGN KEYS IN TRANSACTIONS:
   Since the primary keys of Buy and Sell are composite (user_id, buy_id) and (user_id, sell_id),
   the Transactions table must reference these composite keys:
     TRANSACTIONS ( transaction_id [PK],
                   buyer_id, buy_id [FK to BUY(user_id, buy_id)],
                   seller_id, sell_id [FK to SELL(user_id, sell_id)],
                   share_id [FK to SHARES(share_id)],
                   quantity, price, transaction_time )
   This guarantees:
   - No transaction can be forged with an invalid buyer or seller.
   - Self-trading is prevented by domain check: CHECK (buyer_id <> seller_id).
===============================================================================
*/

-- ============================================================================
-- SECTION 2: VERIFICATION QUERIES FOR CONSTRAINTS & KEYS IN INFORMATION_SCHEMA
-- ============================================================================

-- Check all Table Constraints (Primary Keys, Foreign Keys, Unique Keys, Check Constraints)
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE
FROM 
    information_schema.TABLE_CONSTRAINTS
WHERE 
    TABLE_SCHEMA = 'unlisted_securities_exchange'
ORDER BY 
    TABLE_NAME, CONSTRAINT_TYPE DESC, CONSTRAINT_NAME;

-- Check all Foreign Key Definitions with Referential Action
SELECT 
    kcu.TABLE_NAME AS referencing_table,
    kcu.COLUMN_NAME AS referencing_column,
    kcu.CONSTRAINT_NAME,
    kcu.REFERENCED_TABLE_NAME AS referenced_table,
    kcu.REFERENCED_COLUMN_NAME AS referenced_column,
    rc.UPDATE_RULE,
    rc.DELETE_RULE
FROM 
    information_schema.KEY_COLUMN_USAGE kcu
JOIN 
    information_schema.REFERENTIAL_CONSTRAINTS rc 
    ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME
    AND kcu.CONSTRAINT_SCHEMA = rc.CONSTRAINT_SCHEMA
WHERE 
    kcu.TABLE_SCHEMA = 'unlisted_securities_exchange'
    AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY 
    kcu.TABLE_NAME, kcu.ORDINAL_POSITION;

-- Check all Check Constraints definitions
SELECT 
    cc.CONSTRAINT_NAME,
    cc.CHECK_CLAUSE
FROM 
    information_schema.CHECK_CONSTRAINTS cc
WHERE 
    cc.CONSTRAINT_SCHEMA = 'unlisted_securities_exchange';
