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

    // If initialization fails, clear the cached promise so next call retries
    dataSourcePromise.catch(() => {
      dataSourcePromise = null;
    });
  }
  return dataSourcePromise;
}
