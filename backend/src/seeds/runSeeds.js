import mongoose from "mongoose";
import dotenv from "dotenv";

import { seedPrompts } from "./prompt.seed.js";

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB connected for seeding");

        await seedPrompts();

        console.log("✅ Seeding done!");
        process.exit();
    } catch (error) {
        console.log("❌ Seed runner error:", error.message);
        process.exit(1);
    }
};

run();
