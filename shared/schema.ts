import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("employee"), // admin, kierownik, employee
  isActive: boolean("is_active").default(true).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(), // admin approval required
  approvedAt: timestamp("approved_at"),
  approvedById: varchar("approved_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Equipment categories
export const equipmentCategories = pgTable("equipment_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment items
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  categoryId: integer("category_id").references(() => equipmentCategories.id).notNull(),
  description: text("description"),
  model: varchar("model"),
  power: varchar("power"), // e.g., "90.18 kW", "235 kW"
  // Additional technical specifications for generators
  fuelConsumption75: decimal("fuel_consumption_75", { precision: 6, scale: 2 }), // l/h at 75% load
  dimensions: varchar("dimensions"), // LxWxH in mm
  weight: varchar("weight"), // in kg
  engine: varchar("engine"), // engine manufacturer/model
  alternator: varchar("alternator"), // alternator info
  fuelTankCapacity: integer("fuel_tank_capacity"), // liters
  imageUrl: varchar("image_url"), // equipment image URL

  quantity: integer("quantity").notNull().default(0),
  availableQuantity: integer("available_quantity").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing tiers for different rental periods
export const equipmentPricing = pgTable("equipment_pricing", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  periodStart: integer("period_start").notNull(), // days
  periodEnd: integer("period_end"), // days, null for 30+
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Equipment additional equipment and accessories
export const equipmentAdditional = pgTable("equipment_additional", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  type: varchar("type").notNull(), // "additional" or "accessories"
  name: varchar("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  position: integer("position").notNull().default(1), // 1-4 for ordering
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients/Customers
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name").notNull(),
  nip: varchar("nip"),
  contactPerson: varchar("contact_person"),
  phone: varchar("phone"),
  email: varchar("email"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Pricing tiers/schemas - define different pricing strategies
export const pricingSchemas = pgTable("pricing_schemas", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(), // e.g., "Rabat od pierwszego dnia", "Rabat progowy"
  description: text("description"),
  calculationMethod: varchar("calculation_method").notNull().default("progressive"), // "first_day" or "progressive"
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Keys for external access
export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(), // e.g., "Website Integration", "Partner API"
  keyValue: varchar("key_value").notNull().unique(),
  isActive: boolean("is_active").default(true).notNull(),
  permissions: jsonb("permissions").notNull().default(JSON.stringify(["quotes:create", "assessments:create"])), // array of permissions
  createdAt: timestamp("created_at").defaultNow(),
  createdById: varchar("created_by_id").references(() => users.id),
  lastUsedAt: timestamp("last_used_at"),
});

// Progressive pricing tiers for each pricing schema


// Quotes
export const quotes = pgTable("quotes", {
  id: serial("id").primaryKey(),
  quoteNumber: varchar("quote_number").notNull().unique(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  createdById: varchar("created_by_id").references(() => users.id),
  isGuestQuote: boolean("is_guest_quote").default(false).notNull(),
  guestEmail: varchar("guest_email"),
  pricingSchemaId: integer("pricing_schema_id").references(() => pricingSchemas.id),
  status: varchar("status").notNull().default("draft"), // draft, pending, approved, rejected
  totalNet: decimal("total_net", { precision: 12, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).notNull().default("23"),
  totalGross: decimal("total_gross", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});



// Quote items
export const quoteItems = pgTable("quote_items", {
  id: serial("id").primaryKey(),
  quoteId: integer("quote_id").references(() => quotes.id).notNull(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  quantity: integer("quantity").notNull(),
  rentalPeriodDays: integer("rental_period_days").notNull(),
  pricePerDay: decimal("price_per_day", { precision: 10, scale: 2 }).notNull(),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  // Fuel cost fields for generators (motohours-based)
  fuelConsumptionLH: decimal("fuel_consumption_lh", { precision: 5, scale: 2 }), // liters per hour
  fuelPricePerLiter: decimal("fuel_price_per_liter", { precision: 6, scale: 2 }), // PLN per liter
  hoursPerDay: integer("hours_per_day").default(8), // operating hours per day
  totalFuelCost: decimal("total_fuel_cost", { precision: 12, scale: 2 }).default("0"),
  includeFuelCost: boolean("include_fuel_cost").default(false),
  // Fuel cost fields for vehicles (kilometers-based)
  fuelConsumptionPer100km: decimal("fuel_consumption_per_100km", { precision: 5, scale: 2 }), // liters per 100km for vehicles
  kilometersPerDay: integer("kilometers_per_day"), // kilometers driven per day
  // Maintenance/exploitation cost fields for generators (every 500 mth)
  includeMaintenanceCost: boolean("include_maintenance_cost").default(false),
  maintenanceIntervalHours: integer("maintenance_interval_hours").default(500), // every 500 mth for generators
  maintenanceIntervalKm: integer("maintenance_interval_km"), // service interval in kilometers for vehicles
  calculationType: varchar("calculation_type").default("motohours"), // 'motohours' or 'kilometers'
  // Filter costs (6 filters)
  fuelFilter1Cost: decimal("fuel_filter_1_cost", { precision: 8, scale: 2 }).default("49.00"),
  fuelFilter2Cost: decimal("fuel_filter_2_cost", { precision: 8, scale: 2 }).default("118.00"),
  oilFilterCost: decimal("oil_filter_cost", { precision: 8, scale: 2 }).default("45.00"),
  airFilter1Cost: decimal("air_filter_1_cost", { precision: 8, scale: 2 }).default("105.00"),
  airFilter2Cost: decimal("air_filter_2_cost", { precision: 8, scale: 2 }).default("54.00"),
  engineFilterCost: decimal("engine_filter_cost", { precision: 8, scale: 2 }).default("150.00"),
  // Oil cost
  oilCost: decimal("oil_cost", { precision: 8, scale: 2 }).default("162.44"),
  oilQuantityLiters: decimal("oil_quantity_liters", { precision: 5, scale: 1 }).default("14.7"),
  // Service work cost
  serviceWorkHours: decimal("service_work_hours", { precision: 4, scale: 1 }).default("2"),
  serviceWorkRatePerHour: decimal("service_work_rate_per_hour", { precision: 8, scale: 2 }).default("100.00"),
  // Service travel cost
  serviceTravelDistanceKm: decimal("service_travel_distance_km", { precision: 8, scale: 2 }).default("31"),
  serviceTravelRatePerKm: decimal("service_travel_rate_per_km", { precision: 6, scale: 2 }).default("1.15"),
  // Total maintenance cost for the rental period
  totalMaintenanceCost: decimal("total_maintenance_cost", { precision: 12, scale: 2 }).default("0"),
  expectedMaintenanceHours: integer("expected_maintenance_hours"), // expected operating hours for the rental period
  // Installation cost fields
  includeInstallationCost: boolean("include_installation_cost").default(false),
  installationDistanceKm: decimal("installation_distance_km", { precision: 8, scale: 2 }),
  numberOfTechnicians: integer("number_of_technicians").default(1),
  serviceRatePerTechnician: decimal("service_rate_per_technician", { precision: 8, scale: 2 }).default("150"),
  travelRatePerKm: decimal("travel_rate_per_km", { precision: 6, scale: 2 }).default("1.15"),
  totalInstallationCost: decimal("total_installation_cost", { precision: 10, scale: 2 }).default("0"),
  
  // Disassembly cost fields
  includeDisassemblyCost: boolean("include_disassembly_cost").default(false),
  disassemblyDistanceKm: decimal("disassembly_distance_km", { precision: 8, scale: 2 }),
  disassemblyNumberOfTechnicians: integer("disassembly_number_of_technicians").default(1),
  disassemblyServiceRatePerTechnician: decimal("disassembly_service_rate_per_technician", { precision: 8, scale: 2 }).default("150"),
  disassemblyTravelRatePerKm: decimal("disassembly_travel_rate_per_km", { precision: 6, scale: 2 }).default("1.15"),
  totalDisassemblyCost: decimal("total_disassembly_cost", { precision: 10, scale: 2 }).default("0"),
  
  // Travel/Service cost fields
  includeTravelServiceCost: boolean("include_travel_service_cost").default(false),
  travelServiceDistanceKm: decimal("travel_service_distance_km", { precision: 8, scale: 2 }),
  travelServiceNumberOfTechnicians: integer("travel_service_number_of_technicians").default(1),
  travelServiceServiceRatePerTechnician: decimal("travel_service_service_rate_per_technician", { precision: 8, scale: 2 }).default("150"),
  travelServiceTravelRatePerKm: decimal("travel_service_travel_rate_per_km", { precision: 6, scale: 2 }).default("1.15"),
  travelServiceNumberOfTrips: integer("travel_service_number_of_trips").default(1),
  totalTravelServiceCost: decimal("total_travel_service_cost", { precision: 10, scale: 2 }).default("0"),
  
  // Legacy travel cost fields (keeping for backward compatibility)
  includeTravelCost: boolean("include_travel_cost").default(false),
  travelDistanceKm: decimal("travel_distance_km", { precision: 8, scale: 2 }),
  hourlyRatePerTechnician: decimal("hourly_rate_per_technician", { precision: 8, scale: 2 }).default("150"),
  totalTravelCost: decimal("total_travel_cost", { precision: 10, scale: 2 }).default("0"),
  // Service items for heaters
  includeServiceItems: boolean("include_service_items").default(false),
  serviceItem1Cost: decimal("service_item_1_cost", { precision: 8, scale: 2 }).default("0.00"),
  serviceItem2Cost: decimal("service_item_2_cost", { precision: 8, scale: 2 }).default("0.00"),
  serviceItem3Cost: decimal("service_item_3_cost", { precision: 8, scale: 2 }).default("0.00"),
  serviceItem4Cost: decimal("service_item_4_cost", { precision: 8, scale: 2 }).default("0.00"),
  totalServiceItemsCost: decimal("total_service_items_cost", { precision: 10, scale: 2 }).default("0.00"),
  // Additional equipment tracking
  additionalCost: decimal("additional_cost", { precision: 10, scale: 2 }).default("0.00"),
  accessoriesCost: decimal("accessories_cost", { precision: 10, scale: 2 }).default("0.00"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Service cost configuration for equipment
export const equipmentServiceCosts = pgTable("equipment_service_costs", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull().unique(),
  serviceIntervalMonths: integer("service_interval_months").default(12), // How often service is required for traditional equipment (months)
  serviceIntervalKm: integer("service_interval_km"), // Service interval in kilometers for vehicles
  serviceIntervalMotohours: integer("service_interval_motohours"), // Service interval in motohours for generators and lighting towers
  workerHours: decimal("worker_hours", { precision: 4, scale: 1 }).default("2.0").notNull(), // Fixed field name
  workerCostPerHour: decimal("worker_cost_per_hour", { precision: 8, scale: 2 }).default("100.00").notNull(), // Fixed field name
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Service items for equipment (configurable by admin)
export const equipmentServiceItems = pgTable("equipment_service_items", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").references(() => equipment.id).notNull(),
  itemName: varchar("item_name").notNull(), // e.g., "Filtr paliwa 1", "Filtr oleju", "Wymiana oleju"
  itemCost: decimal("item_cost", { precision: 8, scale: 2 }).default("0.00").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Needs Assessment Questions
export const needsAssessmentQuestions = pgTable("needs_assessment_questions", {
  id: serial("id").primaryKey(),
  category: varchar("category").notNull(), // "Informacje ogólne", "Warunki otoczenia", etc.
  question: text("question").notNull(),
  type: varchar("type").notNull().default("text"), // text, select, checkbox, radio, textarea
  options: jsonb("options"), // for select/radio/checkbox options
  isRequired: boolean("is_required").default(false),
  position: integer("position").default(0),
  isActive: boolean("is_active").default(true),
  categoryType: varchar("category_type").notNull().default("general"), // "general" or "equipment"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Needs Assessment Responses
export const needsAssessmentResponses = pgTable("needs_assessment_responses", {
  id: serial("id").primaryKey(),
  responseNumber: varchar("response_number").notNull().unique(),
  clientCompanyName: varchar("client_company_name"),
  clientContactPerson: varchar("client_contact_person"),
  clientPhone: varchar("client_phone"),
  clientEmail: varchar("client_email"),
  clientAddress: text("client_address"),
  responses: jsonb("responses").notNull(), // { questionId: answer }
  userId: varchar("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  category: one(equipmentCategories, {
    fields: [equipment.categoryId],
    references: [equipmentCategories.id],
  }),
  pricing: many(equipmentPricing),
  quoteItems: many(quoteItems),
  additionalEquipment: many(equipmentAdditional),
  serviceCosts: one(equipmentServiceCosts, {
    fields: [equipment.id],
    references: [equipmentServiceCosts.equipmentId],
  }),
  serviceItems: many(equipmentServiceItems),
}));

export const equipmentAdditionalRelations = relations(equipmentAdditional, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentAdditional.equipmentId],
    references: [equipment.id],
  }),
}));

export const equipmentCategoriesRelations = relations(equipmentCategories, ({ many }) => ({
  equipment: many(equipment),
}));

export const equipmentPricingRelations = relations(equipmentPricing, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentPricing.equipmentId],
    references: [equipment.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  quotes: many(quotes),
}));

export const pricingSchemasRelations = relations(pricingSchemas, ({ many }) => ({
  quotes: many(quotes),
}));



export const quotesRelations = relations(quotes, ({ one, many }) => ({
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [quotes.createdById],
    references: [users.id],
  }),
  pricingSchema: one(pricingSchemas, {
    fields: [quotes.pricingSchemaId],
    references: [pricingSchemas.id],
  }),
  items: many(quoteItems),
}));

export const quoteItemsRelations = relations(quoteItems, ({ one }) => ({
  quote: one(quotes, {
    fields: [quoteItems.quoteId],
    references: [quotes.id],
  }),
  equipment: one(equipment, {
    fields: [quoteItems.equipmentId],
    references: [equipment.id],
  }),
}));

export const equipmentServiceCostsRelations = relations(equipmentServiceCosts, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentServiceCosts.equipmentId],
    references: [equipment.id],
  }),
}));

