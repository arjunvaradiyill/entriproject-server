import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();
mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {
    const adminExists = await User.findOne({ email: "admin@example.com" });

    if (!adminExists) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const admin = new User({
            name: "Admin User",
            email: "admin@example.com",
            password: hashedPassword,
            isAdmin: true
        });

        await admin.save();
        console.log("✅ Admin user created successfully");
    } else {
        console.log("⚠️ Admin already exists");
    }

    mongoose.connection.close();
};

createAdmin();
