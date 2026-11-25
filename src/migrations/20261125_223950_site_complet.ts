import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reservations_status" AS ENUM('en_attente', 'confirmee', 'arrivee', 'terminee', 'annulee', 'no_show');
  CREATE TYPE "public"."enum_reservations_source" AS ENUM('web', 'telephone', 'sur_place');
  CREATE TYPE "public"."enum_orders_type" AS ENUM('table', 'precommande', 'emporter');
  CREATE TYPE "public"."enum_orders_status" AS ENUM('programmee', 'recue', 'en_preparation', 'servie', 'annulee');
  CREATE TYPE "public"."enum_orders_payment_method" AS ENUM('caisse', 'en_ligne');
  CREATE TYPE "public"."enum_orders_payment_status" AS ENUM('a_regler', 'en_attente', 'payee', 'remboursee');
  CREATE TYPE "public"."enum_tables_zone" AS ENUM('salle', 'terrasse', 'vip', 'etage');
  CREATE TYPE "public"."enum_privatization_requests_status" AS ENUM('nouvelle', 'en_discussion', 'acceptee', 'refusee');
  CREATE TYPE "public"."enum_menu_items_tags" AS ENUM('nouveau', 'signature', 'sans_alcool', 'vegetarien', 'alcool');
  CREATE TYPE "public"."enum_loyalty_transactions_type" AS ENUM('gain', 'utilisation', 'bonus_anniversaire', 'ajustement');
  CREATE TYPE "public"."enum_events_type" AS ENUM('soiree_theme', 'match', 'autre');
  CREATE TYPE "public"."enum_sms_logs_type" AS ENUM('confirmation', 'rappel', 'annulation', 'otp', 'anniversaire', 'offre');
  CREATE TYPE "public"."enum_sms_logs_category" AS ENUM('transactional', 'marketing');
  CREATE TYPE "public"."enum_sms_logs_status" AS ENUM('envoye', 'echec', 'demo');
  CREATE TABLE "reservations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ref" varchar,
  	"status" "enum_reservations_status" DEFAULT 'confirmee' NOT NULL,
  	"source" "enum_reservations_source" DEFAULT 'telephone',
  	"date" varchar NOT NULL,
  	"start_time" varchar NOT NULL,
  	"duration_min" numeric DEFAULT 120 NOT NULL,
  	"party_size" numeric NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"customer_id" integer,
  	"event_id" integer,
  	"notes" varchar,
  	"start_min" numeric,
  	"starts_at" timestamp(3) with time zone,
  	"sms_confirm_sent_at" timestamp(3) with time zone,
  	"sms_reminder_sent_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reservations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tables_id" integer
  );
  
  CREATE TABLE "orders_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"menu_item_id" integer,
  	"title" varchar NOT NULL,
  	"qty" numeric NOT NULL,
  	"unit_price" numeric NOT NULL,
  	"options" varchar,
  	"note" varchar
  );
  
  CREATE TABLE "orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" numeric NOT NULL,
  	"type" "enum_orders_type" DEFAULT 'table' NOT NULL,
  	"status" "enum_orders_status" DEFAULT 'recue' NOT NULL,
  	"service_date" varchar,
  	"table_id" integer,
  	"reservation_id" integer,
  	"customer_id" integer,
  	"scheduled_for" timestamp(3) with time zone,
  	"contact_name" varchar,
  	"contact_phone" varchar,
  	"note" varchar,
  	"total" numeric,
  	"payment_method" "enum_orders_payment_method" DEFAULT 'caisse',
  	"payment_status" "enum_orders_payment_status" DEFAULT 'a_regler',
  	"points_awarded" numeric DEFAULT 0,
  	"payment_provider" varchar,
  	"payment_ref" varchar,
  	"paid_at" timestamp(3) with time zone,
  	"served_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tables" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"zone" "enum_tables_zone" DEFAULT 'salle' NOT NULL,
  	"capacity_min" numeric DEFAULT 1 NOT NULL,
  	"capacity_max" numeric DEFAULT 4 NOT NULL,
  	"active" boolean DEFAULT true,
  	"qr_token" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "privatization_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"date" varchar NOT NULL,
  	"guests" numeric NOT NULL,
  	"occasion" varchar,
  	"message" varchar,
  	"status" "enum_privatization_requests_status" DEFAULT 'nouvelle',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"note" varchar,
  	"order" numeric DEFAULT 0,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_items_tags" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_menu_items_tags",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "menu_items_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"supplement" numeric DEFAULT 0
  );
  
  CREATE TABLE "menu_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"price" numeric NOT NULL,
  	"category_id" integer NOT NULL,
  	"image_id" integer,
  	"order" numeric DEFAULT 0,
  	"available" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "customers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"display_name" varchar,
  	"first_name" varchar,
  	"last_name" varchar,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"birthday_day" numeric,
  	"birthday_month" numeric,
  	"points" numeric DEFAULT 0,
  	"visits" numeric DEFAULT 0,
  	"opt_in_sms" boolean DEFAULT false,
  	"opt_in_email" boolean DEFAULT false,
  	"opt_in_date" timestamp(3) with time zone,
  	"last_birthday_bonus_year" numeric,
  	"last_activity_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "loyalty_transactions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"customer_id" integer NOT NULL,
  	"type" "enum_loyalty_transactions_type" DEFAULT 'utilisation' NOT NULL,
  	"reward_id" integer,
  	"points" numeric,
  	"reason" varchar,
  	"order_id" integer,
  	"created_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "rewards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"points_cost" numeric NOT NULL,
  	"description" varchar,
  	"active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "events" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"type" "enum_events_type" DEFAULT 'soiree_theme' NOT NULL,
  	"starts_at" timestamp(3) with time zone NOT NULL,
  	"ends_at" timestamp(3) with time zone,
  	"excerpt" varchar,
  	"cover_id" integer,
  	"description" jsonb,
  	"bookable" boolean DEFAULT false,
  	"capacity" numeric,
  	"published" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "sms_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"to" varchar NOT NULL,
  	"type" "enum_sms_logs_type" NOT NULL,
  	"category" "enum_sms_logs_category",
  	"status" "enum_sms_logs_status",
  	"segments" numeric,
  	"content" varchar,
  	"provider_id" varchar,
  	"error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "otp_codes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"consumed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "homepage_ambiance" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"image_id" integer
  );
  
  CREATE TABLE "homepage_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "homepage_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"author" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"rating" numeric DEFAULT 5
  );
  
  CREATE TABLE "homepage" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hero_kicker" varchar DEFAULT 'Restaurant lounge',
  	"hero_title" varchar DEFAULT 'Le Carré',
  	"hero_subtitle" varchar DEFAULT 'Cuisine, mocktails et soirées à Saint-Brice-sous-Forêt. Ouvert 7j/7 de 18h à 2h.',
  	"hero_image_id" integer,
  	"cta_title" varchar DEFAULT 'Votre table vous attend',
  	"cta_text" varchar DEFAULT 'Réservez en quelques secondes, confirmation immédiate par SMS.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reservations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "orders_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "tables_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "privatization_requests_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "customers_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "loyalty_transactions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "rewards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "events_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sms_logs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "otp_codes_id" integer;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations" ADD CONSTRAINT "reservations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reservations_rels" ADD CONSTRAINT "reservations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "reservations_rels" ADD CONSTRAINT "reservations_rels_tables_fk" FOREIGN KEY ("tables_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders_items" ADD CONSTRAINT "orders_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu_items_tags" ADD CONSTRAINT "menu_items_tags_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_items_options" ADD CONSTRAINT "menu_items_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "loyalty_transactions" ADD CONSTRAINT "loyalty_transactions_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "events" ADD CONSTRAINT "events_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_ambiance" ADD CONSTRAINT "homepage_ambiance_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_ambiance" ADD CONSTRAINT "homepage_ambiance_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_gallery" ADD CONSTRAINT "homepage_gallery_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "homepage_gallery" ADD CONSTRAINT "homepage_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage_reviews" ADD CONSTRAINT "homepage_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."homepage"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "homepage" ADD CONSTRAINT "homepage_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "reservations_ref_idx" ON "reservations" USING btree ("ref");
  CREATE INDEX "reservations_status_idx" ON "reservations" USING btree ("status");
  CREATE INDEX "reservations_date_idx" ON "reservations" USING btree ("date");
  CREATE INDEX "reservations_phone_idx" ON "reservations" USING btree ("phone");
  CREATE INDEX "reservations_customer_idx" ON "reservations" USING btree ("customer_id");
  CREATE INDEX "reservations_event_idx" ON "reservations" USING btree ("event_id");
  CREATE INDEX "reservations_starts_at_idx" ON "reservations" USING btree ("starts_at");
  CREATE INDEX "reservations_updated_at_idx" ON "reservations" USING btree ("updated_at");
  CREATE INDEX "reservations_created_at_idx" ON "reservations" USING btree ("created_at");
  CREATE INDEX "reservations_rels_order_idx" ON "reservations_rels" USING btree ("order");
  CREATE INDEX "reservations_rels_parent_idx" ON "reservations_rels" USING btree ("parent_id");
  CREATE INDEX "reservations_rels_path_idx" ON "reservations_rels" USING btree ("path");
  CREATE INDEX "reservations_rels_tables_id_idx" ON "reservations_rels" USING btree ("tables_id");
  CREATE INDEX "orders_items_order_idx" ON "orders_items" USING btree ("_order");
  CREATE INDEX "orders_items_parent_id_idx" ON "orders_items" USING btree ("_parent_id");
  CREATE INDEX "orders_items_menu_item_idx" ON "orders_items" USING btree ("menu_item_id");
  CREATE INDEX "orders_type_idx" ON "orders" USING btree ("type");
  CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");
  CREATE INDEX "orders_service_date_idx" ON "orders" USING btree ("service_date");
  CREATE INDEX "orders_table_idx" ON "orders" USING btree ("table_id");
  CREATE INDEX "orders_reservation_idx" ON "orders" USING btree ("reservation_id");
  CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");
  CREATE INDEX "orders_scheduled_for_idx" ON "orders" USING btree ("scheduled_for");
  CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");
  CREATE INDEX "orders_payment_ref_idx" ON "orders" USING btree ("payment_ref");
  CREATE INDEX "orders_updated_at_idx" ON "orders" USING btree ("updated_at");
  CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");
  CREATE UNIQUE INDEX "tables_code_idx" ON "tables" USING btree ("code");
  CREATE INDEX "tables_updated_at_idx" ON "tables" USING btree ("updated_at");
  CREATE INDEX "tables_created_at_idx" ON "tables" USING btree ("created_at");
  CREATE INDEX "privatization_requests_status_idx" ON "privatization_requests" USING btree ("status");
  CREATE INDEX "privatization_requests_updated_at_idx" ON "privatization_requests" USING btree ("updated_at");
  CREATE INDEX "privatization_requests_created_at_idx" ON "privatization_requests" USING btree ("created_at");
  CREATE UNIQUE INDEX "menu_categories_slug_idx" ON "menu_categories" USING btree ("slug");
  CREATE INDEX "menu_categories_updated_at_idx" ON "menu_categories" USING btree ("updated_at");
  CREATE INDEX "menu_categories_created_at_idx" ON "menu_categories" USING btree ("created_at");
  CREATE INDEX "menu_items_tags_order_idx" ON "menu_items_tags" USING btree ("order");
  CREATE INDEX "menu_items_tags_parent_idx" ON "menu_items_tags" USING btree ("parent_id");
  CREATE INDEX "menu_items_options_order_idx" ON "menu_items_options" USING btree ("_order");
  CREATE INDEX "menu_items_options_parent_id_idx" ON "menu_items_options" USING btree ("_parent_id");
  CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category_id");
  CREATE INDEX "menu_items_image_idx" ON "menu_items" USING btree ("image_id");
  CREATE INDEX "menu_items_available_idx" ON "menu_items" USING btree ("available");
  CREATE INDEX "menu_items_updated_at_idx" ON "menu_items" USING btree ("updated_at");
  CREATE INDEX "menu_items_created_at_idx" ON "menu_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "customers_phone_idx" ON "customers" USING btree ("phone");
  CREATE INDEX "customers_updated_at_idx" ON "customers" USING btree ("updated_at");
  CREATE INDEX "customers_created_at_idx" ON "customers" USING btree ("created_at");
  CREATE INDEX "loyalty_transactions_customer_idx" ON "loyalty_transactions" USING btree ("customer_id");
  CREATE INDEX "loyalty_transactions_reward_idx" ON "loyalty_transactions" USING btree ("reward_id");
  CREATE INDEX "loyalty_transactions_order_idx" ON "loyalty_transactions" USING btree ("order_id");
  CREATE INDEX "loyalty_transactions_created_by_idx" ON "loyalty_transactions" USING btree ("created_by_id");
  CREATE INDEX "loyalty_transactions_updated_at_idx" ON "loyalty_transactions" USING btree ("updated_at");
  CREATE INDEX "loyalty_transactions_created_at_idx" ON "loyalty_transactions" USING btree ("created_at");
  CREATE INDEX "rewards_updated_at_idx" ON "rewards" USING btree ("updated_at");
  CREATE INDEX "rewards_created_at_idx" ON "rewards" USING btree ("created_at");
  CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");
  CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");
  CREATE INDEX "events_cover_idx" ON "events" USING btree ("cover_id");
  CREATE INDEX "events_updated_at_idx" ON "events" USING btree ("updated_at");
  CREATE INDEX "events_created_at_idx" ON "events" USING btree ("created_at");
  CREATE INDEX "sms_logs_updated_at_idx" ON "sms_logs" USING btree ("updated_at");
  CREATE INDEX "sms_logs_created_at_idx" ON "sms_logs" USING btree ("created_at");
  CREATE INDEX "otp_codes_phone_idx" ON "otp_codes" USING btree ("phone");
  CREATE INDEX "otp_codes_updated_at_idx" ON "otp_codes" USING btree ("updated_at");
  CREATE INDEX "otp_codes_created_at_idx" ON "otp_codes" USING btree ("created_at");
  CREATE INDEX "homepage_ambiance_order_idx" ON "homepage_ambiance" USING btree ("_order");
  CREATE INDEX "homepage_ambiance_parent_id_idx" ON "homepage_ambiance" USING btree ("_parent_id");
  CREATE INDEX "homepage_ambiance_image_idx" ON "homepage_ambiance" USING btree ("image_id");
  CREATE INDEX "homepage_gallery_order_idx" ON "homepage_gallery" USING btree ("_order");
  CREATE INDEX "homepage_gallery_parent_id_idx" ON "homepage_gallery" USING btree ("_parent_id");
  CREATE INDEX "homepage_gallery_image_idx" ON "homepage_gallery" USING btree ("image_id");
  CREATE INDEX "homepage_reviews_order_idx" ON "homepage_reviews" USING btree ("_order");
  CREATE INDEX "homepage_reviews_parent_id_idx" ON "homepage_reviews" USING btree ("_parent_id");
  CREATE INDEX "homepage_hero_image_idx" ON "homepage" USING btree ("hero_image_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservations_fk" FOREIGN KEY ("reservations_id") REFERENCES "public"."reservations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_orders_fk" FOREIGN KEY ("orders_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tables_fk" FOREIGN KEY ("tables_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_privatization_requests_fk" FOREIGN KEY ("privatization_requests_id") REFERENCES "public"."privatization_requests"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_categories_fk" FOREIGN KEY ("menu_categories_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_items_fk" FOREIGN KEY ("menu_items_id") REFERENCES "public"."menu_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_customers_fk" FOREIGN KEY ("customers_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_loyalty_transactions_fk" FOREIGN KEY ("loyalty_transactions_id") REFERENCES "public"."loyalty_transactions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_rewards_fk" FOREIGN KEY ("rewards_id") REFERENCES "public"."rewards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_events_fk" FOREIGN KEY ("events_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sms_logs_fk" FOREIGN KEY ("sms_logs_id") REFERENCES "public"."sms_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_otp_codes_fk" FOREIGN KEY ("otp_codes_id") REFERENCES "public"."otp_codes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_reservations_id_idx" ON "payload_locked_documents_rels" USING btree ("reservations_id");
  CREATE INDEX "payload_locked_documents_rels_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("orders_id");
  CREATE INDEX "payload_locked_documents_rels_tables_id_idx" ON "payload_locked_documents_rels" USING btree ("tables_id");
  CREATE INDEX "payload_locked_documents_rels_privatization_requests_id_idx" ON "payload_locked_documents_rels" USING btree ("privatization_requests_id");
  CREATE INDEX "payload_locked_documents_rels_menu_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_categories_id");
  CREATE INDEX "payload_locked_documents_rels_menu_items_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_items_id");
  CREATE INDEX "payload_locked_documents_rels_customers_id_idx" ON "payload_locked_documents_rels" USING btree ("customers_id");
  CREATE INDEX "payload_locked_documents_rels_loyalty_transactions_id_idx" ON "payload_locked_documents_rels" USING btree ("loyalty_transactions_id");
  CREATE INDEX "payload_locked_documents_rels_rewards_id_idx" ON "payload_locked_documents_rels" USING btree ("rewards_id");
  CREATE INDEX "payload_locked_documents_rels_events_id_idx" ON "payload_locked_documents_rels" USING btree ("events_id");
  CREATE INDEX "payload_locked_documents_rels_sms_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("sms_logs_id");
  CREATE INDEX "payload_locked_documents_rels_otp_codes_id_idx" ON "payload_locked_documents_rels" USING btree ("otp_codes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "reservations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "reservations_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "orders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "privatization_requests" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_items_tags" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_items_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "customers" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "loyalty_transactions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "rewards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sms_logs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "otp_codes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_ambiance" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "homepage" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "reservations" CASCADE;
  DROP TABLE "reservations_rels" CASCADE;
  DROP TABLE "orders_items" CASCADE;
  DROP TABLE "orders" CASCADE;
  DROP TABLE "tables" CASCADE;
  DROP TABLE "privatization_requests" CASCADE;
  DROP TABLE "menu_categories" CASCADE;
  DROP TABLE "menu_items_tags" CASCADE;
  DROP TABLE "menu_items_options" CASCADE;
  DROP TABLE "menu_items" CASCADE;
  DROP TABLE "customers" CASCADE;
  DROP TABLE "loyalty_transactions" CASCADE;
  DROP TABLE "rewards" CASCADE;
  DROP TABLE "events" CASCADE;
  DROP TABLE "sms_logs" CASCADE;
  DROP TABLE "otp_codes" CASCADE;
  DROP TABLE "homepage_ambiance" CASCADE;
  DROP TABLE "homepage_gallery" CASCADE;
  DROP TABLE "homepage_reviews" CASCADE;
  DROP TABLE "homepage" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reservations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_orders_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_tables_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_privatization_requests_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_menu_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_menu_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_customers_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_loyalty_transactions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_rewards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_events_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_sms_logs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_otp_codes_fk";
  
  DROP INDEX "payload_locked_documents_rels_reservations_id_idx";
  DROP INDEX "payload_locked_documents_rels_orders_id_idx";
  DROP INDEX "payload_locked_documents_rels_tables_id_idx";
  DROP INDEX "payload_locked_documents_rels_privatization_requests_id_idx";
  DROP INDEX "payload_locked_documents_rels_menu_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_menu_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_customers_id_idx";
  DROP INDEX "payload_locked_documents_rels_loyalty_transactions_id_idx";
  DROP INDEX "payload_locked_documents_rels_rewards_id_idx";
  DROP INDEX "payload_locked_documents_rels_events_id_idx";
  DROP INDEX "payload_locked_documents_rels_sms_logs_id_idx";
  DROP INDEX "payload_locked_documents_rels_otp_codes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "reservations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "orders_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "tables_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "privatization_requests_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "menu_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "menu_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "customers_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "loyalty_transactions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "rewards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "events_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "sms_logs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "otp_codes_id";
  DROP TYPE "public"."enum_reservations_status";
  DROP TYPE "public"."enum_reservations_source";
  DROP TYPE "public"."enum_orders_type";
  DROP TYPE "public"."enum_orders_status";
  DROP TYPE "public"."enum_orders_payment_method";
  DROP TYPE "public"."enum_orders_payment_status";
  DROP TYPE "public"."enum_tables_zone";
  DROP TYPE "public"."enum_privatization_requests_status";
  DROP TYPE "public"."enum_menu_items_tags";
  DROP TYPE "public"."enum_loyalty_transactions_type";
  DROP TYPE "public"."enum_events_type";
  DROP TYPE "public"."enum_sms_logs_type";
  DROP TYPE "public"."enum_sms_logs_category";
  DROP TYPE "public"."enum_sms_logs_status";`)
}
