USE unlisted_securities_exchange;

-- 1. Insert sample companies
INSERT INTO companies
(company_name, sector, description, company_status, founded_year, created_at)
VALUES
('NovaTech Innovations', 'Technology',
 'Software and AI solutions company', 'active', 2018, NOW()),

('GreenGrid Energy', 'Renewable Energy',
 'Clean energy and solar power company', 'active', 2020, NOW()),

('UrbanNest Developers', 'Real Estate',
 'Residential and commercial property company', 'active', 2016, NOW());


-- 2. Insert securities for these companies
INSERT INTO shares
(company_id, share_type, total_shares, available_shares, face_value, current_price)
SELECT company_id, 'Equity', 10000, 10000, 10.00, 125.00
FROM companies
WHERE company_name = 'NovaTech Innovations';

INSERT INTO shares
(company_id, share_type, total_shares, available_shares, face_value, current_price)
SELECT company_id, 'Equity', 15000, 15000, 10.00, 85.00
FROM companies
WHERE company_name = 'GreenGrid Energy';

INSERT INTO shares
(company_id, share_type, total_shares, available_shares, face_value, current_price)
SELECT company_id, 'Equity', 12000, 12000, 10.00, 150.00
FROM companies
WHERE company_name = 'UrbanNest Developers';


-- 3. Insert sample debentures
INSERT INTO debentures
(company_id, debenture_name, face_value, interest_rate,
 issue_quantity, maturity_date, issue_date, status)
SELECT company_id, 'NovaTech Corporate Debenture',
       1000.00, 8.50, 500, '2030-10-20', '2026-10-20', 'active'
FROM companies
WHERE company_name = 'NovaTech Innovations';

INSERT INTO debentures
(company_id, debenture_name, face_value, interest_rate,
 issue_quantity, maturity_date, issue_date, status)
SELECT company_id, 'GreenGrid Renewable Debenture',
       1000.00, 7.50, 700, '2031-10-20', '2026-10-20', 'active'
FROM companies
WHERE company_name = 'GreenGrid Energy';

INSERT INTO debentures
(company_id, debenture_name, face_value, interest_rate,
 issue_quantity, maturity_date, issue_date, status)
SELECT company_id, 'UrbanNest Property Debenture',
       1000.00, 9.00, 400, '2032-10-20', '2026-10-20', 'active'
FROM companies
WHERE company_name = 'UrbanNest Developers';


-- 4. Check inserted data
SELECT * FROM companies;
SELECT * FROM shares;
SELECT * FROM debentures;