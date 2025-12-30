import { app as R, ipcMain as s, BrowserWindow as _ } from "electron";
import { fileURLToPath as S } from "node:url";
import p from "node:path";
import U from "better-sqlite3";
import m from "path";
import O from "fs";
import { fileURLToPath as P } from "url";
function w(e) {
  const t = (n) => !!e.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(n);
  t("products") ? console.log('ℹ️ Table "products" already exists') : (e.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER DEFAULT 0,
        price REAL DEFAULT 0
      );
    `), console.log('✅ Table "products" created')), t("operations") ? console.log('ℹ️ Table "operations" already exists') : (e.exec(`
      CREATE TABLE operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        type TEXT NOT NULL,
        date TEXT DEFAULT CURRENT_TIMESTAMP,
        comment TEXT
      );
    `), console.log('✅ Table "operations" created')), t("operation_items") ? console.log('ℹ️ Table "operation_items" already exists') : (e.exec(`
      CREATE TABLE operation_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        operation_id INTEGER NOT NULL, 
        product_id INTEGER NOT NULL,

        quantity INTEGER NOT NULL,
        price REAL NOT NULL
      );
    `), console.log('✅ Table "operation_items" created'));
}
const C = P(import.meta.url), M = m.dirname(C), q = R.isPackaged, L = q ? m.join(process.resourcesPath, "database") : m.join(M, "database"), F = m.join(L, "app.db");
O.existsSync(L) || O.mkdirSync(L, { recursive: !0 });
const o = new U(F);
o.pragma("journal_mode = WAL");
o.pragma("foreign_keys = ON");
function b() {
  w(o);
}
const E = {
  getListInput(e) {
    const t = e ? "WHERE name LIKE @search OR code LIKE @search OR category LIKE @search LIMIT 10" : "";
    return o.prepare(
      `SELECT id, code, name, quantity FROM products
        ${t}`
    ).all({
      search: `%${e}%`
    });
  },
  getList({ search: e = "", limit: t = 50, offset: n = 0 }) {
    const i = e ? "WHERE name LIKE @search OR code LIKE @search OR category LIKE @search" : "";
    return o.prepare(
      `SELECT * FROM products
        ${i}
        LIMIT @limit OFFSET @offset`
    ).all({
      search: `%${e}%`,
      limit: t,
      offset: n
    });
  },
  count(e = "") {
    const t = e ? "WHERE name LIKE @search OR code LIKE @search OR category LIKE @search" : "";
    return o.prepare(
      `SELECT COUNT(*) as count 
        FROM products ${t}`
    ).get({ search: `%${e}%` }).count;
  },
  getById(e) {
    return o.prepare("SELECT * FROM products WHERE id = ?").get(e);
  },
  create(e) {
    return o.prepare(
      `
      INSERT INTO products (code, name, category, quantity, price)
      VALUES (@code, @name, @category, @quantity, @price)
    `
    ).run(e);
  },
  update(e, t) {
    return o.prepare(
      `
      UPDATE products
      SET code = @code,
          name = @name,
          category = @category,
          quantity = @quantity,
          price = @price
      WHERE id = @id
    `
    ).run({ ...t, id: e });
  },
  delete(e) {
    return o.prepare("DELETE FROM products WHERE id = ?").run(e);
  }
}, N = {
  create(e) {
    return o.transaction(() => {
      const i = o.prepare(`
        INSERT INTO operations (type, date, comment)
        VALUES (?, ?, ?)
      `).run(
        e.type,
        e.date ?? (/* @__PURE__ */ new Date()).toISOString(),
        e.comment ?? null
      ).lastInsertRowid;
      for (const r of e.items) {
        if (e.type === "out") {
          const a = o.prepare(`
            SELECT quantity FROM products WHERE id = ?
          `).get(r.product_id);
          if (!a)
            throw new Error("Товар не знайдено");
          if (a.quantity < r.quantity)
            throw new Error("Недостатньо товару на складі");
        }
        o.prepare(`
          INSERT INTO operation_items
          (operation_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `).run(
          i,
          r.product_id,
          r.quantity,
          r.price
        );
        const d = e.type === "in" ? r.quantity : -r.quantity;
        o.prepare(`
          UPDATE products
          SET quantity = quantity + ?
          WHERE id = ?
        `).run(d, r.product_id);
      }
      return i;
    })();
  },
  getList(e) {
    const { limit: t = 30, offset: n = 0, type: i, from: r, to: d, search: a } = e;
    let u = `
      SELECT o.id, o.type, o.date, o.comment,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total
      FROM operations o
      LEFT JOIN operation_items oi ON o.id = oi.operation_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1 
    `;
    const T = [];
    i && (u += " AND o.type = ?", T.push(i)), r && (u += " AND DATE(o.date) >= DATE(?)", T.push(r)), d && (u += " AND DATE(o.date) <= DATE(?)", T.push(d)), a && (u += " AND (p.code LIKE ? OR p.name LIKE ?)", T.push(`%${a}%`, `%${a}%`)), u += `
      GROUP BY o.id
      ORDER BY o.date DESC
      LIMIT ? OFFSET ? 
    `, T.push(t, n);
    const f = o.prepare(u).all(...T), g = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM operations o
      LEFT JOIN operation_items oi ON o.id = oi.operation_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1
      ${i ? " AND o.type = ?" : ""}
      ${r ? " AND DATE(o.date) >= DATE(?)" : ""}
      ${d ? " AND DATE(o.date) <= DATE(?)" : ""}
      ${a ? " AND (p.code LIKE ? OR p.name LIKE ?)" : ""}
    `, l = [];
    i && l.push(i), r && l.push(r), d && l.push(d), a && l.push(`%${a}%`, `%${a}%`);
    const { count: D = 0 } = o.prepare(g).get(...l) || {};
    return { items: f, total: D };
  },
  getItems(e) {
    return o.prepare(`
      SELECT oi.id, p.code as product_code, p.name as product_name,
             oi.quantity, oi.price, (oi.quantity * oi.price) as total
      FROM operation_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.operation_id = ?
    `).all(e);
  }
};
s.handle("products:list", (e, t) => {
  const n = E.getList(t), i = E.count(t.search || "");
  return { items: n, total: i };
});
s.handle("products:add", (e, t) => (E.create(t), !0));
s.handle("products:update", (e, t) => {
  if (!t.id)
    throw new Error("Product ID is required for update");
  return E.update(t.id, t), !0;
});
s.handle("products:delete", (e, t) => (E.delete(t), !0));
s.handle("products:getById", (e, t) => E.getById(t));
s.handle("products:getListInput", (e, t) => E.getListInput(t));
s.handle("operation:add", (e, t) => {
  try {
    const n = N.create(t);
    return {
      success: !0,
      id: Number(n)
    };
  } catch (n) {
    return {
      success: !1,
      message: n.message
    };
  }
});
s.handle("operations:list", (e, t) => N.getList(t));
s.handle("operations:getItems", (e, t) => N.getItems(t));
const y = p.dirname(S(import.meta.url));
process.env.APP_ROOT = p.join(y, "..");
const I = process.env.VITE_DEV_SERVER_URL, V = p.join(process.env.APP_ROOT, "dist-electron"), h = p.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = I ? p.join(process.env.APP_ROOT, "public") : h;
let c;
function A() {
  c = new _({
    icon: p.join(process.env.VITE_PUBLIC, "logo.png"),
    webPreferences: {
      preload: p.join(y, "preload.mjs")
    }
  }), c.webContents.on("did-finish-load", () => {
    c == null || c.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), I ? c.loadURL(I) : c.loadFile(p.join(h, "index.html"));
}
R.on("window-all-closed", () => {
  process.platform !== "darwin" && (R.quit(), c = null);
});
R.on("activate", () => {
  _.getAllWindows().length === 0 && A();
});
R.whenReady().then(() => {
  b(), A();
});
export {
  V as MAIN_DIST,
  h as RENDERER_DIST,
  I as VITE_DEV_SERVER_URL
};
