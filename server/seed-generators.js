import { db } from './db.ts';
import { equipment, equipmentPricing } from '../shared/schema.ts';

// Script to add SDMO generators from the provided specification table
const generators = [
  {
    name: "SDMO J33",
    model: "J33",
    power: "24/30 kW",
    description: "Agregat prądotwórczy SDMO J33, moc 24kW ciągła / 30kW zapasowa",
    fuelConsumption75: 5.5, // l/h at 75% load
    dimensions: "2100x938x1385mm",
    weight: "817kg",
    engine: "SDMO",
    fuelTankCapacity: 100
  },
  {
    name: "SDMO J44",
    model: "J44", 
    power: "32/40 kW",
    description: "Agregat prądotwórczy SDMO J44, moc 32kW ciągła / 40kW zapasowa",
    fuelConsumption75: 7.7,
    dimensions: "2100x938x1076mm",
    weight: "868kg",
    engine: "SDMO",
    fuelTankCapacity: 240
  },
  {
    name: "SDMO J44 DW",
    model: "J44 DW",
    power: "32/40 kW", 
    description: "Agregat prądotwórczy SDMO J44 DW, wersja wyciszona",
    fuelConsumption75: 7.7,
    dimensions: "2100x940x1088mm",
    weight: "1088kg",
    engine: "SDMO",
    fuelTankCapacity: 470
  },
  {
    name: "SDMO R44 C3",
    model: "R44 C3",
    power: "40/50 kW",
    description: "Agregat prądotwórczy SDMO R44 C3, automatyka 3. stopnia",
    fuelConsumption75: 8.1,
    dimensions: "2200x1000x1530mm", 
    weight: "1112kg",
    engine: "SDMO",
    fuelTankCapacity: 220
  },
  {
    name: "SDMO R66",
    model: "R66",
    power: "48/60 kW",
    description: "Agregat prądotwórczy SDMO R66, moc 48kW ciągła / 60kW zapasowa",
    fuelConsumption75: 11.9,
    dimensions: "2545x1150x1840mm",
    weight: "1654kg", 
    engine: "SDMO",
    fuelTankCapacity: 390
  },
  {
    name: "SDMO R66 C3",
    model: "R66 C3",
    power: "48/60 kW",
    description: "Agregat prądotwórczy SDMO R66 C3, automatyka 3. stopnia",
    fuelConsumption75: 11.9,
    dimensions: "2545x1150x1840mm",
    weight: "1654kg",
    engine: "SDMO", 
    fuelTankCapacity: 390
  },
  {
    name: "SDMO R110",
    model: "R110",
    power: "80/100 kW",
    description: "Agregat prądotwórczy SDMO R110, moc 80kW ciągła / 100kW zapasowa",
    fuelConsumption75: 18.4,
    dimensions: "2860x1190x2000mm",
    weight: "2087kg",
    engine: "SDMO",
    fuelTankCapacity: 527
  },
  {
    name: "SDMO R110 C3",
    model: "R110 C3", 
    power: "80/100 kW",
    description: "Agregat prądotwórczy SDMO R110 C3, automatyka 3. stopnia",
    fuelConsumption75: 18.4,
    dimensions: "2860x1190x2000mm",
    weight: "2087kg",
    engine: "SDMO",
    fuelTankCapacity: 527
  },
  {
    name: "SDMO R110 C5",
    model: "R110 C5",
    power: "80/100 kW", 
    description: "Agregat prądotwórczy SDMO R110 C5, automatyka 5. stopnia",
    fuelConsumption75: 24.5,
    dimensions: "3160x1190x2230mm",
    weight: "2460kg",
    engine: "SDMO",
    fuelTankCapacity: 475
  },
  {
    name: "SDMO R165",
    model: "R165",
    power: "120/150 kW",
    description: "Agregat prądotwórczy SDMO R165, moc 120kW ciągła / 150kW zapasowa", 
    fuelConsumption75: 24.5,
    dimensions: "3520x1190x2120mm",
    weight: "2618kg",
    engine: "SDMO",
    fuelTankCapacity: 860
  },
  {
    name: "SDMO R165 C3",
    model: "R165 C3",
    power: "120/150 kW",
    description: "Agregat prądotwórczy SDMO R165 C3, automatyka 3. stopnia",
    fuelConsumption75: 24.5,
    dimensions: "3520x1190x2120mm", 
    weight: "2618kg",
    engine: "SDMO",
    fuelTankCapacity: 860
  },
  {
    name: "SDMO J165",
    model: "J165",
    power: "120/150 kW",
    description: "Agregat prądotwórczy SDMO J165, seria J",
    fuelConsumption75: 26.1,
    dimensions: "3590x1145x1775mm",
    weight: "2198kg",
    engine: "SDMO", 
    fuelTankCapacity: 334
  },
  {
    name: "SDMO J165 C3",
    model: "J165 C3",
    power: "119/149 kW",
    description: "Agregat prądotwórczy SDMO J165 C3, automatyka 3. stopnia",
    fuelConsumption75: 26.1,
    dimensions: "3590x1200x2072mm",
    weight: "2590kg",
    engine: "SDMO",
    fuelTankCapacity: 868
  },
  {
    name: "SDMO J165 K",
    model: "J165 K", 
    power: "120/150 kW",
    description: "Agregat prądotwórczy SDMO J165 K, wersja kompaktowa",
    fuelConsumption75: 25.0,
    dimensions: "3508x1200x1830mm",
    weight: "2198kg",
    engine: "SDMO",
    fuelTankCapacity: 340
  },
  {
    name: "SDMO R220 C3",
    model: "R220 C3",
    power: "160/200 kW",
    description: "Agregat prądotwórczy SDMO R220 C3, automatyka 3. stopnia", 
    fuelConsumption75: 37.6,
    dimensions: "3520x1190x2120mm",
    weight: "2786kg",
    engine: "SDMO",
    fuelTankCapacity: 860
  },
  {
    name: "SDMO R220 C5",
    model: "R220 C5",
    power: "120/150 kW",
    description: "Agregat prądotwórczy SDMO R220 C5, automatyka 5. stopnia",
    fuelConsumption75: 26.7,
    dimensions: "2884x1191x2368mm",
    weight: "3454kg",
    engine: "SDMO", 
    fuelTankCapacity: 735
  },
  {
    name: "SDMO J220",
    model: "J220",
    power: "160/200 kW", 
    description: "Agregat prądotwórczy SDMO J220, seria J",
    fuelConsumption75: 35.2,
    dimensions: "3590x1200x2072mm",
    weight: "2930kg",
    engine: "SDMO",
    fuelTankCapacity: 1790
  },
  {
    name: "SDMO V350",
    model: "V350",
    power: "254/318 kW",
    description: "Agregat prądotwórczy SDMO V350, wysoka moc",
    fuelConsumption75: 55.0,
    dimensions: "4475x1410x2430mm",
    weight: "4035kg", 
    engine: "SDMO",
    fuelTankCapacity: 470
  },
  {
    name: "SDMO D440",
    model: "D440", 
    power: "320/400 kW",
    description: "Agregat prądotwórczy SDMO D440, seria przemysłowa",
    fuelConsumption75: 65.1,
    dimensions: "5030x1560x2435mm",
    weight: "4125kg",
    engine: "SDMO",
    fuelTankCapacity: 500
  },
  {
    name: "SDMO D440 DW",
    model: "D440 DW",
    power: "320/400 kW",
    description: "Agregat prądotwórczy SDMO D440 DW, wersja wyciszona",
    fuelConsumption75: 65.1,
    dimensions: "5083x1560x2700mm", 
    weight: "4915kg",
    engine: "SDMO",
    fuelTankCapacity: 1770
  },
  {
    name: "SDMO D550",
    model: "D550",
    power: "400/500 kW",
    description: "Agregat prądotwórczy SDMO D550, najwyższa moc",
    fuelConsumption75: 83.4,
    dimensions: "5030x1560x2435mm",
    weight: "4257kg",
    engine: "SDMO",
    fuelTankCapacity: 500
  },
  {
    name: "SDMO R550 C3", 
    model: "R550 C3",
    power: "400/500 kW",
    description: "Agregat prądotwórczy SDMO R550 C3, automatyka 3. stopnia",
    fuelConsumption75: 79.8,
    dimensions: "5000x1611x2600mm",
    weight: "6082kg",
    engine: "SDMO",
    fuelTankCapacity: 1481
  }
];

