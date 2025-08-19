import {
  users,
  equipment,
  equipmentCategories,
  equipmentPricing,
  equipmentAdditional,
  equipmentServiceCosts,
  equipmentServiceItems,
  clients,
  quotes,
  quoteItems,

  pricingSchemas,

  type User,
  type UpsertUser,
  type Equipment,
  type EquipmentCategory,
  type EquipmentPricing,
  type EquipmentAdditional,
  type InsertEquipmentAdditional,
  type EquipmentWithCategory,
  type EquipmentServiceCosts,
  type EquipmentServiceItems,
  type InsertEquipmentServiceCosts,
  type InsertEquipmentServiceItems,
  type Client,
  type Quote,
  type QuoteItem,
  type QuoteWithDetails,
  type InsertEquipmentCategory,
  type InsertEquipment,
  type InsertEquipmentPricing,
  type InsertClient,
  type InsertQuote,
  type InsertQuoteItem,

  type PricingSchema,
  type InsertPricingSchema,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, like, and } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getPendingUsers(): Promise<User[]>;
  updateUserRole(id: string, role: string): Promise<User>;
  approveUser(id: string, approvedById: string): Promise<User>;
  rejectUser(id: string): Promise<void>;
  toggleUserActive(id: string): Promise<User>;
  deleteUser(id: string): Promise<void>;

  // Equipment categories
  getEquipmentCategories(): Promise<EquipmentCategory[]>;
  createEquipmentCategory(category: InsertEquipmentCategory): Promise<EquipmentCategory>;
  updateEquipmentCategory(id: number, category: Partial<InsertEquipmentCategory>): Promise<EquipmentCategory>;
  deleteEquipmentCategory(id: number): Promise<void>;

  // Equipment
  getEquipment(): Promise<EquipmentWithCategory[]>;
  getInactiveEquipment(): Promise<EquipmentWithCategory[]>;
  getEquipmentById(id: number): Promise<EquipmentWithCategory | undefined>;
  getEquipmentByCategory(categoryId: number): Promise<EquipmentWithCategory[]>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, equipment: Partial<InsertEquipment>): Promise<Equipment>;
  deleteEquipment(id: number): Promise<void>;
  permanentlyDeleteEquipment(id: number): Promise<void>;

  // Equipment pricing
  createEquipmentPricing(pricing: InsertEquipmentPricing): Promise<EquipmentPricing>;
  updateEquipmentPricing(id: number, pricing: Partial<InsertEquipmentPricing>): Promise<EquipmentPricing>;
  deleteEquipmentPricing(id: number): Promise<void>;

  // Equipment additional and accessories
  getEquipmentAdditional(equipmentId: number): Promise<EquipmentAdditional[]>;
  createEquipmentAdditional(additional: InsertEquipmentAdditional): Promise<EquipmentAdditional>;
  updateEquipmentAdditional(id: number, additional: Partial<InsertEquipmentAdditional>): Promise<EquipmentAdditional>;
  deleteEquipmentAdditional(id: number): Promise<void>;

  // Equipment service costs
  getEquipmentServiceCosts(equipmentId: number): Promise<EquipmentServiceCosts | undefined>;
  upsertEquipmentServiceCosts(serviceCosts: InsertEquipmentServiceCosts): Promise<EquipmentServiceCosts>;
  
  // Equipment service items
  getEquipmentServiceItems(equipmentId: number): Promise<EquipmentServiceItems[]>;
  createEquipmentServiceItem(serviceItem: InsertEquipmentServiceItems): Promise<EquipmentServiceItems>;
  updateEquipmentServiceItem(id: number, serviceItem: Partial<InsertEquipmentServiceItems>): Promise<EquipmentServiceItems>;
  deleteEquipmentServiceItem(id: number): Promise<void>;
  syncServiceWorkHours(equipmentId: number): Promise<void>;

  // Clients
  getClients(): Promise<Client[]>;
  getClientById(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Quotes
  getQuotes(): Promise<QuoteWithDetails[]>;
  getQuoteById(id: number): Promise<QuoteWithDetails | undefined>;
  getQuotesByUser(userId: string): Promise<QuoteWithDetails[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: number): Promise<void>;

  // Quote items
  createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem>;
  updateQuoteItem(id: number, item: Partial<InsertQuoteItem>): Promise<QuoteItem>;
  deleteQuoteItem(id: number): Promise<void>;
  getQuoteItems(quoteId: number): Promise<QuoteItem[]>;



  // Pricing schemas
  getPricingSchemas(): Promise<PricingSchema[]>;
  getPricingSchemaById(id: number): Promise<PricingSchema | undefined>;
  createPricingSchema(schema: InsertPricingSchema): Promise<PricingSchema>;
  updatePricingSchema(id: number, schema: Partial<InsertPricingSchema>): Promise<PricingSchema>;
  deletePricingSchema(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getPendingUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.isApproved, false))
      .orderBy(desc(users.createdAt));
  }

  async updateUserRole(id: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async approveUser(id: string, approvedById: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        isApproved: true, 
        approvedAt: new Date(),
        approvedById,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async rejectUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async toggleUserActive(id: string): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");
    
    const [updatedUser] = await db
      .update(users)
      .set({ isActive: !user.isActive, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    // First, update all quotes created by this user to have null createdById
    await db
      .update(quotes)
      .set({ createdById: null })
      .where(eq(quotes.createdById, id));
    
    // Now we can safely delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Equipment categories
  async getEquipmentCategories(): Promise<EquipmentCategory[]> {
    return await db.select().from(equipmentCategories);
  }

  async createEquipmentCategory(category: InsertEquipmentCategory): Promise<EquipmentCategory> {
    const [result] = await db.insert(equipmentCategories).values(category).returning();
    return result;
  }

  async updateEquipmentCategory(id: number, category: Partial<InsertEquipmentCategory>): Promise<EquipmentCategory> {
    const [result] = await db
      .update(equipmentCategories)
      .set(category)
      .where(eq(equipmentCategories.id, id))
      .returning();
    return result;
  }

  async deleteEquipmentCategory(id: number): Promise<void> {
    // Check if category has any ACTIVE equipment assigned
    const activeEquipmentInCategory = await db
      .select()
      .from(equipment)
      .where(and(eq(equipment.categoryId, id), eq(equipment.isActive, true)));
    
    if (activeEquipmentInCategory.length > 0) {
      throw new Error(`Nie można usunąć kategorii. Kategoria ma przypisany aktywny sprzęt (${activeEquipmentInCategory.length} pozycji). Najpierw dezaktywuj lub usuń sprzęt z tej kategorii.`);
    }
    
    // Get all inactive equipment in this category
    const inactiveEquipment = await db
      .select()
      .from(equipment)
      .where(and(eq(equipment.categoryId, id), eq(equipment.isActive, false)));
    
    // Delete related data for each inactive equipment
    for (const item of inactiveEquipment) {
      // Delete quote items that reference this equipment
      await db.delete(quoteItems).where(eq(quoteItems.equipmentId, item.id));
      // Delete pricing
      await db.delete(equipmentPricing).where(eq(equipmentPricing.equipmentId, item.id));
      // Delete additional equipment
      await db.delete(equipmentAdditional).where(eq(equipmentAdditional.equipmentId, item.id));
    }
    
    // Delete all inactive equipment in this category
    await db.delete(equipment).where(and(eq(equipment.categoryId, id), eq(equipment.isActive, false)));
    
    await db.delete(equipmentCategories).where(eq(equipmentCategories.id, id));
  }

  // Equipment
  async getInactiveEquipment(): Promise<EquipmentWithCategory[]> {
    const result = await db
      .select()
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId))
      .leftJoin(equipmentAdditional, eq(equipment.id, equipmentAdditional.equipmentId))
      .leftJoin(equipmentServiceCosts, eq(equipment.id, equipmentServiceCosts.equipmentId))
      .leftJoin(equipmentServiceItems, eq(equipment.id, equipmentServiceItems.equipmentId))
      .where(eq(equipment.isActive, false));

    const equipmentMap = new Map<number, EquipmentWithCategory>();

    for (const row of result) {
      if (!equipmentMap.has(row.equipment.id)) {
        equipmentMap.set(row.equipment.id, {
          ...row.equipment,
          category: row.equipment_categories!,
          pricing: [],
          additionalEquipment: [],
          serviceCosts: row.equipment_service_costs || undefined,
          serviceItems: [],
        });
      }

      const equipmentItem = equipmentMap.get(row.equipment.id)!;

      if (row.equipment_pricing) {
        const existingPricing = equipmentItem.pricing.find(p => p.id === row.equipment_pricing!.id);
        if (!existingPricing) {
          equipmentItem.pricing.push(row.equipment_pricing);
        }
      }

      if (row.equipment_additional) {
        const existingAdditional = equipmentItem.additionalEquipment.find(a => a.id === row.equipment_additional!.id);
        if (!existingAdditional) {
          equipmentItem.additionalEquipment.push(row.equipment_additional);
        }
      }

      if (row.equipment_service_items) {
        const existingServiceItem = equipmentItem.serviceItems.find(s => s.id === row.equipment_service_items!.id);
        if (!existingServiceItem) {
          equipmentItem.serviceItems.push(row.equipment_service_items);
        }
      }
    }

    return Array.from(equipmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getEquipment(): Promise<EquipmentWithCategory[]> {
    const result = await db
      .select()
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId))
      .leftJoin(equipmentAdditional, eq(equipment.id, equipmentAdditional.equipmentId))
      .leftJoin(equipmentServiceCosts, eq(equipment.id, equipmentServiceCosts.equipmentId))
      .leftJoin(equipmentServiceItems, eq(equipment.id, equipmentServiceItems.equipmentId))
      .where(eq(equipment.isActive, true));

    const equipmentMap = new Map<number, EquipmentWithCategory>();

    for (const row of result) {
      if (!equipmentMap.has(row.equipment.id)) {
        equipmentMap.set(row.equipment.id, {
          ...row.equipment,
          category: row.equipment_categories!,
          pricing: [],
          additionalEquipment: [],
          serviceCosts: row.equipment_service_costs || undefined,
          serviceItems: [],
        });
      }

      const equipmentItem = equipmentMap.get(row.equipment.id)!;

      if (row.equipment_pricing) {
        const existingPricing = equipmentItem.pricing.find(p => p.id === row.equipment_pricing!.id);
        if (!existingPricing) {
          equipmentItem.pricing.push(row.equipment_pricing);
        }
      }

      if (row.equipment_additional) {
        const existingAdditional = equipmentItem.additionalEquipment.find(a => a.id === row.equipment_additional!.id);
        if (!existingAdditional) {
          equipmentItem.additionalEquipment.push(row.equipment_additional);
        }
      }

      if (row.equipment_service_items) {
        const existingServiceItem = equipmentItem.serviceItems.find(s => s.id === row.equipment_service_items!.id);
        if (!existingServiceItem) {
          equipmentItem.serviceItems.push(row.equipment_service_items);
        }
      }
    }

    return Array.from(equipmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async getEquipmentById(id: number): Promise<EquipmentWithCategory | undefined> {
    const result = await db
      .select()
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId))
      .leftJoin(equipmentAdditional, eq(equipment.id, equipmentAdditional.equipmentId))
      .leftJoin(equipmentServiceCosts, eq(equipment.id, equipmentServiceCosts.equipmentId))
      .leftJoin(equipmentServiceItems, eq(equipment.id, equipmentServiceItems.equipmentId))
      .where(eq(equipment.id, id));

    if (result.length === 0) return undefined;

    const equipmentData = result[0].equipment;
    const category = result[0].equipment_categories!;
    const pricing = result.map(row => row.equipment_pricing).filter(Boolean) as EquipmentPricing[];
    const additionalEquipment = result.map(row => row.equipment_additional).filter(Boolean) as EquipmentAdditional[];
    const serviceCosts = result[0].equipment_service_costs || undefined;
    const serviceItems = result.map(row => row.equipment_service_items).filter(Boolean) as EquipmentServiceItems[];

    return {
      ...equipmentData,
      category,
      pricing,
      additionalEquipment,
      serviceCosts,
      serviceItems,
    };
  }

  async getEquipmentByCategory(categoryId: number): Promise<EquipmentWithCategory[]> {
    const result = await db
      .select()
      .from(equipment)
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .leftJoin(equipmentPricing, eq(equipment.id, equipmentPricing.equipmentId))
      .where(and(eq(equipment.categoryId, categoryId), eq(equipment.isActive, true)));

    const equipmentMap = new Map<number, EquipmentWithCategory>();

    for (const row of result) {
      if (!equipmentMap.has(row.equipment.id)) {
        equipmentMap.set(row.equipment.id, {
          ...row.equipment,
          category: row.equipment_categories!,
          pricing: [],
          additionalEquipment: [],
          serviceItems: [],
        });
      }

      if (row.equipment_pricing) {
        equipmentMap.get(row.equipment.id)!.pricing.push(row.equipment_pricing);
      }
    }

    return Array.from(equipmentMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    const [result] = await db.insert(equipment).values(equipmentData).returning();
    
    // Create basic pricing structure with proper discount structure
    const basicPricing = [
      { periodStart: 1, periodEnd: 2, discountPercent: 0 },
      { periodStart: 3, periodEnd: 7, discountPercent: 10 },
      { periodStart: 8, periodEnd: 18, discountPercent: 20 },
      { periodStart: 19, periodEnd: 29, discountPercent: 30 },
      { periodStart: 30, periodEnd: null, discountPercent: 40 }
    ];

    // Create placeholder pricing entries that admin MUST update
    // Using 100 zł base price with standard discount structure
    const basePricePerDay = 100;
    
    for (const tier of basicPricing) {
      await db.insert(equipmentPricing).values({
        equipmentId: result.id,
        periodStart: tier.periodStart,
        periodEnd: tier.periodEnd,
        pricePerDay: basePricePerDay.toString(),
        discountPercent: tier.discountPercent.toString()
      });
    }

    // Get equipment category to determine service configuration
    const equipmentCategory = await db
      .select()
      .from(equipmentCategories)
      .where(eq(equipmentCategories.id, equipmentData.categoryId))
      .limit(1);

    if (equipmentCategory.length > 0) {
      const categoryName = equipmentCategory[0].name;
      
      // Create default service cost configuration based on category
      let serviceConfig: any = {
        equipmentId: result.id,
        workerHours: 2.0,
        workerCostPerHour: 100.00,
        serviceIntervalMonths: 12
      };

      // Adjust service configuration based on category
      if (categoryName === 'Agregaty prądotwórcze') {
        serviceConfig.serviceIntervalMotohours = 500;
        serviceConfig.serviceIntervalMonths = null;
      } else if (categoryName === 'Maszty oświetleniowe') {
        serviceConfig.serviceIntervalMotohours = 1000;
        serviceConfig.serviceIntervalMonths = null;
      } else if (categoryName === 'Pojazdy') {
        serviceConfig.serviceIntervalKm = 15000;
        serviceConfig.serviceIntervalMonths = null;
        serviceConfig.workerHours = 3.0;
        serviceConfig.workerCostPerHour = 500.00;
      }

      // Insert service costs configuration
      await db.insert(equipmentServiceCosts).values(serviceConfig);

      // Create default service items based on category
      const defaultServiceItems = [
        { itemName: 'Filtr paliwa', itemCost: 50.00, sortOrder: 1 },
        { itemName: 'Filtr oleju', itemCost: 75.00, sortOrder: 2 },
        { itemName: 'Wymiana oleju', itemCost: 120.00, sortOrder: 3 },
        { itemName: 'Roboczogodziny serwisowe', itemCost: serviceConfig.workerHours * serviceConfig.workerCostPerHour, sortOrder: 4 }
      ];

      // Adjust service items based on category
      if (categoryName === 'Pojazdy') {
        defaultServiceItems[0] = { itemName: 'Filtr paliwa', itemCost: 50.00, sortOrder: 1 };
        defaultServiceItems[1] = { itemName: 'Filtr oleju', itemCost: 75.00, sortOrder: 2 };
        defaultServiceItems[2] = { itemName: 'Wymiana oleju', itemCost: 120.00, sortOrder: 3 };
        defaultServiceItems[3] = { itemName: 'Roboczogodziny serwisowe', itemCost: 1500.00, sortOrder: 4 };
      }

      // Insert service items
      for (const serviceItem of defaultServiceItems) {
        await db.insert(equipmentServiceItems).values({
          equipmentId: result.id,
          ...serviceItem
        });
      }
    }

    // Create default additional equipment entry for immediate access
    await db.insert(equipmentAdditional).values({
      equipmentId: result.id,
      type: "additional",
      name: "Dodatkowe wyposażenie 1",
      price: "0.00"
    });
    
    return result;
  }

  async updateEquipment(id: number, equipmentData: Partial<InsertEquipment>): Promise<Equipment> {
    const [result] = await db
      .update(equipment)
      .set({ ...equipmentData, updatedAt: new Date() })
      .where(eq(equipment.id, id))
      .returning();
    return result;
  }

  async deleteEquipment(id: number): Promise<void> {
    await db.update(equipment).set({ isActive: false }).where(eq(equipment.id, id));
  }

  async permanentlyDeleteEquipment(id: number): Promise<void> {
    // Delete all related data first
    await db.delete(quoteItems).where(eq(quoteItems.equipmentId, id));
    await db.delete(equipmentPricing).where(eq(equipmentPricing.equipmentId, id));
    await db.delete(equipmentAdditional).where(eq(equipmentAdditional.equipmentId, id));
    
    // Delete service-related data
    await db.delete(equipmentServiceCosts).where(eq(equipmentServiceCosts.equipmentId, id));
    await db.delete(equipmentServiceItems).where(eq(equipmentServiceItems.equipmentId, id));
    
    // Finally delete the equipment itself
    await db.delete(equipment).where(eq(equipment.id, id));
  }

  // Equipment pricing
  async createEquipmentPricing(pricing: InsertEquipmentPricing): Promise<EquipmentPricing> {
    const [result] = await db.insert(equipmentPricing).values(pricing).returning();
    return result;
  }

  async updateEquipmentPricing(id: number, pricing: Partial<InsertEquipmentPricing>): Promise<EquipmentPricing> {
    const [result] = await db
      .update(equipmentPricing)
      .set(pricing)
      .where(eq(equipmentPricing.id, id))
      .returning();
    return result;
  }

  async deleteEquipmentPricing(id: number): Promise<void> {
    await db.delete(equipmentPricing).where(eq(equipmentPricing.id, id));
  }

  // Equipment additional and accessories
  async getEquipmentAdditional(equipmentId: number): Promise<EquipmentAdditional[]> {
    return await db
      .select()
      .from(equipmentAdditional)
      .where(eq(equipmentAdditional.equipmentId, equipmentId))
      .orderBy(equipmentAdditional.type, equipmentAdditional.position);
  }

  async createEquipmentAdditional(additional: InsertEquipmentAdditional): Promise<EquipmentAdditional> {
    const [result] = await db.insert(equipmentAdditional).values(additional).returning();
    return result;
  }

  async updateEquipmentAdditional(id: number, additional: Partial<InsertEquipmentAdditional>): Promise<EquipmentAdditional> {
    const [result] = await db
      .update(equipmentAdditional)
      .set({ ...additional, updatedAt: new Date() })
      .where(eq(equipmentAdditional.id, id))
      .returning();
    return result;
  }

  async deleteEquipmentAdditional(id: number): Promise<void> {
    await db.delete(equipmentAdditional).where(eq(equipmentAdditional.id, id));
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getClientById(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [result] = await db.insert(clients).values(client).returning();
    return result;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [result] = await db
      .update(clients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return result;
  }

  async deleteClient(id: number): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  // Quotes
  async getQuotes(): Promise<QuoteWithDetails[]> {
    const result = await db
      .select()
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .leftJoin(users, eq(quotes.createdById, users.id))
      .leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId))
      .leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id))
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .orderBy(desc(quotes.createdAt));

    const quotesMap = new Map<number, QuoteWithDetails>();

    for (const row of result) {
      if (!quotesMap.has(row.quotes.id)) {
        quotesMap.set(row.quotes.id, {
          ...row.quotes,
          client: row.clients!,
          createdBy: row.users!,
          items: [],
        });
      }

      if (row.quote_items && row.equipment && row.equipment_categories) {
        const quote = quotesMap.get(row.quotes.id)!;
        const existingItem = quote.items.find(item => item.id === row.quote_items!.id);
        
        if (!existingItem) {
          quote.items.push({
            ...row.quote_items,
            equipment: {
              ...row.equipment,
              category: row.equipment_categories,
              pricing: [], // Would need separate query for pricing
              additionalEquipment: [],
              serviceItems: [],
            },
          });
        }
      }
    }

    return Array.from(quotesMap.values());
  }

  async getQuoteById(id: number): Promise<QuoteWithDetails | undefined> {
    const result = await db
      .select()
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .leftJoin(users, eq(quotes.createdById, users.id))
      .leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId))
      .leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id))
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .where(eq(quotes.id, id));

    if (result.length === 0) return undefined;

    const quote = result[0].quotes;
    const client = result[0].clients!;
    const createdBy = result[0].users!;
    
    // Process items and fetch additional equipment for each
    const itemsWithAdditional = await Promise.all(
      result
        .filter(row => row.quote_items && row.equipment && row.equipment_categories)
        .map(async (row) => {
          const additionalEquipment = await this.getEquipmentAdditional(row.equipment!.id);
          return {
            ...row.quote_items!,
            equipment: {
              ...row.equipment!,
              category: row.equipment_categories!,
              pricing: [],
              additionalEquipment,
              serviceItems: [],
            },
          };
        })
    );

    return {
      ...quote,
      client,
      createdBy,
      items: itemsWithAdditional,
    };
  }

  async getQuotesByUser(userId: string): Promise<QuoteWithDetails[]> {
    const result = await db
      .select()
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .leftJoin(users, eq(quotes.createdById, users.id))
      .leftJoin(quoteItems, eq(quotes.id, quoteItems.quoteId))
      .leftJoin(equipment, eq(quoteItems.equipmentId, equipment.id))
      .leftJoin(equipmentCategories, eq(equipment.categoryId, equipmentCategories.id))
      .where(eq(quotes.createdById, userId))
      .orderBy(desc(quotes.createdAt));

    const quotesMap = new Map<number, QuoteWithDetails>();

    for (const row of result) {
      if (!quotesMap.has(row.quotes.id)) {
        quotesMap.set(row.quotes.id, {
          ...row.quotes,
          client: row.clients!,
          createdBy: row.users!,
          items: [],
        });
      }

      if (row.quote_items && row.equipment && row.equipment_categories) {
        const quote = quotesMap.get(row.quotes.id)!;
        const existingItem = quote.items.find(item => item.id === row.quote_items!.id);
        
        if (!existingItem) {
          quote.items.push({
            ...row.quote_items,
            equipment: {
              ...row.equipment,
              category: row.equipment_categories,
              pricing: [],
              additionalEquipment: [],
              serviceItems: [],
            },
          });
        }
      }
    }

    return Array.from(quotesMap.values());
  }

  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [result] = await db.insert(quotes).values(quote).returning();
    return result;
  }

  async updateQuote(id: number, quote: Partial<InsertQuote>): Promise<Quote> {
    const [result] = await db
      .update(quotes)
      .set({ ...quote, updatedAt: new Date() })
      .where(eq(quotes.id, id))
      .returning();
    return result;
  }

  async deleteQuote(id: number): Promise<void> {
    // First delete all quote items
    await db.delete(quoteItems).where(eq(quoteItems.quoteId, id));
    // Then delete the quote itself
    await db.delete(quotes).where(eq(quotes.id, id));
  }

  // Quote items
  async createQuoteItem(item: InsertQuoteItem): Promise<QuoteItem> {
    const [result] = await db.insert(quoteItems).values(item).returning();
    return result;
  }

  async updateQuoteItem(id: number, item: Partial<InsertQuoteItem>): Promise<QuoteItem> {
    const [result] = await db
      .update(quoteItems)
      .set(item)
      .where(eq(quoteItems.id, id))
      .returning();
    return result;
  }

  async deleteQuoteItem(id: number): Promise<void> {
    await db.delete(quoteItems).where(eq(quoteItems.id, id));
  }

  async getQuoteItems(quoteId: number): Promise<QuoteItem[]> {
    return await db.select().from(quoteItems).where(eq(quoteItems.quoteId, quoteId));
  }



  // Pricing schemas
  async getPricingSchemas(): Promise<PricingSchema[]> {
    const schemas = await db.select().from(pricingSchemas).orderBy(pricingSchemas.name);
    return schemas;
  }

  async getPricingSchemaById(id: number): Promise<PricingSchema | undefined> {
    const [schema] = await db.select().from(pricingSchemas).where(eq(pricingSchemas.id, id));
    return schema;
  }

  async createPricingSchema(schemaData: InsertPricingSchema): Promise<PricingSchema> {
    const [schema] = await db.insert(pricingSchemas).values(schemaData).returning();
    return schema;
  }

  async updatePricingSchema(id: number, schemaData: Partial<InsertPricingSchema>): Promise<PricingSchema> {
    const [schema] = await db
      .update(pricingSchemas)
      .set({ ...schemaData, updatedAt: new Date() })
      .where(eq(pricingSchemas.id, id))
      .returning();
    return schema;
  }

  async deletePricingSchema(id: number): Promise<void> {
    await db.delete(pricingSchemas).where(eq(pricingSchemas.id, id));
  }

  // Equipment service costs methods
  async getEquipmentServiceCosts(equipmentId: number): Promise<EquipmentServiceCosts | undefined> {
    const [result] = await db
      .select()
      .from(equipmentServiceCosts)
      .where(eq(equipmentServiceCosts.equipmentId, equipmentId));
    return result;
  }

  async upsertEquipmentServiceCosts(serviceCosts: InsertEquipmentServiceCosts): Promise<EquipmentServiceCosts> {
    const [result] = await db
      .insert(equipmentServiceCosts)
      .values(serviceCosts)
      .onConflictDoUpdate({
        target: equipmentServiceCosts.equipmentId,
        set: {
          serviceIntervalMonths: serviceCosts.serviceIntervalMonths,
          serviceIntervalKm: (serviceCosts as any).serviceIntervalKm,
          serviceIntervalMotohours: (serviceCosts as any).serviceIntervalMotohours,
          workerHours: serviceCosts.workerHours,
          workerCostPerHour: serviceCosts.workerCostPerHour,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Equipment service items methods
  async getEquipmentServiceItems(equipmentId: number): Promise<EquipmentServiceItems[]> {
    return await db
      .select()
      .from(equipmentServiceItems)
      .where(eq(equipmentServiceItems.equipmentId, equipmentId))
      .orderBy(equipmentServiceItems.sortOrder);
  }

  async createEquipmentServiceItem(serviceItem: InsertEquipmentServiceItems): Promise<EquipmentServiceItems> {
    const [result] = await db
      .insert(equipmentServiceItems)
      .values(serviceItem)
      .returning();
    return result;
  }

  async updateEquipmentServiceItem(id: number, serviceItem: Partial<InsertEquipmentServiceItems>): Promise<EquipmentServiceItems> {
    const [result] = await db
      .update(equipmentServiceItems)
      .set({ ...serviceItem, updatedAt: new Date() })
      .where(eq(equipmentServiceItems.id, id))
      .returning();
    return result;
  }

  async deleteEquipmentServiceItem(id: number): Promise<void> {
    await db.delete(equipmentServiceItems).where(eq(equipmentServiceItems.id, id));
  }

  async syncServiceWorkHours(equipmentId: number): Promise<void> {
    // Get current service costs configuration for this equipment
    const serviceCosts = await this.getEquipmentServiceCosts(equipmentId);
    
    if (serviceCosts && serviceCosts.workerHours && serviceCosts.workerCostPerHour) {
      // Calculate the total cost for service work hours
      const totalCost = parseFloat(serviceCosts.workerHours.toString()) * parseFloat(serviceCosts.workerCostPerHour.toString());
      
      // Update the "Roboczogodziny serwisowe" item with the calculated cost
      await db
        .update(equipmentServiceItems)
        .set({ 
          itemCost: totalCost.toString(),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(equipmentServiceItems.equipmentId, equipmentId),
            eq(equipmentServiceItems.itemName, 'Roboczogodziny serwisowe')
          )
        );
    } else {
      // If no service costs exist, create default configuration
      const equipmentData = await this.getEquipmentById(equipmentId);
      if (equipmentData) {
        await this.createDefaultServiceConfiguration(equipmentId, equipmentData.category.name);
      }
    }
  }

  // Helper function to create default service configuration for any equipment/category
  async createDefaultServiceConfiguration(equipmentId: number, categoryName: string): Promise<void> {
    // Create default service cost configuration based on category
    let serviceConfig: any = {
      equipmentId: equipmentId,
      workerHours: 2.0,
      workerCostPerHour: 100.00,
      serviceIntervalMonths: 12
    };

    // Adjust service configuration based on category
    if (categoryName === 'Agregaty prądotwórcze') {
      serviceConfig.serviceIntervalMotohours = 500;
      serviceConfig.serviceIntervalMonths = null;
    } else if (categoryName === 'Maszty oświetleniowe') {
      serviceConfig.serviceIntervalMotohours = 1000;
      serviceConfig.serviceIntervalMonths = null;
    } else if (categoryName === 'Pojazdy') {
      serviceConfig.serviceIntervalKm = 15000;
      serviceConfig.serviceIntervalMonths = null;
      serviceConfig.workerHours = 3.0;
      serviceConfig.workerCostPerHour = 500.00;
    }

    // Insert service costs configuration
    await db.insert(equipmentServiceCosts).values(serviceConfig);

    // Create default service items based on category
    const defaultServiceItems = [
      { itemName: 'Filtr paliwa', itemCost: 50.00, sortOrder: 1 },
      { itemName: 'Filtr oleju', itemCost: 75.00, sortOrder: 2 },
      { itemName: 'Wymiana oleju', itemCost: 120.00, sortOrder: 3 },
      { itemName: 'Roboczogodziny serwisowe', itemCost: serviceConfig.workerHours * serviceConfig.workerCostPerHour, sortOrder: 4 }
    ];

    // Adjust service items based on category
    if (categoryName === 'Pojazdy') {
      defaultServiceItems[0] = { itemName: 'Filtr paliwa', itemCost: 50.00, sortOrder: 1 };
      defaultServiceItems[1] = { itemName: 'Filtr oleju', itemCost: 75.00, sortOrder: 2 };
      defaultServiceItems[2] = { itemName: 'Wymiana oleju', itemCost: 120.00, sortOrder: 3 };
      defaultServiceItems[3] = { itemName: 'Roboczogodziny serwisowe', itemCost: 1500.00, sortOrder: 4 };
    }

    // Insert service items
    for (const serviceItem of defaultServiceItems) {
      await db.insert(equipmentServiceItems).values({
        equipmentId: equipmentId,
        itemName: serviceItem.itemName,
        itemCost: serviceItem.itemCost.toString(),
        sortOrder: serviceItem.sortOrder
      });
    }
  }

  // Function to sync ALL equipment with current admin panel settings
  async syncAllEquipmentWithAdminSettings(): Promise<void> {
    console.log('Syncing all equipment with admin panel settings...');
    
    // Get all active equipment
    const allEquipment = await this.getEquipment();
    
    for (const equipment of allEquipment) {
      // Ensure each equipment has service configuration
      const serviceCosts = await db
        .select()
        .from(equipmentServiceCosts)
        .where(eq(equipmentServiceCosts.equipmentId, equipment.id))
        .limit(1);

      if (serviceCosts.length === 0) {
        // Create missing service configuration
        await this.createDefaultServiceConfiguration(equipment.id, equipment.category.name);
        console.log(`Created service configuration for ${equipment.name}`);
      } else {
        // Sync existing configuration
        await this.syncServiceWorkHours(equipment.id);
        console.log(`Synced service configuration for ${equipment.name}`);
      }
    }
    
    console.log('Finished syncing all equipment with admin panel settings');
  }
}

export const storage = new DatabaseStorage();
