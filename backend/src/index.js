import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./utils/connectDB.js";

//Importing Routes
import promptRoutes from "./routes/prompt.route.js";
import collectionRoutes from "./routes/collection.route.js";
import followRoutes from "./routes/follow.route.js";
import notificationRoutes from "./routes/notification.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import { syncUser } from "./middlewares/syncUser.middleware.js";
import { requireAuth } from "./middlewares/requireAuth.middleware.js";

import { clerkMiddleware } from "@clerk/express";

dotenv.config();

const app = express();

// Security middleware
app.use(helmet());

// Rate limiter
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
    }),
);

// Body parser
app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        credentials: true,
    }),
);
app.use(clerkMiddleware());
app.use(syncUser);
app.use((req, res, next) => {
    console.log("REQ:", req.method, req.url);
    next();
});

// Test route
app.get("/", (req, res) => {
    res.send("API running...");
});

// Routes
app.use("/api/prompts", promptRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);

app.listen(process.env.PORT, () => {
    connectDB();
    console.log(`Server running on http://localhost:${process.env.PORT}`);
});
