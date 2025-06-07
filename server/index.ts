import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import authRouter from "./routes/auth";
import { ensureAdminUser } from "./services/auth";

import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Register auth routes
app.use("/api", authRouter);

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server initialization...");

    // Create default admin user
    try {
      await ensureAdminUser("admin@restaurant.com", "admin123");
      log("Admin user check completed");
    } catch (error) {
      log(`Error ensuring admin user: ${error}`);
      throw error;
    }

    log("Registering routes...");
    const server = await registerRoutes(app);
    log("Routes registered successfully");

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error caught in middleware: ${err.message}`);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      log("Setting up Vite for development...");
      await setupVite(app, server);
      log("Vite setup completed");
    } else {
      log("Setting up static file serving...");
      serveStatic(app);
      log("Static file serving setup completed");
    }

    const PORT = process.env.PORT || 5000;
    const startServer = () => {
      server.listen(PORT, "0.0.0.0", () => {
        log(`Server running in ${app.get("env")} mode on port ${PORT}`);
      });

      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          log(`Port ${PORT} is busy, retrying in 5 seconds...`);
          setTimeout(() => {
            server.close();
            startServer();
          }, 5000);
        } else {
          log(`Server error: ${error.message}`);
          console.error('Server error:', error);
          process.exit(1);
        }
      });
    };

    startServer();
  } catch (error: any) {
    log(`Fatal startup error: ${error.message}`);
    console.error('Startup error:', error);
    process.exit(1);
  }
})();