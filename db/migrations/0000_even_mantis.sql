CREATE TYPE "public"."checkout_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TABLE "checkouts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "checkouts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"reference" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"entity" varchar(32) NOT NULL,
	"payment_reference" varchar(64) NOT NULL,
	"amount" integer NOT NULL,
	"status" "checkout_status" DEFAULT 'pending' NOT NULL,
	"provider_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "checkouts_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "leads_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"source" varchar(50) NOT NULL,
	"journey" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
