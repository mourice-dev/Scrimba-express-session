import { getDBConnection } from './db/db.js'

async function initDb() {
  const db = await getDBConnection()

  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        product_id INTEGER,
        quantity INTEGER
      )
    `)
    console.log('Table cart_items created')
  } catch (err) {
    console.error('Error creating table:', err)
  } finally {
    await db.close()
  }
}

initDb()
