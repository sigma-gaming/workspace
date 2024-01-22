-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('User', 'Moderator', 'Admin');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" "UserRole"[] DEFAULT ARRAY['User']::"UserRole"[];
