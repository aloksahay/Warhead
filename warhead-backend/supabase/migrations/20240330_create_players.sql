-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    wallet_address TEXT NOT NULL UNIQUE,
    nickname TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS players_wallet_address_idx ON public.players(wallet_address);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read players
CREATE POLICY "Allow public read access" ON public.players
    FOR SELECT USING (true);

-- Create policy to allow insert with unique wallet_address and nickname
CREATE POLICY "Allow public insert with unique constraints" ON public.players
    FOR INSERT WITH CHECK (
        NOT EXISTS (
            SELECT 1 FROM public.players 
            WHERE wallet_address = NEW.wallet_address 
            OR nickname = NEW.nickname
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON public.players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 