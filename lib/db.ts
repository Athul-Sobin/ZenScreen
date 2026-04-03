import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "../shared/schema";

const expoDb = openDatabaseSync("zenscreen.db");
export const db = drizzle(expoDb, { schema });