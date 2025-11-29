-- Make modelId optional in UsageLog table
-- First, add the column as nullable if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'UsageLog' AND column_name = 'modelId'
    ) THEN
        ALTER TABLE "UsageLog" ADD COLUMN "modelId" TEXT;
    ELSE
        -- If column exists but is NOT NULL, make it nullable
        ALTER TABLE "UsageLog" ALTER COLUMN "modelId" DROP NOT NULL;
    END IF;
END $$;

