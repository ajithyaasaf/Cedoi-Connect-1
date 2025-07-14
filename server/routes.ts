import express, { type Express } from "express";
import { createServer } from "http";
import type { Server } from "http";
import { setupVite, serveStatic, log } from "./vite.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Since we're using Firestore directly from frontend, 
  // we only need static file serving and development setup
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server running with Firestore frontend integration" });
  });

  const server = createServer(app);

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000");
  return server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
}