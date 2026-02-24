-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mobile VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(100),
    wallet_balance DECIMAL(12, 2) DEFAULT 50000.00,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Markets Table
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    open_time TIME NOT NULL, -- Format: HH:MM:SS
    close_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Bets Table
CREATE TABLE IF NOT EXISTS bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    bet_type VARCHAR(20) NOT NULL, -- single, jodi, single_panna, double_panna, triple_panna
    bet_number VARCHAR(10) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, won, lost
    market_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Results Table
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    market_id UUID REFERENCES markets(id) ON DELETE CASCADE,
    market_date DATE NOT NULL,
    winning_number VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(market_id, market_date)
);

-- Wallet Transactions Table
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(10) NOT NULL, -- credit, debit
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add name column if it doesn't exist (for existing databases)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='users' AND column_name='name') THEN
        ALTER TABLE users ADD COLUMN name VARCHAR(100);
    END IF;
END$$;

-- Seed Markets (idempotent)
INSERT INTO markets (name, open_time, close_time) 
VALUES 
('Laxmi Morning', '09:00:00', '12:00:00'),
('Shridevi Morning', '13:00:00', '15:00:00'),
('Karnatak Day', '16:00:00', '19:00:00'),
('Milan Night', '20:00:00', '23:00:00')
ON CONFLICT DO NOTHING;
