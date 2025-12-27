import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { createTables } from "./createTables";
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isProd = app.isPackaged

const basePath = isProd
  ? path.join(process.resourcesPath, 'database')
  : path.join(__dirname, 'database')

const dbPath = path.join(basePath, 'app.db')

if (!fs.existsSync(basePath)) {
  fs.mkdirSync(basePath, { recursive: true })
}

export const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDb() {
  createTables(db)
}
