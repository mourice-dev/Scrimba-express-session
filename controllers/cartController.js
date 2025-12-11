/** @format */

import { getDBConnection } from "../db/db.js";

export async function addToCart(req, res) {
  const db = await getDBConnection();

  const productId = parseInt(req.body.productId, 10);

  if (isNaN(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  const userId = req.session.userId;

  const existing = await db.get(
    "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?",
    [userId, productId]
  );

  if (existing) {
    await db.run("UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?", [
      existing.id,
    ]);
  } else {
    await db.run(
      "INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, 1)",
      [userId, productId]
    );
  }

  res.json({ message: "Added to cart" });
}

export async function getCartCount(req, res) {
  try {
    const db = await getDBConnection();
    const userId = req.session.userId;

    if (!userId) {
      await db.close();
      return res.json({ totalItems: 0 });
    }

    const result = await db.get(
      "SELECT SUM(quantity) AS totalItems FROM cart_items WHERE user_id = ?",
      [userId]
    );

    await db.close();

    const count = result?.totalItems || 0;
    return res.json({ totalItems: count });
  } catch (err) {
    console.error("getCartCount error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getAll(req, res) {
  // Don't touch this code!
  if (!req.session.userId) {
    return res.json({ err: "not logged in" });
  }

  try {
    const db = await getDBConnection();

    const items = await db.all(
      `SELECT 
        cart_items.id AS cartItemId,
        cart_items.quantity,
        products.title,
        products.artist,
        products.price
       FROM cart_items
       JOIN products ON cart_items.product_id = products.id
       WHERE cart_items.user_id = ?`,
      [req.session.userId]
    );

    await db.close();

    res.json({ items: items });
  } catch (err) {
    console.error("getAll error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function deleteItem(req, res) {
  try {
    const db = await getDBConnection();
    const { itemId } = req.params;
    const userId = req.session.userId;

    if (!userId) {
      await db.close();
      return res.status(401).json({ error: "User not logged in" });
    }

    if (!itemId) {
      await db.close();
      return res.status(400).json({ error: "Item ID is required" });
    }

    // Ensure the item belongs to the logged-in user for security
    const result = await db.run(
      "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
      [itemId, userId]
    );

    await db.close();

    if (result.changes === 0) {
      return res.status(404).json({ error: "Item not found or not authorized" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("deleteItem error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
