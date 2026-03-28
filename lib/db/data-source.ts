import "reflect-metadata";
import { DataSource } from "typeorm";
import { Project } from "./entities/Project";
import { DataSource as DataSourceEntity } from "./entities/DataSource";
import { ReportStructure } from "./entities/ReportStructure";
import { Category } from "./entities/Category";
import { NoiseFilter } from "./entities/NoiseFilter";
import { Comment } from "./entities/Comment";
import { Summary } from "./entities/Summary";
import { LlmConfig } from "./entities/LlmConfig";

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 1433,
  username: process.env.DATABASE_USER || "sa",
  password: process.env.DATABASE_PASSWORD || "NpsEngine@2025",
  database: process.env.DATABASE_NAME || "nps_insight_engine",
  synchronize: true, // Auto-create tables in dev — disable in production
  logging: process.env.NODE_ENV === "development",
  entities: [
    Project,
    DataSourceEntity,
    ReportStructure,
    Category,
    NoiseFilter,
    Comment,
    Summary,
    LlmConfig,
  ],
  options: {
    trustServerCertificate: true,
  },
});
