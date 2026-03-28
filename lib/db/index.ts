let dataSourcePromise: Promise<import("typeorm").DataSource> | null = null;

export async function getDb() {
  if (!dataSourcePromise) {
    dataSourcePromise = (async () => {
      await import("reflect-metadata");
      const { AppDataSource } = await import("./data-source");
      if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
      }
      return AppDataSource;
    })();
  }
  return dataSourcePromise;
}
