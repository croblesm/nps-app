import "reflect-metadata";
import { DataSource } from "typeorm";

const isProduction = process.env.NODE_ENV === "production";

// Lazy entity loader — avoids circular dependency issues with webpack
// Entities reference each other (Project→Comment→Category→Comment),
// which causes "Cannot access X before initialization" when imported at top level.
function getEntities() {
  return [
    require("./entities/Project").Project,
    require("./entities/DataSource").DataSource,
    require("./entities/ReportStructure").ReportStructure,
    require("./entities/Category").Category,
    require("./entities/NoiseFilter").NoiseFilter,
    require("./entities/Comment").Comment,
    require("./entities/Summary").Summary,
    require("./entities/LlmConfig").LlmConfig,
  ];
}

export const AppDataSource = new DataSource({
  type: "mssql",
  host: process.env.DATABASE_HOST || "localhost",
  port: Number(process.env.DATABASE_PORT) || 1433,
  username: process.env.DATABASE_USER || "sa",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "nps_insight_engine",
  synchronize: !isProduction,
  logging: !isProduction,
  entities: getEntities(),
  options: {
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 2,
    idleTimeoutMillis: 30000,
  },
});
