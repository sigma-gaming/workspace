-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('Deposit', 'Withdrawal', 'Bet', 'Win', 'Loss');

-- CreateEnum
CREATE TYPE "Game" AS ENUM ('Dice');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "TransactionType" NOT NULL,
    "game" "Game",
    "openingBalance" INTEGER NOT NULL DEFAULT 0,
    "closingBalance" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
