import { db } from './db.ts';
import { equipment, equipmentPricing } from '../shared/schema.ts';

export async function seedHeaters() {
  console.log('Seeding heaters...');

  const heaters = [
    {
      name: "Arcotherm EC55 Master BV170E",
      description: "Nagrzewnica olejowa EC55/BV170E z wentylatorem",
      model: "EC55 / BV170E",
      power: "55,0 kW / 49,0 kW",
      categoryId: 24, // Nagrzewnice
      quantity: 2,
      availableQuantity: 2,
      fuelConsumption75: 4.6, // średnie zużycie paliwa l/h
      dimensions: "1750 x 540 x 1170 mm",
      weight: "80 kg / 70 kg",
      engine: "Pobór prądu: 850 W / 0,8 A",
      alternator: "Nawiew: 1x rękaw VENT COMBO Ø500",
      fuelTankCapacity: 65
    },
    {
      name: "Arcotherm EC85 Master BV290E", 
      description: "Nagrzewnica olejowa EC85/BV290E z wentylatorem",
      model: "EC85 / BV290E",
      power: "85 kW",
      categoryId: 24, // Nagrzewnice
      quantity: 1,
      availableQuantity: 1,
      fuelConsumption75: 7.17, // średnie zużycie paliwa l/h
      dimensions: "1750 x 540 x 1170 mm",
      weight: "110 kg",
      engine: "Pobór prądu: 1140 W / 4,6 A",
      alternator: "Nawiew: 2x rękawy VENT COMBO Ø500",
      fuelTankCapacity: 105
    },
    {
      name: "Master BV 691 S",
      description: "Nagrzewnica olejowa Master BV691S z wentylatorem",
      model: "BV 691 S",
      power: "do 225 kW",
      categoryId: 24, // Nagrzewnice
      quantity: 1,
      availableQuantity: 1,
      fuelConsumption75: 21.44, // zużycie paliwa l/h
      dimensions: "2300 x 1000 x 2000 mm",
      weight: "380 kg",
      engine: "Pobór prądu: 12,6 A",
      alternator: "Nawiew: 2x rękawy VENT COMBO Ø500",
      fuelTankCapacity: null // brak informacji o zbiorniku
    },
    {
      name: "Thermobile IMA 200",
      description: "Nagrzewnica olejowa Thermobile IMA 200",
      model: "IMA 200",
      power: "200,0 kW",
      categoryId: 24, // Nagrzewnice
      quantity: 1,
      availableQuantity: 1,
      fuelConsumption75: 19.4, // zużycie paliwa l/h
      dimensions: "3510 x 1150 x 1500 mm",
      weight: "450 kg + waga kosza",
      engine: "Pobór prądu: 15 A",
      alternator: "Nawiew: 2x rękawy VENT COMBO Ø500",
      fuelTankCapacity: null // brak informacji o zbiorniku
    },
    {
      name: "Biemmedue Jumbo 235",
      description: "Nagrzewnica olejowa Biemmedue Jumbo 235",
      model: "Jumbo 235",
      power: "235,0 kW",
      categoryId: 24, // Nagrzewnice
      quantity: 1,
      availableQuantity: 1,
      fuelConsumption75: 18.65, // zużycie paliwa l/h
      dimensions: "1000 x 2240 x 1580 mm",
      weight: "351 kg",
      engine: "Pobór prądu: 1,86 kW",
      alternator: "Nawiew: 2x rękawy VENT COMBO Ø500",
      fuelTankCapacity: null // brak informacji o zbiorniku
    }
  ];

  // Standard pricing tiers for heaters (higher pricing for powerful equipment)
  const standardPricingTiers = [
    { periodStart: 1, periodEnd: 2, pricePerDay: 450, discountPercent: 0 },    // 1-2 dni
    { periodStart: 3, periodEnd: 7, pricePerDay: 405, discountPercent: 10.00 }, // 3-7 dni
    { periodStart: 8, periodEnd: 18, pricePerDay: 360, discountPercent: 20.00 }, // 8-18 dni
    { periodStart: 19, periodEnd: 29, pricePerDay: 315, discountPercent: 30.00 }, // 19-29 dni
    { periodStart: 30, periodEnd: null, pricePerDay: 270, discountPercent: 40.00 } // 30+ dni
  ];

  for (const heater of heaters) {
    try {
      // Insert heater
      const [insertedHeater] = await db
        .insert(equipment)
        .values(heater)
        .returning();

      console.log(`Inserted heater: ${insertedHeater.name}`);

      // Add standard pricing tiers
      for (const tier of standardPricingTiers) {
        await db.insert(equipmentPricing).values({
          equipmentId: insertedHeater.id,
          periodStart: tier.periodStart,
          periodEnd: tier.periodEnd,
          pricePerDay: tier.pricePerDay.toString(),
          discountPercent: tier.discountPercent.toString(),
        });
      }

      console.log(`Added pricing tiers for: ${insertedHeater.name}`);
    } catch (error) {
      console.error(`Error inserting heater ${heater.name}:`, error);
    }
  }

  console.log('Heaters seeding completed!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedHeaters().then(() => process.exit(0));
}