-- Custom SQL migration file, put you code below! --
UPDATE "Profile" p
SET "image" = a."providerUserImage"
FROM "Account" a
WHERE p."userId" = a."userId"
  AND p."usedProvider" = a."provider"
  AND a."providerUserImage" IS NOT NULL;