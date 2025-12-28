import { Database } from "better-sqlite3";

export function createTables(db: Database) {
  const tableExists = (name: string) => {
    const row = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
      .get(name);
    return !!row;
  };

  if (!tableExists("products")) {
    db.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER DEFAULT 0,
        price REAL DEFAULT 0
      );
    `);
    console.log('✅ Table "products" created');
  } else {
    console.log('ℹ️ Table "products" already exists');
  }

  if (!tableExists("operations")) {
    db.exec(`
      CREATE TABLE operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        type TEXT NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        comment TEXT
      );
    `);
    console.log('✅ Table "operations" created');
  } else {
    console.log('ℹ️ Table "operations" already exists');
  }

  if (!tableExists("operation_items")) {
    db.exec(`
      CREATE TABLE operation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        operation_id INTEGER NOT NULL, 
        product_id INTEGER NOT NULL,

        quantity INTEGER NOT NULL,
        price REAL NOT NULL
      );
    `);
    console.log('✅ Table "operation_items" created');
  } else {
    console.log('ℹ️ Table "operation_items" already exists');
  }
}
