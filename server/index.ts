import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { extractTenant } from "./middleware/tenant.js";
import authRoutes from "./routes/auth.js";
import arretesRoutes from "./routes/arretes.js";
import referencesRoutes from "./routes/references.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// --- Middlewares globaux ---
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// --- Health check (sans authentification ni tenant) ---
app.get("/api/health", (_req, res) => {
  res.json({ data: { status: "ok", timestamp: new Date().toISOString() }, success: true });
});

// --- Routes d'authentification (pas de tenant requis pour le login) ---
app.use("/api/auth", authRoutes);

// --- Extraction du tenant pour toutes les routes métier ---
app.use("/api", extractTenant);

// --- Routes métier (tenant-scoped) ---
app.use("/api/arretes", arretesRoutes);
app.use("/api/references", referencesRoutes);

// --- Gestion des routes non trouvées ---
app.use((_req, res) => {
  res.status(404).json({
    data: null,
    success: false,
    error: "Route non trouvée",
  });
});

// --- Démarrage du serveur ---
app.listen(PORT, () => {
  console.log(`Serveur Arrêtés & Espace Public démarré sur le port ${PORT}`);
  console.log(`Health check : http://localhost:${PORT}/api/health`);
});

export default app;
