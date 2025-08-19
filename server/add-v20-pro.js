import { db } from './db.ts';
import { equipment, equipmentPricing } from '../shared/schema.ts';

async function addV20Pro() {
  console.log('Adding Generac V20 PRO...');

  try {
    // Insert the equipment
    const [insertedEquipment] = await db
      .insert(equipment)
      .values({
        name: 'Generac V20 PRO',
        description: 'Maszt hybrydowy Generac V20 PRO z wieloma opcjami mocy',
        model: 'V20 PRO',
        power: '4x60W / 4x120W / 4x180W / 4x240W',
        categoryId: 25, // Maszty oświetleniowe
        quantity: 1,
        availableQuantity: 1,
        fuelConsumption75: 0.6,
        dimensions: '3390 x 1714 x 8200 mm',
        weight: '1146 kg',
        engine: 'Hybrydowy - generator + baterie',
        alternator: 'Powierzchnia oświetlona: 1500/2200/2700/3100 m²',
        fuelTankCapacity: 100
      })
      .returning();

    console.log(`Inserted equipment: ${insertedEquipment.name}`);

    // Add pricing tiers (380 PLN base price for hybrid lighting tower)
    const pricingTiers = [
      { periodStart: 1, periodEnd: 2, pricePerDay: 380, discountPercent: 0 },    // 1-2 dni
      { periodStart: 3, periodEnd: 7, pricePerDay: 342, discountPercent: 10.00 }, // 3-7 dni
      { periodStart: 8, periodEnd: 18, pricePerDay: 304, discountPercent: 20.00 }, // 8-18 dni
      { periodStart: 19, periodEnd: 29, pricePerDay: 266, discountPercent: 30.00 }, // 19-29 dni
      { periodStart: 30, periodEnd: null, pricePerDay: 228, discountPercent: 40.00 } // 30+ dni
    ];

    for (const tier of pricingTiers) {
      await db.insert(equipmentPricing).values({
        equipmentId: insertedEquipment.id,
        periodStart: tier.periodStart,
        periodEnd: tier.periodEnd,
        pricePerDay: tier.pricePerDay.toString(),
        discountPercent: tier.discountPercent.toString(),
      });
    }

    console.log(`Added pricing tiers for: ${insertedEquipment.name}`);
    console.log('V20 PRO addition completed!');
  } catch (error) {
    console.error('Error adding V20 PRO:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addV20Pro().then(() => process.exit(0));
}

export { addV20Pro };