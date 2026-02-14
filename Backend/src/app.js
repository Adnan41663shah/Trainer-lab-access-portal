import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import { config } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import batchRoutes from "./routes/batch.routes.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

/* =========================
   CORS CONFIGURATION
========================= */

// Production origins
const allowedOrigins = [
  "https://trainer-lab-access-portal.vercel.app"
];

// Add localhost origins in development mode only
if (config.nodeEnv === "development") {
  allowedOrigins.push(
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
  );
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log rejected origin for debugging
    console.log(`CORS blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  exposedHeaders: ["Set-Cookie"],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS globally
app.use(cors(corsOptions));

/* =========================
   TRUST PROXY (VERCEL)
========================= */

app.set("trust proxy", 1);

/* =========================
   SECURITY MIDDLEWARE
========================= */

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

/* =========================
   BODY PARSERS
========================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* =========================
   COOKIE PARSER
========================= */

app.use(cookieParser());

/* =========================
   MONGO SANITIZER
========================= */

app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      Object.keys(obj).forEach((key) => {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else if (typeof obj[key] === "object") {
          sanitize(obj[key]);
        }
      });
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
});

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

/* =========================
   ROOT ENDPOINT
========================= */

app.get("/", (req, res) => {
  res.send("Trainer Lab Access Portal API Running");
});

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", authRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/users", userRoutes);

/* =========================
   ERROR HANDLING
========================= */

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
