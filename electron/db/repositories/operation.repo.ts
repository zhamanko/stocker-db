import { db } from "./../sqlite";

export type OperationRow = {
  id: number; // ID операції
  type: "in" | "out"; // тип операції: прихід або продаж
  date: string; // дата операції
  comment?: string; // коментар, якщо є
  total: number; // загальна сума всіх позицій
};

export type OperationItemView = {
  id: number; // ID позиції в операції (operation_items.id)
  product_code: string; // код товару
  product_name: string; // назва товару
  quantity: number; // кількість товару в цій позиції
  price: number; // ціна за одиницю
  total: number; // total = quantity * price
};

export type ProductItem = {
  product_id: number;
  quantity: number;
  price: number;
};

export type ProductCheck = {
  type: string;
  items: ProductItem[];
  date: string;
  comment?: string;
};

export const OperationRepo = {
  create(operation: ProductCheck) {
    const trx = db.transaction(() => {
      const result = db
        .prepare(
          `
      INSERT INTO operations (type, date, comment)
      VALUES (?, ?, ?)
    `
        )
        .run(
          operation.type,
          operation.date ?? new Date().toISOString(),
          operation.comment ?? null
        );

      const operationId = Number(result.lastInsertRowid);

      for (const item of operation.items) {
        const product = db
          .prepare(
            `
        SELECT code, name, category, quantity
        FROM products
        WHERE id = ?
      `
          )
          .get(item.product_id) as
          | {
              code: string;
              name: string;
              category: string;
              quantity: number;
            }
          | undefined;

        if (!product) {
          throw new Error("Товар не знайдено");
        }

        if (operation.type === "out" && product.quantity < item.quantity) {
          throw new Error("Недостатньо товару на складі");
        }

        // snapshot
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

  getList(params: {
    limit?: number;
    offset?: number;
    type?: "in" | "out";
    from?: string;
    to?: string;
    search?: string;
  }) {
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
      query += ` AND (oi.code LIKE ? OR oi.name LIKE ? OR oi.category LIKE ?)`;
      args.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += `
    GROUP BY o.id
    ORDER BY o.date DESC
    LIMIT ? OFFSET ?
  `;

    args.push(limit, offset);

    const items = db.prepare(query).all(...args) as OperationRow[];

    // 🔢 total
    let totalQuery = `
    SELECT COUNT(DISTINCT o.id) as count
    FROM operations o
    LEFT JOIN operation_items oi ON o.id = oi.operation_id
    WHERE 1=1
  `;

    const totalArgs: any[] = [];

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

    const { count = 0 } = db.prepare(totalQuery).get(...totalArgs) as {
      count?: number;
    };

    return { items, total: count };
  },

  getItems(operationId: number) {
    return db
      .prepare(
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
      )
      .all(operationId) as OperationItemView[];
  },

  deleteOperation(operationId: number) {
    const trx = db.transaction(() => {
      db.prepare(`DELETE FROM operation_items WHERE operation_id = ?`).run(
        operationId
      );

      db.prepare(`DELETE FROM operations WHERE id = ?`).run(operationId);
    });

    return trx();
  },
};
