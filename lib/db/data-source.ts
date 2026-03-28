import "reflect-metadata";
import { DataSource } from "typeorm";

const isProduction = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 1433,
  username: process.env.DATABASE_USER || "sa",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "nps_insight_engine",
  // synchronize auto-creates tables in dev — NEVER use in production (use migrations instead)
  synchronize: !isProduction,
  logging: !isProduction,
  entities: [__dirname + "/entities/*.{ts,js}"],
  options: {
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  },
});
