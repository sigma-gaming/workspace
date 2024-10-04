ALTER TABLE "ReferrerTransaction" RENAME COLUMN "id" TO "oldId";
ALTER TABLE "ReferrerTransaction" DROP CONSTRAINT "ReferrerReward_pkey";
ALTER TABLE "ReferrerTransaction" ALTER COLUMN "oldId" DROP NOT NULL;
ALTER TABLE "ReferrerTransaction" ADD COLUMN "id" bigserial PRIMARY KEY NOT NULL;
ALTER TABLE "ReferrerTransaction" DROP COLUMN IF EXISTS "oldId";