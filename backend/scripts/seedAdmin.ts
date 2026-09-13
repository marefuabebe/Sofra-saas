import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import bcrypt from "bcrypt";
import AdminUser from "../src/models/AdminUser";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/sofra";

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const email = "admin@sofra.com";
    const password = "adminpassword123";

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const existingAdmin = await AdminUser.findOne({ email });
    if (existingAdmin) {
      existingAdmin.password_hash = password_hash;
      await existingAdmin.save();
      console.log("Admin password updated!");
    } else {
      await AdminUser.create({
        email,
        password_hash,
        name: "Super Admin",
        isSuperAdmin: true,
        isActive: true,
      });
      console.log("Successfully created default admin user!");
    }

    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
