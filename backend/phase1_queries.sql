CREATE TABLE Companies (
    company_id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(150),
    sector VARCHAR(100),
    description VARCHAR(500),
    company_status VARCHAR(30),
    founded_year INT,
    created_at DATETIME
);

CREATE TABLE Shares (
    share_id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    share_type VARCHAR(50),
    total_shares INT,
    available_shares INT,
    face_value DECIMAL(12,2),
    current_price DECIMAL(12,2),
    FOREIGN KEY (company_id) REFERENCES Companies(company_id)
);

CREATE TABLE Users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(30),
    kyc_status VARCHAR(30),
    share_id INT,
    shares_owned INT,
    created_at DATETIME,
    FOREIGN KEY (share_id) REFERENCES Shares(share_id)
);

CREATE TABLE Buy (
    buy_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    share_id INT NOT NULL,
    quantity INT,
    price DECIMAL(12,2),
    remaining_quantity INT,
    buy_status VARCHAR(30),
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (share_id) REFERENCES Shares(share_id)
);

CREATE TABLE Sell (
    sell_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    share_id INT NOT NULL,
    quantity INT,
    price DECIMAL(12,2),
    remaining_quantity INT,
    sell_status VARCHAR(30),
    created_at DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (share_id) REFERENCES Shares(share_id)
);

CREATE TABLE Transactions (
    transaction_id INT PRIMARY KEY AUTO_INCREMENT,
    buy_id INT NOT NULL,
    sell_id INT NOT NULL,
    share_id INT NOT NULL,
    quantity INT,
    price DECIMAL(12,2),
    transaction_time DATETIME,
    FOREIGN KEY (buy_id) REFERENCES Buy(buy_id),
    FOREIGN KEY (sell_id) REFERENCES Sell(sell_id),
    FOREIGN KEY (share_id) REFERENCES Shares(share_id)
);

CREATE TABLE ESOPs (
    esop_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    company_id INT NOT NULL,
    number_of_options INT,
    exercise_price DECIMAL(12,2),
    vesting_period VARCHAR(100),
    exercise_status VARCHAR(30),
    grant_date DATETIME,
    expiry_date DATETIME,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (company_id) REFERENCES Companies(company_id)
);

CREATE TABLE Debentures (
    debenture_id INT PRIMARY KEY AUTO_INCREMENT,
    company_id INT NOT NULL,
    debenture_name VARCHAR(150),
    face_value DECIMAL(12,2),
    interest_rate DECIMAL(5,2),
    issue_quantity INT,
    maturity_date DATE,
    issue_date DATE,
    status VARCHAR(30),
    FOREIGN KEY (company_id) REFERENCES Companies(company_id)
);