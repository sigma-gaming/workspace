CREATE TABLE IF NOT EXISTS "SystemState" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"lastReferrerPayoutsAt" timestamp with time zone DEFAULT now() NOT NULL
);

INSERT INTO "SystemState" DEFAULT VALUES;