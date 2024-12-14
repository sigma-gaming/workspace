-- Custom SQL migration file, put you code below! --
INSERT INTO "UserStats" ("userId")
SELECT "id" FROM "User"
ON CONFLICT ("userId") DO NOTHING;