export const equipmentServiceItemsRelations = relations(equipmentServiceItems, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentServiceItems.equipmentId],
    references: [equipment.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  quotes: many(quotes),
  needsAssessmentResponses: many(needsAssessmentResponses),
}));

export const needsAssessmentResponsesRelations = relations(needsAssessmentResponses, ({ one }) => ({
  user: one(users, {
    fields: [needsAssessmentResponses.userId],
    references: [users.id],
  }),
}));

// Insert and select schemas
export const insertUserSchema = createInsertSchema(users);
export const insertEquipmentCategorySchema = createInsertSchema(equipmentCategories);
export const insertEquipmentSchema = createInsertSchema(equipment).extend({
  fuelConsumption75: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null) return undefined;
    return typeof val === 'number' ? val.toString() : val;
  }),
  fuelTankCapacity: z.union([z.string(), z.number()]).optional().transform((val) => {
    if (val === undefined || val === null) return undefined;
    return typeof val === 'number' ? val : parseInt(val?.toString() || '0') || undefined;
  }),
});
export const insertEquipmentPricingSchema = createInsertSchema(equipmentPricing);
export const insertClientSchema = createInsertSchema(clients);
export const insertQuoteSchema = createInsertSchema(quotes);
export const insertQuoteItemSchema = createInsertSchema(quoteItems);

