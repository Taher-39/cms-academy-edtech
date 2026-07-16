import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "1.0.0.1"]);

import app from "./app";
import { connectToDB } from "./shared/lib/db";

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await connectToDB();
    console.log("✅ Connected to MongoDB");

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${PORT} is already in use!`);
        console.error(`Run: netstat -ano | findstr :${PORT}`);
        console.error(`Then: taskkill /PID <PID> /F\n`);
      } else {
        console.error("Server error:", err);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
