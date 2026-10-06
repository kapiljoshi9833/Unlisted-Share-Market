# Unlisted-Share-Market
# ◇ VALENCE-X

## Private Securities Terminal

VALENCE-X is a DBMS-based academic prototype that simulates a simplified marketplace for **unlisted securities**, including pre-IPO equities, ESOPs, and corporate debentures.

The project demonstrates how a relational database, backend APIs, and a frontend interface can work together to manage companies, securities, buy/sell orders, transactions, holdings, ESOPs, and debentures.

> ⚠️ **Academic Project Disclaimer:**  
> VALENCE-X is strictly a college/educational prototype. It is not a real stock exchange, brokerage platform, investment platform, payment system, custody system, or securities settlement platform.

---

## ✨ Key Features

- 👤 User registration and login
- 🔐 Investor and Admin roles
- 🏢 Company management
- 📄 Unlisted security management
- 🟢 Buy order placement
- 🔴 Sell order placement
- 🔄 Automatic order matching
- 📦 Partial order matching
- 💱 Transaction recording
- 📊 User share holdings
- 📜 Settlement ledger
- 🎯 ESOP management
- 💰 Corporate debenture management
- 🔎 Market Explorer
- 🔁 Order Matching Visualizer
- 🗄️ MySQL database integration
- 🔌 REST API backend
- 🌑 Dark institutional-style UI

---

# 🏗️ System Architecture

