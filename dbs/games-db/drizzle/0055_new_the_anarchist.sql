-- Custom SQL migration file, put you code below! --
-- Create "UserStats" records for each "User"
INSERT INTO "UserStats" ("userId")
SELECT id FROM "User";