async function seedGenerators() {
  console.log('Seeding generators...');
  
  const generatorsCategoryId = 26; // Agregaty prądotwórcze
  
  try {
    for (const generator of generators) {
      console.log(`Adding generator: ${generator.name}`);
      
      const [insertedGenerator] = await db
        .insert(equipment)
        .values({
          ...generator,
          categoryId: generatorsCategoryId,
          isActive: true
        })
        .returning();
      
      console.log(`✓ Added generator: ${generator.name}`);
      
      // Add standard pricing tiers
      const pricingTiers = [
        { periodStart: 1, periodEnd: 2, pricePerDay: "450.00", discountPercent: "0.00" },
        { periodStart: 3, periodEnd: 7, pricePerDay: "405.00", discountPercent: "10.00" },
        { periodStart: 8, periodEnd: 18, pricePerDay: "360.00", discountPercent: "20.00" },
        { periodStart: 19, periodEnd: 29, pricePerDay: "315.00", discountPercent: "30.00" },
        { periodStart: 30, periodEnd: null, pricePerDay: "270.00", discountPercent: "40.00" }
      ];
      
      for (const tier of pricingTiers) {
        await db.insert(equipmentPricing).values({
          equipmentId: insertedGenerator.id,
          ...tier
        });
      }
      
      console.log(`Added pricing tiers for: ${generator.name}`);
    }
    
    console.log('Generators seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding generators:', error);
    process.exit(1);
  }
}

seedGenerators();