import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../database/prisma.js";
import { JWT_SECRET, authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Register new garage with admin user
router.post("/register", async (req, res) => {
  try {
    const {
      garageName,
      garageEmail,
      garagePhone,
      garageAddress,
      userName,
      userEmail,
      password,
    } = req.body;

    // Validate required fields
    if (!garageName || !garageEmail || !userName || !userEmail || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if garage email already exists
    const existingGarage = await prisma.garage.findUnique({
      where: { email: garageEmail },
    });
    if (existingGarage) {
      return res.status(409).json({ error: "Garage email already registered" });
    }

    // Check if user email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (existingUser) {
      return res.status(409).json({ error: "User email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { garage, user } = await prisma.$transaction(async (tx) => {
      const garage = await tx.garage.create({
        data: {
          name: garageName,
          email: garageEmail,
          phone: garagePhone,
          address: garageAddress,
        },
      });
      const user = await tx.user.create({
        data: {
          garageId: garage.id,
          email: userEmail,
          passwordHash,
          name: userName,
          role: "admin",
        },
      });
      return { garage, user };
    });

    const token = jwt.sign(
      {
        userId: user.id,
        garageId: user.garageId,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user.id,
        garage_id: user.garageId,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.isActive,
        created_at: user.createdAt,
      },
      garage: {
        id: garage.id,
        name: garage.name,
        email: garage.email,
        subscription_status: garage.subscriptionStatus,
      },
    });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { garage: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: "User account is deactivated" });
    }

    if (!user.garage.isActive) {
      return res.status(403).json({ error: "Garage account is deactivated" });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        garageId: user.garageId,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        garage_id: user.garageId,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.isActive,
      },
      garage: {
        name: user.garage.name,
        email: user.garage.email,
        subscription_status: user.garage.subscriptionStatus,
      },
    });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user info
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { garage: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        garage_id: user.garageId,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.isActive,
      },
      garage: {
        name: user.garage.name,
        email: user.garage.email,
        subscription_status: user.garage.subscriptionStatus,
      },
    });
  } catch (_error) {
    console.error("Server error:", _error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