export const insertEquipmentAdditionalSchema = createInsertSchema(equipmentAdditional);
export const insertPricingSchemaSchema = createInsertSchema(pricingSchemas);
export const insertEquipmentServiceCostsSchema = createInsertSchema(equipmentServiceCosts);
export const insertEquipmentServiceItemsSchema = createInsertSchema(equipmentServiceItems);
export const insertNeedsAssessmentQuestionSchema = createInsertSchema(needsAssessmentQuestions);
export const insertNeedsAssessmentResponseSchema = createInsertSchema(needsAssessmentResponses).omit({
  id: true,
  responseNumber: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users);
export const selectEquipmentCategorySchema = createSelectSchema(equipmentCategories);
export const selectEquipmentSchema = createSelectSchema(equipment);
export const selectEquipmentPricingSchema = createSelectSchema(equipmentPricing);
export const selectClientSchema = createSelectSchema(clients);
export const selectQuoteSchema = createSelectSchema(quotes);
export const selectQuoteItemSchema = createSelectSchema(quoteItems);

export const selectEquipmentAdditionalSchema = createSelectSchema(equipmentAdditional);
export const selectPricingSchemaSchema = createSelectSchema(pricingSchemas);
export const selectEquipmentServiceCostsSchema = createSelectSchema(equipmentServiceCosts);
export const selectEquipmentServiceItemsSchema = createSelectSchema(equipmentServiceItems);
export const selectNeedsAssessmentQuestionSchema = createSelectSchema(needsAssessmentQuestions);
export const selectNeedsAssessmentResponseSchema = createSelectSchema(needsAssessmentResponses);


// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof selectUserSchema>;
export type InsertEquipmentCategory = z.infer<typeof insertEquipmentCategorySchema>;
export type EquipmentCategory = z.infer<typeof selectEquipmentCategorySchema>;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type Equipment = z.infer<typeof selectEquipmentSchema>;
export type InsertEquipmentPricing = z.infer<typeof insertEquipmentPricingSchema>;
export type EquipmentPricing = z.infer<typeof selectEquipmentPricingSchema>;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = z.infer<typeof selectClientSchema>;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;
export type Quote = z.infer<typeof selectQuoteSchema>;
export type InsertQuoteItem = z.infer<typeof insertQuoteItemSchema>;
export type QuoteItem = z.infer<typeof selectQuoteItemSchema>;

export type InsertEquipmentAdditional = z.infer<typeof insertEquipmentAdditionalSchema>;
export type EquipmentAdditional = z.infer<typeof selectEquipmentAdditionalSchema>;
export type InsertPricingSchema = z.infer<typeof insertPricingSchemaSchema>;
export type PricingSchema = typeof pricingSchemas.$inferSelect;

export type InsertEquipmentServiceCosts = z.infer<typeof insertEquipmentServiceCostsSchema>;
export type EquipmentServiceCosts = z.infer<typeof selectEquipmentServiceCostsSchema>;
export type InsertEquipmentServiceItems = z.infer<typeof insertEquipmentServiceItemsSchema>;
export type EquipmentServiceItems = z.infer<typeof selectEquipmentServiceItemsSchema>;
export type InsertNeedsAssessmentQuestion = z.infer<typeof insertNeedsAssessmentQuestionSchema>;
export type NeedsAssessmentQuestion = z.infer<typeof selectNeedsAssessmentQuestionSchema>;
export type InsertNeedsAssessmentResponse = z.infer<typeof insertNeedsAssessmentResponseSchema>;
export type NeedsAssessmentResponse = z.infer<typeof selectNeedsAssessmentResponseSchema>;

// API Keys schema
export const insertApiKeySchema = createInsertSchema(apiKeys, {
  permissions: z.array(z.string()),
}).omit({
  id: true,
  createdAt: true,
  lastUsedAt: true,
});

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type SelectApiKey = typeof apiKeys.$inferSelect;

// Public API schemas for external usage
export const publicQuoteSchema = z.object({
  clientCompanyName: z.string().min(1, "Nazwa firmy jest wymagana"),
  clientContactPerson: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
  equipment: z.array(z.object({
    equipmentId: z.number(),
    quantity: z.number().min(1),
    rentalPeriod: z.number().min(1),
  })),
  additionalEquipment: z.array(z.object({
    equipmentId: z.number(),
    additionalId: z.number(),
    quantity: z.number().min(1),
  })).optional(),
});

export const publicAssessmentSchema = z.object({
  clientCompanyName: z.string().min(1, "Nazwa firmy jest wymagana"),
  clientContactPerson: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().email().optional(),
  clientAddress: z.string().optional(),
  responses: z.record(z.string()),
});

export type PublicQuoteData = z.infer<typeof publicQuoteSchema>;
export type PublicAssessmentData = z.infer<typeof publicAssessmentSchema>;

// Extended types for API responses
export type EquipmentWithCategory = Equipment & {
  category: EquipmentCategory;
  pricing: EquipmentPricing[];
  additionalEquipment: EquipmentAdditional[];
  serviceCosts?: EquipmentServiceCosts;
  serviceItems: EquipmentServiceItems[];
};

export type QuoteWithDetails = Quote & {
  client: Client;
  createdBy: User;
  items: (QuoteItem & {
    equipment: EquipmentWithCategory;
  })[];
};
