CREATE TABLE "dailyPhotos" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"photoUrl" text NOT NULL,
	"note" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profileInfo" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"firstName" text NOT NULL,
	"lastName" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	CONSTRAINT "profileInfo_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'USER' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dailyPhotos" ADD CONSTRAINT "dailyPhotos_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profileInfo" ADD CONSTRAINT "profileInfo_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;