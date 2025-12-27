import { Database } from 'better-sqlite3'

export function createTables(db: Database) {
  const tableExists = (name: string) => {
    const row = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(name)
    return !!row
  }

  if (!tableExists('products')) {
    db.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER DEFAULT 0,
        price REAL DEFAULT 0
      );
    `)
    console.log('✅ Table "products" created')
  } else {
    console.log('ℹ️ Table "products" already exists')
  }

  // Аналогічно для інших таблиць
  if (!tableExists('categories')) {
    db.exec(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
    `)
    console.log('✅ Table "categories" created')
  }
}
