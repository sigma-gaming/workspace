ALTER TABLE "Users" DROP COLUMN "profileId";
ALTER TABLE "Users" ADD COLUMN "profileId" integer;
UPDATE "Users" SET "profileId" = (SELECT "id" FROM "Profiles" WHERE "userId" = "Users"."id");