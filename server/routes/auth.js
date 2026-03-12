import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../database/init.js";
import { JWT_SECRET, authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Register new garage with admin user
router.post("/register", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

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
    const garageCheck = await client.query(
      "SELECT id FROM garages WHERE email = $1",
      [garageEmail],
    );
    if (garageCheck.rows.length > 0) {
      return res.status(409).json({ error: "Garage email already registered" });
    }

    // Check if user email already exists
    const userCheck = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [userEmail],
    );
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: "User email already registered" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create garage
    const garageResult = await client.query(
      "INSERT INTO garages (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *",
      [garageName, garageEmail, garagePhone, garageAddress],
    );
    const garage = garageResult.rows[0];

    // Create admin user
    const userResult = await client.query(
      "INSERT INTO users (garage_id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, garage_id, email, name, role, is_active, created_at",
      [garage.id, userEmail, passwordHash, userName, "admin"],
    );
    const user = userResult.rows[0];

    await client.query("COMMIT");

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        garageId: user.garage_id,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(201).json({
      message: "Registration successful",
      token,
      user,
      garage: {
        id: garage.id,
        name: garage.name,
        email: garage.email,
        subscription_status: garage.subscription_status,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user with garage info
    const result = await pool.query(
      `SELECT
        u.id, u.garage_id, u.email, u.password_hash, u.name, u.role, u.is_active,
        g.name as garage_name, g.email as garage_email, g.subscription_status, g.is_active as garage_is_active
      FROM users u
      JOIN garages g ON u.garage_id = g.id
      WHERE u.email = $1`,
      [email],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: "User account is deactivated" });
    }

    // Check if garage is active
    if (!user.garage_is_active) {
      return res.status(403).json({ error: "Garage account is deactivated" });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        garageId: user.garage_id,
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
        garage_id: user.garage_id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
      },
      garage: {
        name: user.garage_name,
        email: user.garage_email,
        subscription_status: user.subscription_status,
      },
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user info
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // Get user info
    const result = await pool.query(
      `SELECT
        u.id, u.garage_id, u.email, u.name, u.role, u.is_active,
        g.name as garage_name, g.email as garage_email, g.subscription_status
      FROM users u
      JOIN garages g ON u.garage_id = g.id
      WHERE u.id = $1`,
      [req.user.userId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        garage_id: user.garage_id,
        email: user.email,
        name: user.name,
        role: user.role,
        is_active: user.is_active,
      },
      garage: {
        name: user.garage_name,
        email: user.garage_email,
        subscription_status: user.subscription_status,
      },
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
