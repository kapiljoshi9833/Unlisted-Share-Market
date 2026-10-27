// BRAND CONFIGURATION
export const BRAND = {
  name: "VALENCE",
  tagline: "Private Securities Exchange",
  symbol: "◇", // Minimal geometric terminal glyph
};

// 1. Users Table (user_id, name, email, password, role, kyc_status, share_id, shares_owned, created_at)
// NOTE: Kapil Joshi and Dhruvan Joshi are NOT seeded so live viva sign-up / sign-in can be performed cleanly!
export const initialUsers = [
  { user_id: 1, name: "Arjun Verma", email: "arjun@valence.local", role: "Investor", kyc_status: "VERIFIED", share_id: 1, shares_owned: 400, created_at: "2026-01-10" },
  { user_id: 2, name: "Rohan Mehta", email: "rohan@valence.local", role: "Investor", kyc_status: "VERIFIED", share_id: 2, shares_owned: 300, created_at: "2026-01-11" },
  { user_id: 3, name: "Priya Sharma", email: "priya@valence.local", role: "Investor", kyc_status: "VERIFIED", share_id: 4, shares_owned: 200, created_at: "2026-01-12" },
  { user_id: 4, name: "Vikram Malhotra", email: "vikram@valence.local", role: "Investor", kyc_status: "VERIFIED", share_id: null, shares_owned: 0, created_at: "2026-01-13" },
  { user_id: 5, name: "Market Admin", email: "admin@valence.local", role: "Admin", kyc_status: "VERIFIED", share_id: null, shares_owned: 0, created_at: "2026-01-01" }
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
  { share_id: 1, company_id: 1, share_type: "Equity", total_shares: 50000, available_shares: 4200, face_value: 10, current_price: 245 },
  { share_id: 2, company_id: 2, share_type: "Equity", total_shares: 60000, available_shares: 3100, face_value: 5, current_price: 94 },
  { share_id: 3, company_id: 3, share_type: "Equity", total_shares: 40000, available_shares: 1850, face_value: 10, current_price: 150 },
  { share_id: 4, company_id: 4, share_type: "Equity", total_shares: 30000, available_shares: 2500, face_value: 10, current_price: 320 }
];

// 4. Buy Table (buy_id, user_id, share_id, quantity, price, remaining_quantity, buy_status, created_at)
export const initialBuyOrders = [
  { buy_id: 1, user_id: 4, share_id: 1, quantity: 150, price: 245, remaining_quantity: 50, buy_status: 'PARTIAL', created_at: '2026-10-14 10:00:00' },
  { buy_id: 2, user_id: 4, share_id: 2, quantity: 100, price: 92, remaining_quantity: 100, buy_status: 'PENDING', created_at: '2026-10-15 11:15:00' },
  { buy_id: 3, user_id: 2, share_id: 4, quantity: 50, price: 315, remaining_quantity: 50, buy_status: 'PENDING', created_at: '2026-10-16 14:30:00' },
  { buy_id: 4, user_id: 3, share_id: 2, quantity: 80, price: 94, remaining_quantity: 40, buy_status: 'PARTIAL', created_at: '2026-10-17 09:45:00' }
];

// 5. Sell Table (sell_id, user_id, share_id, quantity, price, remaining_quantity, sell_status, created_at)
export const initialSellOrders = [
  { sell_id: 1, user_id: 1, share_id: 1, quantity: 100, price: 255, remaining_quantity: 100, sell_status: 'PENDING', created_at: '2026-10-14 09:30:00' },
  { sell_id: 2, user_id: 2, share_id: 2, quantity: 100, price: 96, remaining_quantity: 100, sell_status: 'PENDING', created_at: '2026-10-15 10:00:00' },
  { sell_id: 3, user_id: 3, share_id: 4, quantity: 50, price: 325, remaining_quantity: 50, sell_status: 'PENDING', created_at: '2026-10-16 12:00:00' }
];

// 6. Transactions Table (transaction_id, buy_id, sell_id, share_id, quantity, price, transaction_time)
export const initialTransactions = [
  { transaction_id: 1, buyer_id: 4, buy_id: 1, seller_id: 1, sell_id: 4, share_id: 1, quantity: 100, price: 245, transaction_time: '2026-10-15 11:30:00' },
  { transaction_id: 2, buyer_id: 3, buy_id: 4, seller_id: 2, sell_id: 5, share_id: 2, quantity: 40, price: 94, transaction_time: '2026-10-18 14:15:00' }
];

// 7. ESOPs Table (esop_id, user_id, company_id, number_of_options, exercise_price, vesting_period, exercise_status, grant_date, expiry_date)
export const initialESOPs = [
  { esop_id: 1, user_id: 1, company_id: 1, number_of_options: 2500, exercise_price: 200, vesting_period: "36 Months (Graded)", exercise_status: "Partially Vested", grant_date: "2024-03-01", expiry_date: "2029-03-01" },
  { esop_id: 2, user_id: 2, company_id: 2, number_of_options: 1200, exercise_price: 80, vesting_period: "24 Months (Cliff)", exercise_status: "Unvested", grant_date: "2025-06-15", expiry_date: "2030-06-15" },
  { esop_id: 3, user_id: 3, company_id: 3, number_of_options: 1500, exercise_price: 120, vesting_period: "48 Months (Graded)", exercise_status: "Vested", grant_date: "2023-01-10", expiry_date: "2028-01-10" }
];

// 8. Debentures Table (debenture_id, company_id, debenture_name, face_value, interest_rate, issue_quantity, maturity_date, issue_date, status)
export const initialDebentures = [
  { debenture_id: 1, company_id: 1, debenture_name: "NovaTech 8.50% Senior Series A", face_value: 1000, interest_rate: 8.50, issue_quantity: 500, maturity_date: "2030-01-15", issue_date: "2024-01-15", status: "Active" },
  { debenture_id: 2, company_id: 2, debenture_name: "GreenGrid 7.50% Renewable Green Bond", face_value: 1000, interest_rate: 7.50, issue_quantity: 700, maturity_date: "2031-06-01", issue_date: "2024-06-01", status: "Active" },
  { debenture_id: 3, company_id: 3, debenture_name: "UrbanNest 9.00% Property Infra Bond", face_value: 1000, interest_rate: 9.00, issue_quantity: 400, maturity_date: "2032-11-01", issue_date: "2023-11-01", status: "Active" }
];
