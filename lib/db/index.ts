import { AppDataSource } from "./data-source";

let initialized = false;

export async function getDb() {
  if (!initialized) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    initialized = true;
  }
  return AppDataSource;
}

export { AppDataSource } from "./data-source";
export * from "./entities";
