CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"login" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL
);
