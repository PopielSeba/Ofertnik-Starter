CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_name" varchar NOT NULL,
	"nip" varchar,
	"contact_person" varchar,
	"phone" varchar,
	"email" varchar,
	"address" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"category_id" integer NOT NULL,
	"description" text,
	"model" varchar,
	"power" varchar,
	"fuel_consumption_75" numeric(6, 2),
	"dimensions" varchar,
	"weight" varchar,
	"engine" varchar,
	"alternator" varchar,
	"fuel_tank_capacity" integer,
	"image_url" varchar,
	"quantity" integer DEFAULT 0 NOT NULL,
	"available_quantity" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_additional" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"type" varchar NOT NULL,
	"name" varchar NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"position" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "equipment_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "equipment_pricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"period_start" integer NOT NULL,
	"period_end" integer,
	"price_per_day" numeric(10, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "equipment_service_costs" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"service_interval_months" integer DEFAULT 12,
	"service_interval_km" integer,
	"service_interval_motohours" integer,
	"worker_hours" numeric(4, 1) DEFAULT '2.0' NOT NULL,
	"worker_cost_per_hour" numeric(8, 2) DEFAULT '100.00' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "equipment_service_costs_equipment_id_unique" UNIQUE("equipment_id")
);
--> statement-breakpoint
CREATE TABLE "equipment_service_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"equipment_id" integer NOT NULL,
	"item_name" varchar NOT NULL,
	"item_cost" numeric(8, 2) DEFAULT '0.00' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "needs_assessment_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar NOT NULL,
	"question" text NOT NULL,
	"type" varchar DEFAULT 'text' NOT NULL,
	"options" jsonb,
	"is_required" boolean DEFAULT false,
	"position" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "needs_assessment_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"response_number" varchar NOT NULL,
	"client_company_name" varchar,
	"client_contact_person" varchar,
	"client_phone" varchar,
	"client_email" varchar,
	"client_address" text,
	"responses" jsonb NOT NULL,
	"user_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "needs_assessment_responses_response_number_unique" UNIQUE("response_number")
);
--> statement-breakpoint
CREATE TABLE "pricing_schemas" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"calculation_method" varchar DEFAULT 'progressive' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "pricing_schemas_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_id" integer NOT NULL,
	"equipment_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"rental_period_days" integer NOT NULL,
	"price_per_day" numeric(10, 2) NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"fuel_consumption_lh" numeric(5, 2),
	"fuel_price_per_liter" numeric(6, 2),
	"hours_per_day" integer DEFAULT 8,
	"total_fuel_cost" numeric(12, 2) DEFAULT '0',
	"include_fuel_cost" boolean DEFAULT false,
	"fuel_consumption_per_100km" numeric(5, 2),
	"kilometers_per_day" integer,
	"include_maintenance_cost" boolean DEFAULT false,
	"maintenance_interval_hours" integer DEFAULT 500,
	"maintenance_interval_km" integer,
	"calculation_type" varchar DEFAULT 'motohours',
	"fuel_filter_1_cost" numeric(8, 2) DEFAULT '49.00',
	"fuel_filter_2_cost" numeric(8, 2) DEFAULT '118.00',
	"oil_filter_cost" numeric(8, 2) DEFAULT '45.00',
	"air_filter_1_cost" numeric(8, 2) DEFAULT '105.00',
	"air_filter_2_cost" numeric(8, 2) DEFAULT '54.00',
	"engine_filter_cost" numeric(8, 2) DEFAULT '150.00',
	"oil_cost" numeric(8, 2) DEFAULT '162.44',
	"oil_quantity_liters" numeric(5, 1) DEFAULT '14.7',
	"service_work_hours" numeric(4, 1) DEFAULT '2',
	"service_work_rate_per_hour" numeric(8, 2) DEFAULT '100.00',
	"service_travel_distance_km" numeric(8, 2) DEFAULT '31',
	"service_travel_rate_per_km" numeric(6, 2) DEFAULT '1.15',
	"total_maintenance_cost" numeric(12, 2) DEFAULT '0',
	"expected_maintenance_hours" integer,
	"include_installation_cost" boolean DEFAULT false,
	"installation_distance_km" numeric(8, 2),
	"number_of_technicians" integer DEFAULT 1,
	"service_rate_per_technician" numeric(8, 2) DEFAULT '150',
	"travel_rate_per_km" numeric(6, 2) DEFAULT '1.15',
	"total_installation_cost" numeric(10, 2) DEFAULT '0',
	"include_disassembly_cost" boolean DEFAULT false,
	"disassembly_distance_km" numeric(8, 2),
	"disassembly_number_of_technicians" integer DEFAULT 1,
	"disassembly_service_rate_per_technician" numeric(8, 2) DEFAULT '150',
	"disassembly_travel_rate_per_km" numeric(6, 2) DEFAULT '1.15',
	"total_disassembly_cost" numeric(10, 2) DEFAULT '0',
	"include_travel_service_cost" boolean DEFAULT false,
	"travel_service_distance_km" numeric(8, 2),
	"travel_service_number_of_technicians" integer DEFAULT 1,
	"travel_service_service_rate_per_technician" numeric(8, 2) DEFAULT '150',
	"travel_service_travel_rate_per_km" numeric(6, 2) DEFAULT '1.15',
	"travel_service_number_of_trips" integer DEFAULT 1,
	"total_travel_service_cost" numeric(10, 2) DEFAULT '0',
	"include_travel_cost" boolean DEFAULT false,
	"travel_distance_km" numeric(8, 2),
	"hourly_rate_per_technician" numeric(8, 2) DEFAULT '150',
	"total_travel_cost" numeric(10, 2) DEFAULT '0',
	"include_service_items" boolean DEFAULT false,
	"service_item_1_cost" numeric(8, 2) DEFAULT '0.00',
	"service_item_2_cost" numeric(8, 2) DEFAULT '0.00',
	"service_item_3_cost" numeric(8, 2) DEFAULT '0.00',
	"service_item_4_cost" numeric(8, 2) DEFAULT '0.00',
	"total_service_items_cost" numeric(10, 2) DEFAULT '0.00',
	"additional_cost" numeric(10, 2) DEFAULT '0.00',
	"accessories_cost" numeric(10, 2) DEFAULT '0.00',
	"notes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" serial PRIMARY KEY NOT NULL,
	"quote_number" varchar NOT NULL,
	"client_id" integer NOT NULL,
	"created_by_id" varchar,
	"is_guest_quote" boolean DEFAULT false NOT NULL,
	"guest_email" varchar,
	"pricing_schema_id" integer,
	"status" varchar DEFAULT 'draft' NOT NULL,
	"total_net" numeric(12, 2) NOT NULL,
	"vat_rate" numeric(5, 2) DEFAULT '23' NOT NULL,
	"total_gross" numeric(12, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "quotes_quote_number_unique" UNIQUE("quote_number")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"role" varchar DEFAULT 'employee' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_approved" boolean DEFAULT false NOT NULL,
	"approved_at" timestamp,
	"approved_by_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_category_id_equipment_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."equipment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_additional" ADD CONSTRAINT "equipment_additional_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_pricing" ADD CONSTRAINT "equipment_pricing_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_service_costs" ADD CONSTRAINT "equipment_service_costs_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_service_items" ADD CONSTRAINT "equipment_service_items_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "needs_assessment_responses" ADD CONSTRAINT "needs_assessment_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_pricing_schema_id_pricing_schemas_id_fk" FOREIGN KEY ("pricing_schema_id") REFERENCES "public"."pricing_schemas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");