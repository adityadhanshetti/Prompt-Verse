import mongoose from "mongoose";
import { config } from "dotenv";
config();

export const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(
            "Connected to MongoDB Successfully!",
            conn.connection.host,
        );
    } catch (error) {
        console.warn(
            "Failed to Connect to MongoDB",
            error.message,
        );
    }
};
