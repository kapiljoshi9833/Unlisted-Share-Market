// BRAND CONFIGURATION
export const BRAND = {
  name: "VALENCE",
  tagline: "Private Securities Exchange",
  symbol: "◇", // Minimal geometric terminal glyph
};

// 1. Users Table (user_id, name, email, password, role, kyc_status, share_id, shares_owned, created_at)
export const initialUsers = [
  { user_id: 1, name: "Kapil Joshi", email: "kapil@valence.local", role: "Investor", kyc_status: "VERIFIED", share_id: null, shares_owned: 0, created_at: "2026-01-10" },
  { user_id: 2, name: "Arjun Verma", email: "arjun@valence.local", role: "Investor", kyc_status: "VERIFIED", share_id: 1, shares_owned: 300, created_at: "2026-01-12" },
  { user_id: 3, name: "Market Admin", email: "admin@valence.local", role: "Admin", kyc_status: "VERIFIED", share_id: null, shares_owned: 0, created_at: "2026-01-01" }
];

// 2. Companies Table (company_id, company_name, sector, description, company_status, founded_year, created_at)
export const initialCompanies = [
  { company_id: 1, company_name: "NovaTech Innovations", sector: "Enterprise Cloud & AI", description: "B2B enterprise infrastructure and multi-cloud security engine.", company_status: "Active", founded_year: 2019, created_at: "2026-01-01" },
  { company_id: 2, company_name: "GreenGrid Energy", sector: "Clean Tech & Mobility", description: "Smart grid management and renewable energy storage infrastructure.", company_status: "Active", founded_year: 2020, created_at: "2026-01-02" },
  { company_id: 3, company_name: "UrbanNest Developers", sector: "Real Estate & Infrastructure", description: "Commercial tech parks and modern residential infrastructure development.", company_status: "Active", founded_year: 2016, created_at: "2026-01-03" },
  { company_id: 4, company_name: "BioHealth Diagnostics", sector: "Healthcare & Life Sciences", description: "Deep diagnostics indexing and healthcare interoperability layer.", company_status: "Active", founded_year: 2018, created_at: "2026-01-04" },
  { company_id: 5, company_name: "AeroSpace Dynamics", sector: "Aerospace & Defense", description: "Next-generation satellite telemetry and payload guidance systems.", company_status: "Active", founded_year: 2022, created_at: "2026-01-05" }
];

// 3. Shares Table (share_id, company_id, share_type, total_shares, available_shares, face_value, current_price)
export const initialShares = [
  { share_id: 1, company_id: 1, share_type: "Equity", total_shares: 50000, available_shares: 4200, face_value: 10, current_price: 250 },
  { share_id: 2, company_id: 2, share_type: "Equity", total_shares: 60000, available_shares: 3100, face_value: 5, current_price: 95 },
  { share_id: 3, company_id: 3, share_type: "Equity", total_shares: 40000, available_shares: 1850, face_value: 10, current_price: 150 },
  { share_id: 4, company_id: 4, share_type: "Equity", total_shares: 30000, available_shares: 2500, face_value: 10, current_price: 320 }
];

// 4. Buy Table (buy_id, user_id, share_id, quantity, price, remaining_quantity, buy_status, created_at)
export const initialBuyOrders = [];

// 5. Sell Table (sell_id, user_id, share_id, quantity, price, remaining_quantity, sell_status, created_at)
export const initialSellOrders = [];

// 6. Transactions Table (transaction_id, buy_id, sell_id, share_id, quantity, price, transaction_time)
export const initialTransactions = [];

// 7. ESOPs Table (esop_id, user_id, company_id, number_of_options, exercise_price, vesting_period, exercise_status, grant_date, expiry_date)
export const initialESOPs = [
  { esop_id: 1, user_id: 1, company_id: 1, number_of_options: 500, exercise_price: 120, vesting_period: "36 Months (Graded)", exercise_status: "Partially Vested", grant_date: "2024-03-01", expiry_date: "2029-03-01" },
  { esop_id: 2, user_id: 1, company_id: 2, number_of_options: 250, exercise_price: 90, vesting_period: "24 Months (Cliff)", exercise_status: "Unvested", grant_date: "2025-06-15", expiry_date: "2030-06-15" }
];

// 8. Debentures Table (debenture_id, company_id, debenture_name, face_value, interest_rate, issue_quantity, maturity_date, issue_date, status)
export const initialDebentures = [
  { debenture_id: 1, company_id: 1, debenture_name: "NovaTech 9.25% Senior Series A", face_value: 10000, interest_rate: 9.25, issue_quantity: 500, maturity_date: "2028-12-31", issue_date: "2023-12-31", status: "Active" },
  { debenture_id: 2, company_id: 2, debenture_name: "GreenGrid 8.50% Secured Bond", face_value: 25000, interest_rate: 8.50, issue_quantity: 200, maturity_date: "2029-06-30", issue_date: "2024-06-30", status: "Active" }
];
