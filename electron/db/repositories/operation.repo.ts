import { db } from "./../sqlite";

export type OperationRow = {
  id: number;           // ID операції
  type: "in" | "out";   // тип операції: прихід або продаж
  date: string;         // дата операції
  comment?: string;     // коментар, якщо є
  total: number;        // загальна сума всіх позицій
};

export type OperationItemView = {
  id: number;           // ID позиції в операції (operation_items.id)
  product_code: string; // код товару
  product_name: string; // назва товару
  quantity: number;     // кількість товару в цій позиції
  price: number;        // ціна за одиницю
  total: number;        // total = quantity * price
};


export type ProductItem = {
    product_id: number
    quantity: number
    price: number
}

export type ProductCheck = {
    type: string
    items: ProductItem[]
    date: string
    comment?: string
}

export const OperationRepo = {
    
   create(operation: ProductCheck) {
    const trx = db.transaction(() => {

      // 1️⃣ створюємо операцію
      const result = db.prepare(`
        INSERT INTO operations (type, date, comment)
        VALUES (?, ?, ?)
      `).run(
        operation.type,
        operation.date ?? new Date().toISOString(),
        operation.comment ?? null
      )

      const operationId = result.lastInsertRowid as number

      // 2️⃣ позиції
      for (const item of operation.items) {

        // 🔹 перевірка залишку
        if (operation.type === 'out') {
          const product = db.prepare(`
            SELECT quantity FROM products WHERE id = ?
          `).get(item.product_id) as { quantity: number } | undefined

          if (!product) {
            throw new Error('Товар не знайдено')
          }

          if (product.quantity < item.quantity) {
            throw new Error('Недостатньо товару на складі')
          }
        }

        // 🔹 додаємо позицію
        db.prepare(`
          INSERT INTO operation_items
          (operation_id, product_id, quantity, price)
          VALUES (?, ?, ?, ?)
        `).run(
          operationId,
          item.product_id,
          item.quantity,
          item.price
        )

        // 🔹 оновлюємо кількість товару
        const delta =
          operation.type === 'in'
            ? item.quantity
            : -item.quantity

        db.prepare(`
          UPDATE products
          SET quantity = quantity + ?
          WHERE id = ?
        `).run(delta, item.product_id)
      }

      return operationId
    })

    return trx()
  },

  getList(params: {
    limit?: number;
    offset?: number;
    type?: 'in' | 'out';
    from?: string;
    to?: string;
    search?: string;
  }) {
    const { limit = 30, offset = 0, type, from, to, search } = params;

    let query = `
      SELECT o.id, o.type, o.date, o.comment,
        COALESCE(SUM(oi.quantity * oi.price), 0) as total
      FROM operations o
      LEFT JOIN operation_items oi ON o.id = oi.operation_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1
    `;

    const args: any[] = [];

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
      query += ` AND (p.code LIKE ? OR p.name LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`);
    }

    query += `
      GROUP BY o.id
      ORDER BY o.date DESC
      LIMIT ? OFFSET ?
    `;

    args.push(limit, offset);

    const items = db.prepare(query).all(...args) as OperationRow[];

    const totalQuery = `
      SELECT COUNT(DISTINCT o.id) as count
      FROM operations o
      LEFT JOIN operation_items oi ON o.id = oi.operation_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE 1=1
      ${type ? ' AND o.type = ?' : ''}
      ${from ? ' AND DATE(o.date) >= DATE(?)' : ''}
      ${to ? ' AND DATE(o.date) <= DATE(?)' : ''}
      ${search ? ' AND (p.code LIKE ? OR p.name LIKE ?)' : ''}
    `;

    const totalArgs = [];
    if (type) totalArgs.push(type);
    if (from) totalArgs.push(from);
    if (to) totalArgs.push(to);
    if (search) totalArgs.push(`%${search}%`, `%${search}%`);

    const { count: total = 0 } = db.prepare(totalQuery).get(...totalArgs) as { count?: number } || {};

    return { items, total };
  },

  getItems(operationId: number) {
    return db.prepare(`
      SELECT oi.id, p.code as product_code, p.name as product_name,
             oi.quantity, oi.price, (oi.quantity * oi.price) as total
      FROM operation_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.operation_id = ?
    `).all(operationId) as OperationItemView[];
  }

}