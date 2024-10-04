-- Custom SQL migration file, put you code below! --
INSERT INTO "Balance" ("userId") SELECT id FROM "User";