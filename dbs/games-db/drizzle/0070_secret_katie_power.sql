CREATE TABLE IF NOT EXISTS "Config" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"maintenanceEnabled" boolean DEFAULT false NOT NULL
);

INSERT INTO "Config" DEFAULT VALUES;