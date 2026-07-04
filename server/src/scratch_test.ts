import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import env from "./config/env.js";
import { User } from "./models/user.model.js";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(env.MONGO_URI);
  console.log("Connected.");

  let user = await User.findOne();
  if (!user) {
    user = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "user",
      plan: "free",
      isEmailVerified: true,
      refreshTokenVersion: 0,
    });
  }

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.JWT_ACCESS_SECRET,
    { expiresIn: "15m" }
  );

  const payload = {
    prompt: "Create a modern animated button using React and TypeScript.",
    feature: "generate-component",
    model: "gemini-2.5-flash",
    status: "success",
    response: {
      tsx: "export const Button = () => <button>Click Me</button>;",
      css: ".btn { background: blue; }",
      usage: "<Button />"
    },
    generatedFiles: [
      "Button.tsx",
      "Button.css"
    ],
    tokens: 420,
    executionTime: 1650
  };

  const response = await fetch("http://localhost:5000/api/history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });

  console.log("Status:", response.status);
  const text = await response.text();
  console.log("Response:", text);

  await mongoose.disconnect();
}

main().catch(console.error);
