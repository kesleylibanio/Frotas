-- 1. Update existing data to match the new allowed types
-- This prevents the "check constraint violated by some row" error
UPDATE vehicles SET type = 'Pipa10' WHERE type = 'Pipa de 10mil L';
UPDATE vehicles SET type = 'Pipa20' WHERE type = 'Pipa de 20mil L';
UPDATE vehicles SET type = 'Traçado' WHERE type = 'Caminhão Traçado';

-- 2. Fix vehicles_type_check constraint
ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS vehicles_type_check;
ALTER TABLE vehicles ADD CONSTRAINT vehicles_type_check CHECK (type IN ('Carreta', 'Pipa10', 'Pipa20', 'Traçado'));

-- 3. Update maintenance_intervals table to support KM and Hours
ALTER TABLE maintenance_intervals ADD COLUMN IF NOT EXISTS measurement_type TEXT DEFAULT 'odometer';

-- Add constraint to ensure only valid measurement types are used
ALTER TABLE maintenance_intervals DROP CONSTRAINT IF EXISTS maintenance_intervals_measurement_type_check;
ALTER TABLE maintenance_intervals ADD CONSTRAINT maintenance_intervals_measurement_type_check CHECK (measurement_type IN ('odometer', 'hour_meter'));

-- 4. Garantir que a tabela maintenance_intervals tenha um ID auto-incremento correto
DO $$
BEGIN
    -- Se a tabela não tiver a coluna id como serial/identity, tentamos corrigir
    -- Nota: SERIAL em Postgres cria uma sequência automaticamente.
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'maintenance_intervals' 
        AND column_name = 'id' 
        AND column_default LIKE 'nextval%'
    ) THEN
        -- Se o ID já existe mas não é serial, criamos a sequência
        CREATE SEQUENCE IF NOT EXISTS maintenance_intervals_id_seq;
        ALTER TABLE maintenance_intervals ALTER COLUMN id SET DEFAULT nextval('maintenance_intervals_id_seq');
        ALTER SEQUENCE maintenance_intervals_id_seq OWNED BY maintenance_intervals.id;
        -- Ajusta o valor da sequência para o máximo atual + 1
        PERFORM setval('maintenance_intervals_id_seq', COALESCE((SELECT MAX(id) FROM maintenance_intervals), 0) + 1);
    END IF;
END $$;
