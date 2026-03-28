import "reflect-metadata";
import { Connection, Request } from "tedious";

const config = {
  server: process.env.DATABASE_HOST || "localhost",
  authentication: {
    type: "default" as const,
    options: {
      userName: process.env.DATABASE_USER || "sa",
      password: process.env.DATABASE_PASSWORD || "",
    },
  },
  options: {
    port: Number(process.env.DATABASE_PORT) || 1433,
    trustServerCertificate: true,
    database: "master",
  },
};

function runSql(connection: Connection, sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new Request(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
    connection.execSqlBatch(request);
  });
}

async function init() {
  const connection = new Connection(config);

  await new Promise<void>((resolve, reject) => {
    connection.on("connect", (err) => {
      if (err) reject(err);
      else resolve();
    });
    connection.connect();
  });

  console.log("Connected to SQL Server");

  const dbName = process.env.DATABASE_NAME || "nps_insight_engine";

  // Validate database name — alphanumeric, underscores, hyphens only
  if (!/^[a-zA-Z0-9_-]+$/.test(dbName)) {
    throw new Error(`Invalid database name: "${dbName}". Use only alphanumeric characters, underscores, and hyphens.`);
  }

  await runSql(
    connection,
    `IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbName}') CREATE DATABASE [${dbName}]`
  );
  console.log(`Database '${dbName}' ready`);

  connection.close();

  // Now test TypeORM connection
  const { AppDataSource } = await import("./data-source");
  await AppDataSource.initialize();
  console.log("TypeORM connected and tables synchronized");
  await AppDataSource.destroy();
  console.log("Database initialization complete!");
}

init().catch((err) => {
  console.error("Database initialization failed:", err.message);
  process.exit(1);
});
