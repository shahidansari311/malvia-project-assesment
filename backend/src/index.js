const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

require("./config/db"); // initialise Supabase client & test connection

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:5173", "http://localhost:4173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, Postman, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("CORS policy violation"));
    },
    credentials: true,
  }),
);

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(express.json({ limit: "10kb" }));

// ── HEALTH CHECK ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", app: "Malvia Games API", version: "1.0.0" });
});

// ── ROUTES ────────────────────────────────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const marketRoutes = require("./routes/marketRoutes");
const betRoutes = require("./routes/betRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/bets", betRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(
    `✅ Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`,
  );
});

module.exports = { app };
