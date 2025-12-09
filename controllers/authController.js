/** @format */

import validator from "validator";
import { getDBConnection } from "../db/db.js";
import bcrypt from "bcryptjs";

export async function registerUser(req, res) {
  let { name, email, username, password } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  name = name.trim();
  email = email.trim();
  username = username.trim();

  if (!/^[a-zA-Z0-9_-]{1,20}$/.test(username)) {
    return res
      .status(400)
      .json({
        error:
          "Username must be 1–20 characters, using letters, numbers, _ or -.",
      });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  try {
    const db = await getDBConnection();

    const existing = await db.get(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existing) {
      return res
        .status(400)
        .json({ error: "Email or username already in use." });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await db.run(
      "INSERT INTO users (name, email, username, password) VALUES (?, ?, ?, ?)",
      [name, email, username, hashed]
    );
    console.log(result);

    req.session.userId = result.lastID;

    res.status(201).json({ message: "User registered" });
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
}

export async function loginUser(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const db = await getDBConnection();
    const user = await db.get("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (!user) {
      await db.close();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      await db.close();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    req.session.userId = user.id;
    await db.close();

    res.json({ message: "Logged in" });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/*
Challenge:
1. Create a function which logs out the user. 
- You can use the .destroy() method directly on the session.
- .destroy() takes a callback function which you can use to send a confirmation response with this JSON:
  { message: 'Logged out' }

You will need to write code here and in one other place!

Test with:
username: test
password: test
*/
export function logoutUser(req, res) {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
  
  
}