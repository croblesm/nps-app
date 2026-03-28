import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 1433,
  username: process.env.DATABASE_USER || "sa",
  password: process.env.DATABASE_PASSWORD || "NpsEngine@2025",
  database: process.env.DATABASE_NAME || "nps_insight_engine",
  synchronize: true,
  logging: process.env.NODE_ENV === "development",
  entities: [__dirname + "/entities/*.{ts,js}"],
  options: {
    trustServerCertificate: true,
  },
});
