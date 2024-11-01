ALTER TABLE "Balance" ADD CONSTRAINT "balance_available_amount_check" 
  CHECK ("available" >= 0);

ALTER TABLE "Transaction" ADD CONSTRAINT "transaction_amount_check" 
  CHECK ("amount" >= -9007199254740991 AND "amount" <= 9007199254740991); -- MAX_SAFE_INTEGER
