# VALENCE-X — Private Securities Terminal
### Academic DBMS Project: Unlisted Securities Exchange

[![Technology Stack](https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20MySQL%208.0-0ea5e9.svg)](#technology-stack)
[![Database](https://img.shields.io/badge/Database-unlisted__securities__exchange-10b981.svg)](#phase-i--database-design--relational-model)
[![Phase I, II, III](https://img.shields.io/badge/Academic%20Deliverables-Phase%20I%2C%20II%2C%20III%20Complete-emerald.svg)](#academic-sql-deliverables)

---

> ⚠️ **Educational College Prototype Disclaimer**  
> **VALENCE-X** is an academic simulation built for a Database Management Systems (DBMS) mini-project. All entities, companies, securities, user holdings, and transaction records are purely simulated. It is not an actual brokerage, stock exchange, or licensed financial custodian.

---

## 👥 Project Team & Academic Identity

- **Project Title:** VALENCE-X — Private Securities Terminal
- **Academic Project Focus:** DBMS Relational Design, Weak Entity Mapping, ACID Transactions, and Triggers/Views
- **Team Members:**
  - **Kapil Joshi**
  - **Dhruvan Joshi**
  - **Krishna Kela**
- **Target RDBMS:** MySQL 8.0+ / MySQL Workbench
- **Default Port:** `3307` (or `3306`)
- **Database Name:** `unlisted_securities_exchange`

---

## 🏗️ System Architecture & Workflow

```text
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND INTERFACE                     │
│           React 19 + Vite 6 + Tailwind CSS + Lucide         │
│  - Dark Institutional OTC Terminal Theme                    │
│  - Real-time Market Depth & Live Custody Portfolio          │
│  - One-Click Order Matching Demonstration                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON REST APIs
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND API ENGINE                    │
│              Node.js + Express.js + mysql2/promise          │
│  - bcryptjs Password Hashing & Session Verification         │
│  - Atomic ACID Order Matching Engine (ROW LOCKS, FOR UPDATE)│
│  - Parametric Sanitized SQL Queries (SQL Injection Guard)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ TCP / MySQL Connection Pool (Port 3307)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       MYSQL DATABASE                        │
│                 unlisted_securities_exchange                │
│  - 8 Normalized Tables with Comprehensive Constraints       │
│  - Weak Entity Identifying Composite Keys for Buy & Sell    │
│  - 5 Stored Triggers for KYC, Balances & Price Discovery    │
│  - 7 SQL Views for Market Depth, Analytics & Ledgers        │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Academic SQL Deliverables (VS Code & MySQL Workbench)

All submission SQL deliverables are organized in the dedicated [`database/`](./database/) directory:

| Deliverable File | Academic Scope & Content |
| :--- | :--- |
| [`database/phase1_schema.sql`](./database/phase1_schema.sql) | **Phase I Schema DDL:** 8 normalized tables with `NOT NULL`, Primary Keys, Foreign Keys, `CHECK` constraints, composite identifying keys for weak entities, and indexes. |
| [`database/phase1_constraints.sql`](./database/phase1_constraints.sql) | **Phase I Mapping & Constraints:** Mathematical ER-to-Relational mapping documentation, weak entity proof, and verification queries in `information_schema`. |
| [`database/phase2_queries.sql`](./database/phase2_queries.sql) | **Phase II Advanced SQL:** Complete 16 assigned queries covering multi-table joins, aggregates, VWAP, grouped having, and nested/correlated subqueries. |
| [`database/phase2_dml.sql`](./database/phase2_dml.sql) | **Phase II DML Script:** Controlled `INSERT`, `UPDATE`, and `DELETE` operations demonstrating order life cycle, partial fills, and safe cancellations. |
| [`database/phase3_triggers.sql`](./database/phase3_triggers.sql) | **Phase III Triggers:** 5 MySQL triggers for KYC compliance, balance verification, remaining quantity protection, and automated market price discovery. |
| [`database/phase3_views.sql`](./database/phase3_views.sql) | **Phase III Views:** 7 views for order book market depth, audited transaction ledgers, company trading summaries, ESOPs, and debenture debt schedules. |
| [`database/seed.sql`](./database/seed.sql) | **Repeatable Demonstration Dataset:** Realistic companies, securities, debentures, ESOPs, test users (with bcrypt hashes), and transactions. |
| [`database/migrations/`](./database/migrations/) | Automated SQL migration scripts for cloud deployment. |

---

## 📐 Phase I — The 8 Relational Tables & Weak Entity Design

### The 8 Tables
1. **`companies`** — Private and unlisted enterprises (`company_id`, `company_name`, `sector`, `description`, `company_status`, `founded_year`).
2. **`shares`** — Listed equity classes issued by companies (`share_id`, `company_id`, `share_type`, `total_shares`, `available_shares`, `face_value`, `current_price`).
3. **`users`** — Exchange participants (`user_id`, `name`, `email`, `password`, `role`, `kyc_status`, `share_id`, `shares_owned`).
4. **`buy` (Weak Entity)** — Purchase bids placed by investors.
5. **`sell` (Weak Entity)** — Sale asks posted by investors.
6. **`transactions`** — Certified trade executions linking buyers, sellers, orders, and securities.
7. **`esops`** — Employee Stock Ownership Plans (`esop_id`, `user_id`, `company_id`, `number_of_options`, `exercise_price`, `vesting_period`, `exercise_status`, `grant_date`, `expiry_date`).
8. **`debentures`** — Corporate fixed-income debt instruments (`debenture_id`, `company_id`, `debenture_name`, `face_value`, `interest_rate`, `issue_quantity`, `issue_date`, `maturity_date`, `status`).

### 🎓 Academic Justification: Weak Entity Modeling of `Buy` and `Sell`
- **Conceptual Justification:** A Buy or Sell order cannot exist independently without an owning `User`. If a user is removed, all their pending orders are deleted (`ON DELETE CASCADE`).
- **Relational Mapping:** Per Step 2 of the formal ER-to-Relational mapping algorithm:
  - Primary Key of `Buy`: Composite `(user_id, buy_id)`.
  - Primary Key of `Sell`: Composite `(user_id, sell_id)`.
- **Foreign Key Linkage in `Transactions`:**
  - `(buyer_id, buy_id) REFERENCES buy(user_id, buy_id)`
  - `(seller_id, sell_id) REFERENCES sell(user_id, sell_id)`
  - Domain check: `CHECK (buyer_id <> seller_id)` (prevents self-trading).

---

## 🔍 Phase II — The 16 Core SQL Queries

| Query | Topic | Relational & SQL Concepts Demonstrated |
| :--- | :--- | :--- |
| **Q1** | Full Transaction Ledger | 6-table `INNER JOIN` tracing settled executions across buyer, seller, order IDs, and companies. |
| **Q2** | Open Buy Orders | Filtered join retrieving active bids (`PENDING`, `PARTIAL`) and outstanding commitments. |
| **Q3** | ESOP Option Profiles | Multi-entity join linking employees, corporate issuers, strike prices, and vesting schedules. |
| **Q4** | Companies Without Securities | Anti-join pattern using `LEFT OUTER JOIN ... WHERE shares.share_id IS NULL`. |
| **Q5** | Potential Buy-Sell Matches | Cross-table matching condition (`buy.price >= sell.price AND buyer <> seller`). |
| **Q6** | Trade Stats by Company | `GROUP BY` with `COUNT(t.id)`, `SUM(quantity)`, and `COALESCE` turnover values. |
| **Q7** | Price Stats & VWAP | Volume-Weighted Average Price formula: `SUM(qty * price) / SUM(qty)` per security. |
| **Q8** | Frequent Order Submissions | Derived table with `UNION ALL`, aggregated `HAVING COUNT(*) >= 3`. |
| **Q9** | Active Debenture Capital | Aggregation of debt capital (`SUM(qty * face_value)`) and average coupon rates. |
| **Q10** | Sector Liquidity Depth | Macro-level analysis using `COUNT(DISTINCT c.company_id)` and public float values. |
| **Q11** | Premium Securities | Scalar subquery filter comparing current price to exchange-wide `AVG(current_price)`. |
| **Q12** | Pure Capital Allocators | Set difference semantics using uncorrelated `IN (SELECT ... FROM buy)` and `NOT IN (SELECT ... FROM sell)`. |
| **Q13** | Highest-Value Execution | Subquery filter isolating the record where `quantity * price = (SELECT MAX(...))`. |
| **Q14** | Hybrid Capital Issuers | Dual correlated `EXISTS` subqueries checking intersection of debentures and ESOPs. |
| **Q15** | Discounted Asks | Correlated subquery identifying sell asks priced below that security's average ask. |
| **Q16** | Illiquid Securities | Correlated `NOT EXISTS` finding securities with no active open sell liquidity. |

---

## ⚡ Phase III — Triggers & Views

### Stored Triggers ([`database/phase3_triggers.sql`](./database/phase3_triggers.sql))
1. `trg_validate_buy_before_insert` — Rejects buy orders if the investor's KYC status is not `VERIFIED` or if the company is inactive.
2. `trg_validate_sell_before_insert` — Verifies seller KYC and verifies that the user actually owns sufficient shares in custody before posting an ask.
3. `trg_buy_order_status_update` — Enforces that `remaining_quantity` cannot increase, and transitions status automatically to `COMPLETED` when remaining reaches 0.
4. `trg_sell_order_status_update` — Protects sell order remaining quantities and enforces status consistency.
5. `trg_after_transaction_settlement` — Automatically updates `shares.current_price` to the last traded price (LTP) whenever a transaction settles.

### SQL Views ([`database/phase3_views.sql`](./database/phase3_views.sql))
1. `vw_company_securities` — Company profiles with share classes, public float, and market cap.
2. `vw_open_buy_orders` — Real-time bid order book sorted by price-time priority.
3. `vw_open_sell_orders` — Real-time ask order book sorted by price-time priority.
4. `vw_transaction_history` — Certified regulatory audit ledger.
5. `vw_company_trading_summary` — Exchange liquidity and turnover statistics.
6. `vw_esop_information` — Employee options and unrealized intrinsic gains.
7. `vw_debenture_information` — Corporate bond schedules and annual interest obligations.

---

## 💻 Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+)
- MySQL Server (v8.0+) running on port `3307` (or `3306`)
- MySQL Workbench (or MySQL CLI)

### 1. Database Initialization
Open MySQL Workbench, connect to your MySQL Server, and run:
```sql
CREATE DATABASE IF NOT EXISTS unlisted_securities_exchange;
```
Then execute the scripts in order:
1. `database/phase1_schema.sql`
2. `database/seed.sql`
3. `database/phase3_triggers.sql`
4. `database/phase3_views.sql`

*Alternatively, execute directly via MySQL CLI:*
```bash
mysql -h localhost -P 3307 -u root -p unlisted_securities_exchange < database/phase1_schema.sql
mysql -h localhost -P 3307 -u root -p unlisted_securities_exchange < database/seed.sql
mysql -h localhost -P 3307 -u root -p unlisted_securities_exchange < database/phase3_triggers.sql
mysql -h localhost -P 3307 -u root -p unlisted_securities_exchange < database/phase3_views.sql
```

### 2. Configure Backend Environment
In `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=unlisted_securities_exchange
```

### 3. One-Command Unified Startup (Runs Both Frontend & Backend)
From the project root:
```bash
# Install root orchestration & concurrently
npm install

# Start BOTH Backend (port 5000) and Frontend (port 5173) simultaneously:
npm run dev
```

*Open `http://localhost:5173` in your browser. Both servers run with synchronized color-coded terminal logs.*

> **Alternative: Running In Separate Terminals**
> - **Backend:** `cd backend && npm install && npm run dev` (runs on `http://localhost:5000`)
> - **Frontend:** `cd frontend && npm install && npm run dev` (runs on `http://localhost:5173`)

### 4. 1-Click Database Reset for Viva / Demonstrations
Before presenting your project or viva, reset the database to a clean, canonical demonstration state:
```bash
npm run reset:demo
```
*This truncates and re-seeds all 8 relational tables with correct constraints, test users, and open order books.*

---

## 🎯 Step-by-Step Order Matching Viva Demonstration

Follow these steps to demonstrate the full end-to-end DBMS transaction lifecycle:

1. **Start the Application:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

2. **Step 1: Sign in as Seller (Arjun Verma)**
   - Click **Enter Terminal** -> Click **Sign In** (or click *Demo as Arjun*).
   - Email: `arjun@valence.local` | Password: `Password@123`
   - Navigate to **Sell Security** tab.
   - Select **NovaTech Systems - Equity**, enter Quantity: `10`, Target Ask Price: `500`.
   - Click **PLACE SELL ORDER**.
   - *Result: Inserted into the MySQL `sell` weak entity table with status `PENDING`.*

3. **Step 2: Sign in as Buyer (Kapil Sharma / Friend's Account)**
   - Click **EXIT TERMINAL** at bottom-left.
   - Click **Sign In** -> Sign in as `kapil@valence.local` (or click *Demo as Kapil*).
   - Navigate to **Buy Security** tab.
   - Select **NovaTech Systems - Equity**, enter Quantity: `10`, Limit Bid Price: `500`.
   - Click **PLACE BUY ORDER**.
   - *Result: Inserted into the MySQL `buy` weak entity table with status `PENDING`.*

4. **Step 3: Trigger the ACID Order Matching Engine**
   - Click **Order Matching** in the sidebar.
   - Notice both orders present in the **BUY ORDER QUEUE** and **SELL ORDER QUEUE**.
   - Click **EXECUTE MATCH ENGINE**.
   - *Result: Backend opens an ACID transaction (`BEGIN TRANSACTION ... FOR UPDATE`), matches the crossing bid/ask, deducts quantities, updates user portfolio custody balances, and inserts an audited record into `transactions`.*

5. **Step 4: Verify the Settled Transaction**
   - Go to the **Transactions** tab.
   - A new immutable transaction `TXN-X` is displayed showing Kapil bought from Arjun at ₹500.00!
   - Check the **Holdings** tab to see updated custody unit counts.

---

## 🔑 Demo Login Credentials (MySQL Seed Data)

| Role | Name | Email | Password | Holdings in Seed |
| :--- | :--- | :--- | :--- | :--- |
| **Investor** | Kapil Sharma | `kapil@valence.local` | `Password@123` | 450 Shares (NovaTech) |
| **Investor** | Arjun Verma | `arjun@valence.local` | `Password@123` | 300 Shares (GreenGrid) |
| **Investor** | Pooja Mehta | `pooja@valence.local` | `Password@123` | 150 Shares (NovaTech) |
| **Admin** | Market Admin | `admin@valence.local` | `admin123` | Custody Admin |

---

## 📡 REST API Catalog

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user with bcrypt verification |
| `POST` | `/api/auth/signup` | Register new user with hashed password & KYC |
| `GET` | `/api/users/:id` | Get user profile and portfolio valuation |
| `GET` | `/api/companies` | List all companies and share summaries |
| `GET` | `/api/shares` | List all securities with live prices & market cap |
| `GET` | `/api/buy` | List all buy orders |
| `POST` | `/api/buy` | Submit new buy order (Weak Entity) |
| `POST` | `/api/buy/cancel` | Cancel open buy order |
| `GET` | `/api/sell` | List all sell orders |
| `POST` | `/api/sell` | Submit new sell order (Weak Entity) |
| `POST` | `/api/sell/cancel` | Cancel open sell order |
| `POST` | `/api/match` | **Atomic ACID Order Matching Engine** |
| `GET` | `/api/transactions` | Full settled transaction ledger |
| `GET` | `/api/esops` | Employee Stock Option register |
| `GET` | `/api/debentures` | Corporate debentures list |
| `GET` | `/api/stats/overview` | Exchange turnover & market overview |
| `GET` | `/api/stats/views/:viewName` | Direct query to Phase III views |

---

## ☁️ Cloud Deployment Recommendations

1. **Frontend:** Deploy to **Vercel** or **Netlify** (Root directory: `frontend`, Build command: `npm run build`, Output directory: `dist`). Set environment variable `VITE_API_BASE_URL` to your backend URL.
2. **Backend:** Deploy to **Render**, **Railway**, or **Fly.io** (Root directory: `backend`, Start command: `npm start`). Set environment variables (`PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
3. **Managed MySQL Database:** Use **Aiven for MySQL**, **PlanetScale**, or **Railway MySQL**. Run `database/phase1_schema.sql`, `database/phase3_triggers.sql`, `database/phase3_views.sql`, and `database/seed.sql`.
