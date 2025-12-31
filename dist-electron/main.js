import { app as m, ipcMain as c, BrowserWindow as g } from "electron";
import { fileURLToPath as S } from "node:url";
import p from "node:path";
import U from "better-sqlite3";
import L from "path";
import y from "fs";
import { fileURLToPath as P } from "url";
function w(e) {
  const t = (r) => !!e.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(r);
  t("products") ? console.log('ℹ️ Table "products" already exists') : (e.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
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
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,

        quantity INTEGER NOT NULL,
        price REAL NOT NULL
      );
    `), console.log('✅ Table "operation_items" created'));
}
const C = P(import.meta.url), M = L.dirname(C), q = m.isPackaged, O = q ? L.join(process.resourcesPath, "database") : L.join(M, "database"), F = L.join(O, "app.db");
y.existsSync(O) || y.mkdirSync(O, { recursive: !0 });
const o = new U(F);
o.pragma("journal_mode = WAL");
o.pragma("foreign_keys = ON");
function b() {
  w(o);
}
const d = {
  getListInput(e) {
    const t = e ? "WHERE name LIKE @search OR code LIKE @search OR category LIKE @search LIMIT 10" : "";
    return o.prepare(
      `SELECT id, code, name, quantity FROM products
        ${t}`
    ).all({
      search: `%${e}%`
    });
  },
  getList({ search: e = "", limit: t = 50, offset: r = 0 }) {
    const a = e ? "WHERE name LIKE @search OR code LIKE @search OR category LIKE @search" : "";
    return o.prepare(
      `SELECT * FROM products
        ${a}
        LIMIT @limit OFFSET @offset`
    ).all({
      search: `%${e}%`,
      limit: t,
      offset: r
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
}, I = {
  create(e) {
    return o.transaction(() => {
      const r = o.prepare(
        `
      INSERT INTO operations (type, date, comment)
      VALUES (?, ?, ?)
    `
      ).run(
        e.type,
        e.date ?? (/* @__PURE__ */ new Date()).toISOString(),
        e.comment ?? null
      ), a = Number(r.lastInsertRowid);
      for (const n of e.items) {
        const i = o.prepare(
          `
        SELECT code, name, category, quantity
        FROM products
        WHERE id = ?
      `
        ).get(n.product_id);
        if (!i)
          throw new Error("Товар не знайдено");
        if (e.type === "out" && i.quantity < n.quantity)
          throw new Error("Недостатньо товару на складі");
        o.prepare(
          `
        INSERT INTO operation_items
        (operation_id, code, name, category, quantity, price)
        VALUES (?, ?, ?, ?, ?, ?)
      `
        ).run(
          a,
          i.code,
          i.name,
          i.category,
          n.quantity,
          n.price
        );
        const s = e.type === "in" ? n.quantity : -n.quantity;
        o.prepare(
          `
        UPDATE products
        SET quantity = quantity + ?
        WHERE id = ?
      `
        ).run(s, n.product_id);
      }
      return a;
    })();
  },
  getList(e) {
    const { limit: t = 30, offset: r = 0, type: a, from: n, to: i, search: s } = e;
    let u = `
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
    const T = [];
    a && (u += " AND o.type = ?", T.push(a)), n && (u += " AND DATE(o.date) >= DATE(?)", T.push(n)), i && (u += " AND DATE(o.date) <= DATE(?)", T.push(i)), s && (u += " AND (oi.code LIKE ? OR oi.name LIKE ? OR oi.category LIKE ?)", T.push(`%${s}%`, `%${s}%`, `%${s}%`)), u += `
    GROUP BY o.id
    ORDER BY o.date DESC
    LIMIT ? OFFSET ?
  `, T.push(t, r);
    const f = o.prepare(u).all(...T);
    let l = `
    SELECT COUNT(DISTINCT o.id) as count
    FROM operations o
    LEFT JOIN operation_items oi ON o.id = oi.operation_id
    WHERE 1=1
  `;
    const R = [];
    a && (l += " AND o.type = ?", R.push(a)), n && (l += " AND DATE(o.date) >= DATE(?)", R.push(n)), i && (l += " AND DATE(o.date) <= DATE(?)", R.push(i)), s && (l += " AND (oi.code LIKE ? OR oi.name LIKE ? OR oi.category LIKE ?)", R.push(`%${s}%`, `%${s}%`, `%${s}%`));
    const { count: D = 0 } = o.prepare(l).get(...R);
    return { items: f, total: D };
  },
  getItems(e) {
    return o.prepare(
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
    ).all(e);
  },
  deleteOperation(e) {
    return o.transaction(() => {
      o.prepare("DELETE FROM operation_items WHERE operation_id = ?").run(
        e
      ), o.prepare("DELETE FROM operations WHERE id = ?").run(e);
    })();
  }
};
c.handle("products:list", (e, t) => {
  const r = d.getList(t), a = d.count(t.search || "");
  return { items: r, total: a };
});
c.handle("products:add", (e, t) => (d.create(t), !0));
c.handle("products:update", (e, t) => {
  if (!t.id)
    throw new Error("Product ID is required for update");
  return d.update(t.id, t), !0;
});
c.handle("products:delete", (e, t) => (d.delete(t), !0));
c.handle("products:getById", (e, t) => d.getById(t));
c.handle("products:getListInput", (e, t) => d.getListInput(t));
c.handle("operation:add", (e, t) => {
  try {
    const r = I.create(t);
    return {
      success: !0,
      id: Number(r)
    };
  } catch (r) {
    return {
      success: !1,
      message: r.message
    };
  }
});
c.handle("operations:list", (e, t) => I.getList(t));
c.handle("operations:getItems", (e, t) => I.getItems(t));
c.handle("operations:delete", (e, t) => I.deleteOperation(t));
const _ = p.dirname(S(import.meta.url));
process.env.APP_ROOT = p.join(_, "..");
const N = process.env.VITE_DEV_SERVER_URL, V = p.join(process.env.APP_ROOT, "dist-electron"), h = p.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = N ? p.join(process.env.APP_ROOT, "public") : h;
let E;
function A() {
  E = new g({
    icon: p.join(process.env.VITE_PUBLIC, "logo.png"),
    webPreferences: {
      preload: p.join(_, "preload.mjs")
    }
  }), E.maximize(), E.webContents.on("did-finish-load", () => {
    E == null || E.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), N ? E.loadURL(N) : E.loadFile(p.join(h, "index.html"));
}
m.on("window-all-closed", () => {
  process.platform !== "darwin" && (m.quit(), E = null);
});
m.on("activate", () => {
  g.getAllWindows().length === 0 && A();
});
m.whenReady().then(() => {
  b(), A();
});
export {
  V as MAIN_DIST,
  h as RENDERER_DIST,
  N as VITE_DEV_SERVER_URL
};
