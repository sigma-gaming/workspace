ALTER TABLE "Config" ADD CONSTRAINT "config_id_check" 
  CHECK (id = 1);

ALTER TABLE "Budget" ADD CONSTRAINT "budget_id_check" 
  CHECK (id = 1);