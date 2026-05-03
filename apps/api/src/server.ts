import { env } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";
import { app } from "./app.js";

async function boot() {
  await runMigrations();

  app.listen(env.PORT, () => {
    console.info(`API listening on port ${env.PORT}`);
  });
}

boot().catch((error) => {
  console.error("Failed to start server");
  console.error(error);
  process.exit(1);
});
