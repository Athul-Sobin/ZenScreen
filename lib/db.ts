import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";

let dbInstance: any = null;

export function getDb() {
  if (!dbInstance) {
    console.log("DB INIT START");
    const expoDb = openDatabaseSync("zenscreen.db");
    dbInstance = drizzle(expoDb);
    console.log("DB INIT DONE");
  }
  return dbInstance;
}