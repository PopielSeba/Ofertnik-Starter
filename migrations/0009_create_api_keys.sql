-- Create API keys table for external integrations
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"key_value" varchar NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"permissions" jsonb DEFAULT '["quotes:create", "assessments:create"]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"created_by_id" varchar,
	"last_used_at" timestamp,
	CONSTRAINT "api_keys_key_value_unique" UNIQUE("key_value")
);

-- Add foreign key constraint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_api_keys_key_value" ON "api_keys" ("key_value");
CREATE INDEX IF NOT EXISTS "idx_api_keys_is_active" ON "api_keys" ("is_active");