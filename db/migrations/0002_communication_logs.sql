-- Communication logs: rasto de auditoria de WhatsApp/SMS por checkout e cliente.
-- Additivo e idempotente — não toca em tabelas existentes.
CREATE TABLE IF NOT EXISTS "communication_logs" (
  "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  "reference" varchar(64),
  "lead_id" integer,
  "phone" varchar(20) NOT NULL,
  "type" varchar(32) NOT NULL,
  "channel" varchar(16) NOT NULL,
  "status" varchar(16) NOT NULL,
  "trigger" varchar(16) NOT NULL,
  "message_text" varchar(255),
  "failure_reason" varchar(255),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Índices para as duas consultas usadas pelo admin (timeline por cliente e por checkout).
CREATE INDEX IF NOT EXISTS "communication_logs_phone_idx" ON "communication_logs" ("phone");
CREATE INDEX IF NOT EXISTS "communication_logs_reference_idx" ON "communication_logs" ("reference");
