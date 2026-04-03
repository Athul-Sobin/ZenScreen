import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

// Strictly synchronous database initialization for mobile
const expoDb = openDatabaseSync("zenscreen.db");
export const db = drizzle(expoDb);