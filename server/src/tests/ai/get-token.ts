import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import { User } from "../../models/user.model.js";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected.");

  let user = await User.findOne({ email: "test-runner@genix.ui" });
  if (!user) {
    console.log("Test user not found. Creating one...");
    user = await User.create({
      name: "Test Runner",
      email: "test-runner@genix.ui",
      password: "password123",
      isEmailVerified: true,
      role: "user"
    });
    console.log("Test user created.");
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "7d" }
  );

  console.log("\n=================================");
  console.log("YOUR TEST JWT TOKEN:");
  console.log(token);
  console.log("=================================\n");

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
