import { db } from './db.js';
import { equipment, equipmentPricing } from '../shared/schema.js';

const lightingTowers = [
  {
    name: "Maszt oświetleniowy Generac VT1",
    model: "VT1",
    description: "Maszt oświetleniowy Generac z 4 reflektorami LED o mocy 1000W każdy",
    categoryId: 25, // Maszty oświetleniowe
    power: "4x1000 W",
    quantity: 2,
    availableQuantity: 2,
    // Technical specifications
    fuelConsumption75: 0.6, // 0.6l/h
    dimensions: "3400x1850x9000", // DxSxW mm
    weight: "1200",
    engine: "Generac",
    fuelTankCapacity: 100,
    // Service costs (similar to generators)
    oilFilterCost: 85.00,
    airFilterCost: 45.00,
    fuelFilterCost: 35.00,
    maintenanceIntervalHours: 200,
    isActive: true
  },
  {
    name: "Maszt oświetleniowy Generac V20",
    model: "V20", 
    description: "Maszt oświetleniowy Generac z 4 reflektorami LED o mocy 320W każdy",
    categoryId: 25,
    power: "4x320 W",
    quantity: 3,
    availableQuantity: 3,
    fuelConsumption75: 0.6,
    dimensions: "2640x1900x8500",
    weight: "1030",
    engine: "Generac",
    fuelTankCapacity: 100,
    oilFilterCost: 85.00,
    airFilterCost: 45.00,
    fuelFilterCost: 35.00,
    maintenanceIntervalHours: 200,
    isActive: true
  },
  {
    name: "Maszt oświetleniowy Atlas Copco H6+",
    model: "H6+",
    description: "Maszt oświetleniowy Atlas Copco z 4 reflektorami LED o mocy 350W każdy, zasięg do 6000m²",
    categoryId: 25,
    power: "4x350 W",
    quantity: 2,
    availableQuantity: 2,
    fuelConsumption75: 0.5,
    dimensions: "2090x1290x2500",
    weight: "1020",
    engine: "Atlas Copco",
    fuelTankCapacity: 110,
    oilFilterCost: 90.00,
    airFilterCost: 50.00,
    fuelFilterCost: 40.00,
    maintenanceIntervalHours: 200,
    isActive: true
  },
  {
    name: "Maszt oświetleniowy Atlas Copco H5+",
    model: "H5+",
    description: "Maszt oświetleniowy Atlas Copco z 4 reflektorami LED o mocy 350W każy, zasięg 5000m²",
    categoryId: 25,
    power: "4x350 W", 
    quantity: 2,
    availableQuantity: 2,
    fuelConsumption75: 0.5,
    dimensions: "2300x1280x2485",
    weight: "1050",
    engine: "Atlas Copco",
    fuelTankCapacity: 110,
    oilFilterCost: 90.00,
    airFilterCost: 50.00,
    fuelFilterCost: 40.00,
    maintenanceIntervalHours: 200,
    isActive: true
  }
];

const lightingTowerPricing = [
  // Generac VT1 - 350 zł/dzień
  { equipmentId: null, periodStart: 1, periodEnd: 2, pricePerDay: "350.00", discountPercent: "0.00" },
  { equipmentId: null, periodStart: 3, periodEnd: 7, pricePerDay: "315.00", discountPercent: "10.00" },
  { equipmentId: null, periodStart: 8, periodEnd: 18, pricePerDay: "280.00", discountPercent: "20.00" },
  { equipmentId: null, periodStart: 19, periodEnd: 29, pricePerDay: "245.00", discountPercent: "30.00" },
  { equipmentId: null, periodStart: 30, periodEnd: null, pricePerDay: "210.00", discountPercent: "40.00" },

  // Generac V20 - 320 zł/dzień  
  { equipmentId: null, periodStart: 1, periodEnd: 2, pricePerDay: "320.00", discountPercent: "0.00" },
  { equipmentId: null, periodStart: 3, periodEnd: 7, pricePerDay: "288.00", discountPercent: "10.00" },
  { equipmentId: null, periodStart: 8, periodEnd: 18, pricePerDay: "256.00", discountPercent: "20.00" },
  { equipmentId: null, periodStart: 19, periodEnd: 29, pricePerDay: "224.00", discountPercent: "30.00" },
  { equipmentId: null, periodStart: 30, periodEnd: null, pricePerDay: "192.00", discountPercent: "40.00" },

  // Atlas Copco H6+ - 380 zł/dzień
  { equipmentId: null, periodStart: 1, periodEnd: 2, pricePerDay: "380.00", discountPercent: "0.00" },
  { equipmentId: null, periodStart: 3, periodEnd: 7, pricePerDay: "342.00", discountPercent: "10.00" },
  { equipmentId: null, periodStart: 8, periodEnd: 18, pricePerDay: "304.00", discountPercent: "20.00" },
  { equipmentId: null, periodStart: 19, periodEnd: 29, pricePerDay: "266.00", discountPercent: "30.00" },
  { equipmentId: null, periodStart: 30, periodEnd: null, pricePerDay: "228.00", discountPercent: "40.00" },

  // Atlas Copco H5+ - 360 zł/dzień
  { equipmentId: null, periodStart: 1, periodEnd: 2, pricePerDay: "360.00", discountPercent: "0.00" },
  { equipmentId: null, periodStart: 3, periodEnd: 7, pricePerDay: "324.00", discountPercent: "10.00" },
  { equipmentId: null, periodStart: 8, periodEnd: 18, pricePerDay: "288.00", discountPercent: "20.00" },
  { equipmentId: null, periodStart: 19, periodEnd: 29, pricePerDay: "252.00", discountPercent: "30.00" },
  { equipmentId: null, periodStart: 30, periodEnd: null, pricePerDay: "216.00", discountPercent: "40.00" }
];

export async function seedLightingTowers() {
  console.log('Adding lighting towers...');
  
  for (let i = 0; i < lightingTowers.length; i++) {
    const tower = lightingTowers[i];
    
    const [insertedTower] = await db
      .insert(equipment)
      .values(tower)
      .returning();
    
    console.log(`Added: ${tower.name}`);
    
    // Add pricing for this tower (5 pricing tiers per tower)
    const towerPricing = lightingTowerPricing.slice(i * 5, (i + 1) * 5);
    for (const pricing of towerPricing) {
      await db
        .insert(equipmentPricing)
        .values({
          ...pricing,
          equipmentId: insertedTower.id
        });
    }
  }
  
  console.log('Lighting towers seeded successfully!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedLightingTowers()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error seeding lighting towers:', error);
      process.exit(1);
    });
}
