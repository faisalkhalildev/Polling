const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, ".env.example") });
}

const express = require("express");
const cors = require("cors");
const { connectDB, requireDatabase } = require("./config/db");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const pollRoutes = require("./routes/pollRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

const allowedOrigins = [
  "http://localhost:4173",
  ...(process.env.CLIENT_URL || "").split(","),
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
]
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isVercelDeployment = (origin) =>
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

app.use(
  cors({
    origin: "*",
    Credential: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requireDatabase);
// Uploaded files use unique names, so browsers can safely keep them locally
// instead of downloading the same image again on every feed visit.
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d",
    immutable: true,
  }),
);

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "PollHub API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async (port) => {
  try {
    await connectDB();
  } catch (error) {
    console.error(`Unable to start without MongoDB: ${error.message}`);
    process.exit(1);
  }

  const server = app.listen(port, () =>
    console.log(`Server running on port ${port}`),
  );

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
      server.close(() => startServer(port + 1));
    } else {
      console.error(error);
      process.exit(1);
    }
  });
};

if (require.main === module) {
  startServer(Number(process.env.PORT) || 5000);
}

// Vercel imports the Express app as a serverless function.
module.exports = app;
