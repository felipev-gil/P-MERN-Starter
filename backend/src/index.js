import "dotenv/config";
import mongoose from "mongoose";
import { readConfig } from "./config/env.js";
import { connectDatabase } from "./config/db.js";
import { createApp } from "./app.js";
import { User } from "./models/User.js";
import { Session } from "./models/Session.js";
try {
  const config = readConfig();
  await connectDatabase(config.mongoUri);
  await Promise.all([User.init(), Session.init()]);
  const server = createApp(config).listen(config.port, () =>
    console.log("API listening on port " + config.port),
  );
  server.on("error", async (error) => {
    console.error(
      error.code === "EADDRINUSE"
        ? "Startup failed: PORT is already in use."
        : "HTTP server failed: " + error.code,
    );
    await mongoose.disconnect();
    process.exitCode = 1;
  });
  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(async () => {
      await mongoose.disconnect();
      clearTimeout(timeout);
    });
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
} catch (error) {
  console.error(
    error.message.startsWith("Configuration error:") ||
      error.message.startsWith("Database connection failed.")
      ? error.message
      : "Startup failed while initializing the database. Check database access and indexes.",
  );
  await mongoose.disconnect();
  process.exitCode = 1;
}
