import { db } from './db.ts';
import { equipment, equipmentPricing } from '../shared/schema.ts';

export async function seedAirConditioners() {
  console.log('Seeding air conditioners...');

  // Get the Klimatyzacje category ID
  const klimatyzacjeCategory = await db.query.equipmentCategories.findFirst({
    where: (categories, { eq }) => eq(categories.name, 'Klimatyzacje')
  });

  if (!klimatyzacjeCategory) {
    console.error('Klimatyzacje category not found');
    return;
  }

  const airConditioners = [
    {
      name: 'Dantherm AC M18',
      model: 'AC M18',
      description: 'Klimatyzator mobilny 17,5 kW',
      power: '17,5 kW chłodzenia / 16 kW grzania',
      dimensions: '780 x 1450 x 1140 mm',
      weight: '206-260 kg',
      engine: 'Natężenie prądu: Nominalne 16A, Startowe 26A',
      alternator: '1x rękaw DANTHERM Ø400 (zaciąg i nawiew)',
      fuelTankCapacity: null,
      quantity: 2,
      availableQuantity: 2,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox CSH 070 DNM4M',
      model: 'CSH 070 DNM4M',
      description: 'Klimatyzator stojący 69,5 kW',
      power: '69,5 kW chłodzenia / 69,5 kW grzania',
      dimensions: '2538 x 1183 x 2450 mm',
      weight: '665 kg',
      engine: 'Natężenie prądu: Nominalne 60,80A, Startowe 169,5A',
      alternator: '2x rękaw VENT COMBO Ø500 (ciemnoniebieski)',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox CAMH 060 DM1M',
      model: 'CAMH 060 DM1M',
      description: 'Klimatyzator stojący 53,9 kW',
      power: '53,9 kW chłodzenia / 45,8 kW grzania',
      dimensions: '2985 x 1183 x 2450 mm',
      weight: '1025 kg',
      engine: 'Natężenie prądu: Nominalne 47,5A, Startowe 62,5A',
      alternator: '2x rękaw VENT COMBO Ø500 (ciemnoniebieski)',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox CSH 055 DNM4M',
      model: 'CSH 055 DNM4M',
      description: 'Klimatyzator stojący 56 kW',
      power: '56 kW chłodzenia / 59 kW grzania',
      dimensions: '2538 x 1183 x 2450 mm',
      weight: '640 kg',
      engine: 'Natężenie prądu: Nominalne 58,4A, Startowe 136,70A',
      alternator: '2x rękaw VENT COMBO Ø500 (ciemnoniebieski)',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox CMH 045 DNM3M',
      model: 'CMH 045 DNM3M',
      description: 'Klimatyzator stojący 46 kW',
      power: '46 kW chłodzenia / 49,5 kW grzania',
      dimensions: '2538 x 1183 x 2450 mm',
      weight: '770 kg',
      engine: 'Natężenie prądu: Nominalne 85,7A, Startowe 159A',
      alternator: '1x rękaw VENT COMBO Ø500 (ciemnoniebieski)',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox CMH 030 SNM3M',
      model: 'CMH 030 SNM3M',
      description: 'Klimatyzator stojący 27 kW',
      power: '27 kW chłodzenia / 29,5 kW grzania',
      dimensions: '2538 x 1183 x 2450 mm',
      weight: '535 kg',
      engine: 'Natężenie prądu: Nominalne 29,39A, Startowe 107,7A',
      alternator: '1x rękaw VENT COMBO Ø500 (ciemnoniebieski)',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox CMH 025 SNM1M',
      model: 'CMH 025 SNM1M',
      description: 'Klimatyzator stojący 24 kW',
      power: '24 kW chłodzenia / 25 kW grzania',
      dimensions: '2538 x 1183 x 2450 mm',
      weight: '520 kg',
      engine: 'Natężenie prądu: Nominalne 48,7A, Startowe 122,1A',
      alternator: '1x rękaw VENT COMBO Ø500 (ciemnoniebieski)',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox BAH 085 M5M',
      model: 'BAH 085 M5M',
      description: 'Klimatyzator przemysłowy 85 kW',
      power: '85 kW / 154,2 kW chłodzenia, 78,3 kW / 240,9 kW grzania',
      dimensions: '3670 x 2220 x 1270 mm',
      weight: '1150 kg',
      engine: 'Natężenie prądu: Nominalne 80A, Startowe 166,7A',
      alternator: '2x rękaw VENT CLIP przezroczyste Ø500 + 3x rękaw VENT COMBO Ø500',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox BAC 075 M5M',
      model: 'BAC 075 M5M',
      description: 'Klimatyzator przemysłowy 73,5 kW',
      power: '73,5 kW chłodzenia',
      dimensions: '3670 x 2220 x 1270 mm',
      weight: '1138 kg',
      engine: 'Natężenie prądu: Nominalne 70,6A, Startowe 133,5A',
      alternator: '2x rękaw VENT CLIP przezroczyste Ø500 + 3x rękaw VENT COMBO Ø500',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox BAC 057 M5M',
      model: 'BAC 057 M5M',
      description: 'Klimatyzator przemysłowy 55,2 kW',
      power: '55,2 kW chłodzenia',
      dimensions: '3670 x 2220 x 1270 mm',
      weight: '941 kg',
      engine: 'Natężenie prądu: Nominalne 54,4A, Startowe 97,3A',
      alternator: '2x rękaw VENT CLIP przezroczyste Ø500 + 3x rękaw VENT COMBO Ø500',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox BAH 057 M5M',
      model: 'BAH 057 M5M',
      description: 'Klimatyzator przemysłowy 55,2 kW',
      power: '55,2 kW chłodzenia / 53,7 kW grzania',
      dimensions: '3670 x 2220 x 1270 mm',
      weight: '920 kg',
      engine: 'Natężenie prądu: Nominalne 46,1A, Startowe 89A',
      alternator: '2x rękaw VENT CLIP przezroczyste Ø500 + 3x rękaw VENT COMBO Ø500',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    },
    {
      name: 'Lennox BAH 055 M5M',
      model: 'BAH 055 M5M',
      description: 'Klimatyzator przemysłowy 49,9 kW',
      power: '49,9 kW chłodzenia / 45 kW grzania',
      dimensions: '3670 x 2220 x 1270 mm',
      weight: '909 kg / w koszu 1407 kg',
      engine: 'Natężenie prądu: Nominalne 49,2A, Startowe 135,9A',
      alternator: '2x rękaw VENT CLIP przezroczyste Ø500 + 3x rękaw VENT COMBO Ø500',
      fuelTankCapacity: null,
      quantity: 1,
      availableQuantity: 1,
      categoryId: klimatyzacjeCategory.id,
      fuelConsumption75: null
    }
  ];

  // Insert air conditioners
  for (const ac of airConditioners) {
    try {
      const [insertedAC] = await db.insert(equipment).values(ac).returning();
      console.log(`Inserted air conditioner: ${insertedAC.name}`);

      // Add standard pricing tiers for each air conditioner
      const pricingTiers = [
        { periodStart: 1, periodEnd: 2, pricePerDay: "220", discountPercent: "0" },
        { periodStart: 3, periodEnd: 7, pricePerDay: "190", discountPercent: "13.64" },
        { periodStart: 8, periodEnd: 18, pricePerDay: "160", discountPercent: "27.27" },
        { periodStart: 19, periodEnd: 29, pricePerDay: "130", discountPercent: "40.91" },
        { periodStart: 30, periodEnd: null, pricePerDay: "100", discountPercent: "54.55" }
      ];

      for (const pricing of pricingTiers) {
        await db.insert(equipmentPricing).values({
          equipmentId: insertedAC.id,
          ...pricing
        });
      }
      console.log(`Added pricing tiers for: ${insertedAC.name}`);

    } catch (error) {
      console.error(`Error inserting air conditioner ${ac.name}:`, error);
    }
  }

  console.log('Air conditioners seeding completed!');
}

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedAirConditioners().catch(console.error);
}