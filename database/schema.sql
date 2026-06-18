-- Enable the UUID extension for secure, unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the pets table
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL, -- This will tie into Supabase Auth later
    name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    ideal_weight DECIMAL(5,2),
    current_weight DECIMAL(5,2),
    last_vaccine_date DATE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the clinical logs table
CREATE TABLE clinical_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    visit_type VARCHAR(50) CHECK (visit_type IN ('ROUTINE', 'LAB_RESULT', 'EMERGENCY')),
    primary_reason TEXT NOT NULL,
    vet_summary_notes TEXT,
    abnormal_flags INTEGER DEFAULT 0,
    requires_follow_up BOOLEAN DEFAULT FALSE,
    resolved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index to drastically speed up dashboard load times
CREATE INDEX idx_clinical_logs_pet_id ON clinical_logs(pet_id);
