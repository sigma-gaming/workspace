ALTER TABLE "Profiles" DROP CONSTRAINT "Profiles_pkey";
ALTER TABLE "Profiles" DROP COLUMN "id";
ALTER TABLE "Profiles" ADD COLUMN "id" serial NOT NULL;
ALTER TABLE "Profiles" ADD PRIMARY KEY (id);
ALTER TABLE "Notifications" ADD PRIMARY KEY (id);