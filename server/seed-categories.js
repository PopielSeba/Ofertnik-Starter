import { db } from './db.ts';
import { equipmentCategories } from '../shared/schema.ts';
import { eq } from 'drizzle-orm';

const categories = [
  {
    name: "Klimatyzacje",
    description: "Urządzenia klimatyzacyjne i chłodnicze"
  },
  {
    name: "Nagrzewnice", 
    description: "Nagrzewnice olejowe i gazowe"
  },
  {
    name: "Maszty oświetleniowe",
    description: "Maszty i wieże oświetleniowe"
  },
  {
    name: "Agregaty prądotwórcze",
    description: "Generatory prądu różnych mocy"
  },
  {
    name: "Kurtyny powietrzne",
    description: "Kurtyny powietrzne i zasłony termiczne"
  },
  {
    name: "Wyciągi spalin",
    description: "Systemy wentylacji i wyciągu spalin"
  }
];

async function seedCategories() {
  console.log('Seeding equipment categories...');
  
  try {
    for (const category of categories) {
      console.log(`Adding category: ${category.name}`);
      
      // Check if category already exists
      const existing = await db
        .select()
        .from(equipmentCategories)
        .where(eq(equipmentCategories.name, category.name));
        
      if (existing.length === 0) {
        await db
          .insert(equipmentCategories)
          .values(category);
        console.log(`✓ Added category: ${category.name}`);
      } else {
        console.log(`- Category already exists: ${category.name}`);
      }
    }
    
    console.log('Categories seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();