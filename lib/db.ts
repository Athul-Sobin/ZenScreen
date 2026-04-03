import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

// Strictly synchronous database initialization for mobile
const expoDb = openDatabaseSync("zenscreen.db");
export const db = drizzle(expoDb);

export const initializeDb = async () => {
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Database synced successfully');
  } catch (e) {
    console.error('Database migration failed:', e);
  }
};