```text
┌─────────────────────────┐
│       Frontend          │
│   React + Vite + CSS    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│       REST API          │
│    Node.js + Express    │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│         MySQL           │
│    Relational Database  │
└─────────────────────────┘

🗄️ Database Design
VALENCE-X uses exactly 8 relational tables.
Table	Purpose
Users	Stores investor/admin information and share holdings
Companies	Stores company information
Shares	Stores securities, inventory and pricing information
Buy	Stores buy orders
Sell	Stores sell orders
Transactions	Stores completed matched transactions
ESOPs	Stores employee stock option information
Debentures	Stores corporate debenture information


Database Relationship
                     ┌──────────────┐
                     │  Companies   │
                     └──────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐   ┌─────────┐   ┌────────────┐
        │  Shares  │   │  ESOPs  │   │ Debentures │
        └────┬─────┘   └─────────┘   └────────────┘
             │
       ┌─────┴─────┐
       ▼           ▼
   ┌────────┐  ┌────────┐
   │  Buy   │  │  Sell  │
   └────┬───┘  └───┬────┘
        │          │
        └────┬─────┘
             ▼
      ┌──────────────┐
      │ Transactions │
      └──────────────┘

             Users
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
      Buy     Sell    ESOPs

🔄 Order Matching
VALENCE-X implements a simplified Continuous Double Auction model.
A buy order can be matched with a sell order when:
Buy Price >= Sell Price

The matched quantity is:
MIN(Buy Remaining Quantity, Sell Remaining Quantity)

The execution price is the seller's asking price.
Example
Buyer:
300 shares @ ₹120

Seller:
200 shares @ ₹115

Since:
₹120 >= ₹115

The system executes:
200 shares @ ₹115

Remaining buyer quantity:
100 shares

Seller status:
COMPLETED

The completed trade is recorded in the Transactions table.
🔁 Partial Matching
The system supports partial order matching.
For example:
SELL ORDER
500 shares @ ₹100

Can be matched with:
BUY ORDER 1 → 200 shares
BUY ORDER 2 → 150 shares
BUY ORDER 3 → 150 shares

Result:
200 + 150 + 150 = 500 shares

The seller's order becomes:
COMPLETED

This demonstrates how one order can be fulfilled through multiple matching orders.
🔐 Atomic Database Transactions
Order execution uses database transactions to maintain consistency.
The system performs:
BEGIN TRANSACTION
        │
        ▼
Create Transaction Record
        │
        ▼
Update Buy Order
        │
        ▼
Update Sell Order
        │
        ▼
Update Buyer Holdings
        │
        ▼
Update Seller Holdings
        │
        ▼
      COMMIT

If an error occurs:
ROLLBACK

This prevents incomplete updates and maintains database consistency.
🛠️ Technology Stack
Frontend
- React
- Vite
- JavaScript
- Tailwind CSS
Backend
- Node.js
- Express.js
- REST APIs
Database
- MySQL
Development Tools
- VS Code
- Git
- GitHub
📁 Project Structure
unlisted-securities-exchange/
│
├── backend/
│   ├── .env
│   ├── db.js
│   ├── server.js
│   ├── package.json
│   ├── schema.sql
│   │
│   └── routes/
│       ├── users.js
│       ├── companies.js
│       ├── shares.js
│       ├── buy.js
│       ├── sell.js
│       ├── transactions.js
│       ├── esops.js
│       └── debentures.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── LandingPage.jsx
    │   │   └── AuthModal.jsx
    │   │
    │   ├── data/
    │   │   └── mockData.js
    │   │
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    │
    ├── tailwind.config.js
    └── package.json

⚙️ Installation & Setup
1. Clone the Repository
git clone https://github.com/kapiljoshi9833/Unlisted-Share-Market.git

cd Unlisted-Share-Market

2. Setup Backend
cd backend
npm install

3. Configure Environment Variables
Create a .env file inside the backend folder.
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=unlisted_securities_exchange
DB_PORT=3307
PORT=5000

Do not upload your .env file or database password to GitHub.

4. Create the Database
Open MySQL and create the database:
CREATE DATABASE unlisted_securities_exchange;

Then execute the project's schema.sql file to create the required tables.
5. Start the Backend
From the backend directory:
npm start

The backend runs on:
http://localhost:5000

6. Start the Frontend
Open another terminal:
cd frontend
npm install
npm run dev

Open the Vite development URL shown in the terminal.
🔌 API Endpoints
Users
POST /api/login
POST /api/users

Companies
GET  /api/companies
POST /api/companies

Shares
GET  /api/shares
POST /api/shares

Buy Orders
GET  /api/buy
POST /api/buy

Sell Orders
GET  /api/sell
POST /api/sell

Transactions
GET /api/transactions
GET /api/transactions/user/:userId

ESOPs
GET  /api/esops
POST /api/esops

Debentures
GET  /api/debentures
POST /api/debentures

Order Matching
POST /api/match

🎓 DBMS Concepts Demonstrated
This project demonstrates the following DBMS concepts:
- Primary Keys
- Foreign Keys
- Unique Constraints
- Referential Integrity
- Relational Database Design
- SQL CRUD Operations
- JOIN Operations
- Database Transactions
- COMMIT
- ROLLBACK
- Data Consistency
- Backend-Database Connectivity
- REST API Integration
- Order Matching
- Partial Order Processing
🎯 Project Objective
The main objective of VALENCE-X is to demonstrate how a relational database can be used to build a simplified securities marketplace.
The project combines:
Database Design
       +
SQL
       +
Backend API
       +
Order Matching
       +
Transactions
       +
Data Consistency
       +
Frontend Interface

The project focuses on DBMS concepts and implementation, rather than building a real financial exchange.
👥 Team
Team Members
- Kapil Joshi
- Dhruvan Joshi
- Krishna Kela
📌 Project Scope
VALENCE-X is intentionally designed as a simplified academic system.
Included
✔ Company Management
✔ Security Management
✔ Buy/Sell Orders
✔ Order Matching
✔ Partial Matching
✔ Transaction Records
✔ Holdings
✔ ESOPs
✔ Debentures
✔ MySQL Database
✔ REST APIs

Not Included
✘ Real-money trading
✘ Payment gateway
✘ Live stock market data
✘ Real securities settlement
✘ Cryptocurrency
✘ Investment advisory
✘ Real brokerage services
✘ Custody services

⚠️ Disclaimer
VALENCE-X is an educational DBMS prototype created for academic purposes.
All companies, securities, prices, users, holdings, and transactions represented in the application are for demonstration purposes.
This project does not provide real investment, brokerage, trading, settlement, custody, or financial advisory services.
