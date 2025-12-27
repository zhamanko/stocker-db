import { app as a, ipcMain as d, BrowserWindow as E } from "electron";
import { fileURLToPath as g } from "node:url";
import o from "node:path";
import L from "better-sqlite3";
import s from "path";
import p from "fs";
import { fileURLToPath as f } from "url";
function _(e) {
  const n = (R) => !!e.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(R);
  n("products") ? console.log('ℹ️ Table "products" already exists') : (e.exec(`
      CREATE TABLE products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        category TEXT,
        quantity INTEGER DEFAULT 0,
        price REAL DEFAULT 0
      );
    `), console.log('✅ Table "products" created')), n("categories") || (e.exec(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
    `), console.log('✅ Table "categories" created'));
}
const A = f(import.meta.url), P = s.dirname(A), I = a.isPackaged, i = I ? s.join(process.resourcesPath, "database") : s.join(P, "database"), N = s.join(i, "app.db");
p.existsSync(i) || p.mkdirSync(i, { recursive: !0 });
const r = new L(N);
r.pragma("journal_mode = WAL");
r.pragma("foreign_keys = ON");
function O() {
  _(r);
}
const l = {
  getAll() {
    return r.prepare("SELECT * FROM products").all();
  },
  getById(e) {
    return r.prepare("SELECT * FROM products WHERE id = ?").get(e);
  },
  create(e) {
    return r.prepare(`
      INSERT INTO products (code, name, category, quantity, price)
      VALUES (@code, @name, @category, @quantity, @price)
    `).run(e);
  },
  update(e, n) {
    return r.prepare(`
      UPDATE products
      SET code = @code,
          name = @name,
          category = @category,
          quantity = @quantity,
          price = @price
      WHERE id = @id
    `).run({ ...n, id: e });
  },
  delete(e) {
    return r.prepare("DELETE FROM products WHERE id = ?").run(e);
  }
};
d.handle("products:get", () => l.getAll());
d.handle("products:add", (e, n) => (l.create(n), !0));
const T = o.dirname(g(import.meta.url));
process.env.APP_ROOT = o.join(T, "..");
const c = process.env.VITE_DEV_SERVER_URL, v = o.join(process.env.APP_ROOT, "dist-electron"), u = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = c ? o.join(process.env.APP_ROOT, "public") : u;
let t;
function m() {
  t = new E({
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: o.join(T, "preload.mjs")
    }
  }), t.webContents.on("did-finish-load", () => {
    t == null || t.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), c ? t.loadURL(c) : t.loadFile(o.join(u, "index.html"));
}
a.on("window-all-closed", () => {
  process.platform !== "darwin" && (a.quit(), t = null);
});
a.on("activate", () => {
  E.getAllWindows().length === 0 && m();
});
a.whenReady().then(() => {
  O(), m();
});
export {
  v as MAIN_DIST,
  u as RENDERER_DIST,
  c as VITE_DEV_SERVER_URL
};
