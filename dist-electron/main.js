import { app, ipcMain, BrowserWindow } from "electron";
import { fileURLToPath as fileURLToPath$1 } from "node:url";
import path$1 from "node:path";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
function createTables(db2) {
  const tableExists = (name) => {
    const row = db2.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(name);
    return !!row;
  };
  if (!tableExists("products")) {
    db2.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER DEFAULT 0,
        price REAL DEFAULT 0
      );
    `);
    console.log('✅ Table "products" created');
  } else {
    console.log('ℹ️ Table "products" already exists');
  }
  if (!tableExists("operations")) {
    db2.exec(`
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
    db2.exec(`
      CREATE TABLE operation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        operation_id INTEGER NOT NULL, 
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,

        quantity INTEGER NOT NULL,
        price REAL NOT NULL
      );
    `);
    console.log('✅ Table "operation_items" created');
  } else {
    console.log('ℹ️ Table "operation_items" already exists');
  }
}
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$2 = path.dirname(__filename$1);
const isProd = app.isPackaged;
const basePath = isProd ? path.join(process.resourcesPath, "database") : path.join(__dirname$2, "database");
const dbPath = path.join(basePath, "app.db");
if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true });
}
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
function initDb() {
  createTables(db);
}
const ProductRepo = {
  getListInput(search) {
    const where = search ? `WHERE name LIKE @search OR code LIKE @search OR category LIKE @search LIMIT 10` : "";
    return db.prepare(
      `SELECT id, code, name, quantity FROM products
        ${where}`
    ).all({
      search: `%${search}%`
    });
  },
  getList({ search = "", limit = 50, offset = 0 }) {
    const where = search ? `WHERE name LIKE @search OR code LIKE @search OR category LIKE @search` : "";
    return db.prepare(
      `SELECT * FROM products
        ${where}
        LIMIT @limit OFFSET @offset`
    ).all({
      search: `%${search}%`,
      limit,
      offset
    });
  },
  count(search = "") {
    const where = search ? `WHERE name LIKE @search OR code LIKE @search OR category LIKE @search` : "";
    const result = db.prepare(
      `SELECT COUNT(*) as count 
        FROM products ${where}`
    ).get({ search: `%${search}%` });
    return result.count;
  },
  getById(id) {
    return db.prepare(`SELECT * FROM products WHERE id = ?`).get(id);
  },
  create(product) {
    return db.prepare(
      `
      INSERT INTO products (code, name, category, quantity, price)
      VALUES (@code, @name, @category, @quantity, @price)
    `
    ).run(product);
  },
  update(id, product) {
    return db.prepare(
      `
      UPDATE products
      SET code = @code,
          name = @name,
          category = @category,
          quantity = @quantity,
          price = @price
      WHERE id = @id
    `
    ).run({ ...product, id });
  },
  delete(id) {
    return db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
  }
};
const OperationRepo = {
  create(operation) {
    const trx = db.transaction(() => {
      const result = db.prepare(
        `
      INSERT INTO operations (type, date, comment)
      VALUES (?, ?, ?)
    `
      ).run(
        operation.type,
        operation.date ?? (/* @__PURE__ */ new Date()).toISOString(),
        operation.comment ?? null
      );
      const operationId = Number(result.lastInsertRowid);
      for (const item of operation.items) {
        const product = db.prepare(
          `
        SELECT code, name, category, quantity
        FROM products
        WHERE id = ?
      `
        ).get(item.product_id);
        if (!product) {
          throw new Error("Товар не знайдено");
        }
        if (operation.type === "out" && product.quantity < item.quantity) {
          throw new Error("Недостатньо товару на складі");
        }
        db.prepare(
          `
        INSERT INTO operation_items
        (operation_id, code, name, category, quantity, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `
        ).run(
          operationId,
          product.code,
          product.name,
          product.category,
          item.quantity,
          item.price
        );
        const delta = operation.type === "in" ? item.quantity : -item.quantity;
        db.prepare(
          `
        UPDATE products
        SET quantity = quantity + ?
        WHERE id = ?
      `
        ).run(delta, item.product_id);
      }
      return operationId;
    });
    return trx();
  },
  getList(params) {
    const { limit = 30, offset = 0, type, from, to, search } = params;
    let query = `
    SELECT
      o.id,
      o.type,
      o.date,
      o.comment,
      COALESCE(SUM(oi.quantity * oi.price), 0) AS total
    FROM operations o
    LEFT JOIN operation_items oi ON o.id = oi.operation_id
    WHERE 1=1
  `;
    const args = [];
    if (type) {
      query += ` AND o.type = ?`;
      args.push(type);
    }
    if (from) {
      query += ` AND DATE(o.date) >= DATE(?)`;
      args.push(from);
    }
    if (to) {
      query += ` AND DATE(o.date) <= DATE(?)`;
      args.push(to);
    }
    if (search) {
      query += ` AND (oi.code LIKE ? OR oi.name LIKE ? OR oi.category LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += `
    GROUP BY o.id
    ORDER BY o.date DESC
    LIMIT ? OFFSET ?
  `;
    args.push(limit, offset);
    const items = db.prepare(query).all(...args);
    let totalQuery = `
    SELECT COUNT(DISTINCT o.id) as count
    FROM operations o
    LEFT JOIN operation_items oi ON o.id = oi.operation_id
    WHERE 1=1
  `;
    const totalArgs = [];
    if (type) {
      totalQuery += ` AND o.type = ?`;
      totalArgs.push(type);
    }
    if (from) {
      totalQuery += ` AND DATE(o.date) >= DATE(?)`;
      totalArgs.push(from);
    }
    if (to) {
      totalQuery += ` AND DATE(o.date) <= DATE(?)`;
      totalArgs.push(to);
    }
    if (search) {
      totalQuery += ` AND (oi.code LIKE ? OR oi.name LIKE ? OR oi.category LIKE ?)`;
      totalArgs.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const { count = 0 } = db.prepare(totalQuery).get(...totalArgs);
    return { items, total: count };
  },
  getItems(operationId) {
    return db.prepare(
      `
    SELECT
      id,
      code as product_code,
      name as product_name,
      category as product_category,
      quantity,
      price,
      (quantity * price) as total
    FROM operation_items
    WHERE operation_id = ?
  `
    ).all(operationId);
  },
  deleteOperation(operationId) {
    const trx = db.transaction(() => {
      db.prepare(`DELETE FROM operation_items WHERE operation_id = ?`).run(
        operationId
      );
      db.prepare(`DELETE FROM operations WHERE id = ?`).run(operationId);
    });
    return trx();
  }
};
ipcMain.handle("products:list", (_e, params) => {
  const items = ProductRepo.getList(params);
  const total = ProductRepo.count(params.search || "");
  return { items, total };
});
ipcMain.handle("products:add", (_, product) => {
  ProductRepo.create(product);
  return true;
});
ipcMain.handle("products:update", (_, product) => {
  if (!product.id) {
    throw new Error("Product ID is required for update");
  }
  ProductRepo.update(product.id, product);
  return true;
});
ipcMain.handle("products:delete", (_, id) => {
  ProductRepo.delete(id);
  return true;
});
ipcMain.handle("products:getById", (_, id) => {
  return ProductRepo.getById(id);
});
ipcMain.handle("products:getListInput", (_, params) => {
  return ProductRepo.getListInput(params);
});
ipcMain.handle("operation:add", (_, operation) => {
  try {
    const operationId = OperationRepo.create(operation);
    return {
      success: true,
      id: Number(operationId)
    };
  } catch (e) {
    return {
      success: false,
      message: e.message
    };
  }
});
ipcMain.handle("operations:list", (_e, params) => {
  return OperationRepo.getList(params);
});
ipcMain.handle("operations:getItems", (_e, operationId) => {
  return OperationRepo.getItems(operationId);
});
ipcMain.handle("operations:delete", (_e, operationId) => {
  return OperationRepo.deleteOperation(operationId);
});
const __dirname$1 = path$1.dirname(fileURLToPath$1(import.meta.url));
process.env.APP_ROOT = path$1.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path$1.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path$1.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path$1.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    icon: path$1.join(process.env.VITE_PUBLIC, "logo.png"),
    webPreferences: {
      preload: path$1.join(__dirname$1, "preload.mjs")
    }
  });
  win.maximize();
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path$1.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(() => {
  initDb();
  createWindow();
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
