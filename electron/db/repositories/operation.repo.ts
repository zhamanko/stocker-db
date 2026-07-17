import { db } from "./../sqlite";

export type OperationType = "in" | "out";

export type OperationRow = {
  id: number;
  type: OperationType;
  date: string;
  comment: string | null;
  total: number;
};

export type OperationItemView = {
  id: number;
  product_code: string;
  product_name: string;
  product_category: string;
  quantity: number;
  price: number;
  total: number;
};

export type ProductItem = {
  product_id: number;
  quantity: number;
  price: number;
};

export type ProductCheck = {
  type: OperationType;
  items: ProductItem[];
  date?: string;
  comment?: string;
};

export type OperationListParams = {
  limit?: number;
  offset?: number;
  type?: OperationType;
  from?: string;
  to?: string;
  search?: string;
};

export type DeleteOperationResult = {
  deletedOperationId: number;
  restoredItemsCount: number;
};

type ProductRow = {
  code: string;
  name: string;
  category: string;
  quantity: number;
};

type OperationForDelete = {
  id: number;
  type: OperationType;
};

type OperationItemForDelete = {
  code: string;
  quantity: number;
};

export const OperationRepo = {
  create(operation: ProductCheck): number {
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
          .get(item.product_id) as ProductRow | undefined;

        if (!product) {
          throw new Error(
            `Товар з id ${item.product_id} не знайдено`
          );
        }

        if (operation.type === "out" && product.quantity < item.quantity) {
          throw new Error(
            `Недостатньо товару "${product.name}" на складі`
          );
        }

        // Зберігаємо дані товару на момент створення операції.
        db.prepare(
          `
            INSERT INTO operation_items
              (
                operation_id,
                code,
                name,
                category,
                quantity,
                price
              )
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

        const quantityDelta =
          operation.type === "in"
            ? item.quantity
            : -item.quantity;

        const updateResult = db
          .prepare(
            `
              UPDATE products
              SET quantity = quantity + ?
              WHERE id = ?
            `
          )
          .run(quantityDelta, item.product_id);

        if (updateResult.changes === 0) {
          throw new Error(
            `Не вдалося оновити товар з id ${item.product_id}`
          );
        }
      }

      return operationId;
    });

    return trx();
  },

  getList(
    params: OperationListParams = {}
  ): {
    items: OperationRow[];
    total: number;
  } {
    const {
      limit = 30,
      offset = 0,
      type,
      from,
      to,
      search,
    } = params;

    let query = `
      SELECT
        o.id,
        o.type,
        o.date,
        o.comment,
        COALESCE(SUM(oi.quantity * oi.price), 0) AS total
      FROM operations o
      LEFT JOIN operation_items oi
        ON o.id = oi.operation_id
      WHERE 1 = 1
    `;

    const args: Array<string | number> = [];

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
      query += `
        AND (
          oi.code LIKE ?
          OR oi.name LIKE ?
          OR oi.category LIKE ?
        )
      `;

      const searchValue = `%${search}%`;

      args.push(
        searchValue,
        searchValue,
        searchValue
      );
    }

    query += `
      GROUP BY o.id
      ORDER BY o.date DESC
      LIMIT ? OFFSET ?
    `;

    args.push(limit, offset);

    const items = db
      .prepare(query)
      .all(...args) as OperationRow[];

    let totalQuery = `
      SELECT COUNT(DISTINCT o.id) AS count
      FROM operations o
      LEFT JOIN operation_items oi
        ON o.id = oi.operation_id
      WHERE 1 = 1
    `;

    const totalArgs: Array<string | number> = [];

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
      totalQuery += `
        AND (
          oi.code LIKE ?
          OR oi.name LIKE ?
          OR oi.category LIKE ?
        )
      `;

      const searchValue = `%${search}%`;

      totalArgs.push(
        searchValue,
        searchValue,
        searchValue
      );
    }

    const totalResult = db
      .prepare(totalQuery)
      .get(...totalArgs) as {
        count?: number;
      };

    return {
      items,
      total: totalResult.count ?? 0,
    };
  },

  getItems(operationId: number): OperationItemView[] {
    return db
      .prepare(
        `
          SELECT
            id,
            code AS product_code,
            name AS product_name,
            category AS product_category,
            quantity,
            price,
            quantity * price AS total
          FROM operation_items
          WHERE operation_id = ?
        `
      )
      .all(operationId) as OperationItemView[];
  },

  deleteOperation(
    operationId: number
  ): DeleteOperationResult {
    const trx = db.transaction(
      (id: number): DeleteOperationResult => {
        const operation = db
          .prepare(
            `
              SELECT id, type
              FROM operations
              WHERE id = ?
            `
          )
          .get(id) as OperationForDelete | undefined;

        if (!operation) {
          throw new Error(
            `Операцію з id ${id} не знайдено`
          );
        }

        const items = db
          .prepare(
            `
              SELECT code, quantity
              FROM operation_items
              WHERE operation_id = ?
            `
          )
          .all(id) as OperationItemForDelete[];

        const increaseProductQuantity = db.prepare(
          `
            UPDATE products
            SET quantity = quantity + ?
            WHERE code = ?
          `
        );

        const decreaseProductQuantity = db.prepare(
          `
            UPDATE products
            SET quantity = quantity - ?
            WHERE code = ?
              AND quantity >= ?
          `
        );

        for (const item of items) {
          let changes = 0;

          if (operation.type === "out") {
            /*
             * Видаляємо операцію списання:
             * повертаємо списану кількість на склад.
             */
            const result = increaseProductQuantity.run(
              item.quantity,
              item.code
            );

            changes = result.changes;
          } else if (operation.type === "in") {
            /*
             * Видаляємо операцію надходження:
             * забираємо зі складу раніше додану кількість.
             */
            const result = decreaseProductQuantity.run(
              item.quantity,
              item.code,
              item.quantity
            );

            changes = result.changes;
          } else {
            throw new Error(
              `Невідомий тип операції: ${operation.type}`
            );
          }

          if (changes === 0) {
            throw new Error(
              `Не вдалося оновити товар з кодом "${item.code}". ` +
                "Товар не знайдено або на складі недостатньо залишку."
            );
          }
        }

        db.prepare(
          `
            DELETE FROM operation_items
            WHERE operation_id = ?
          `
        ).run(id);

        const deleteOperationResult = db
          .prepare(
            `
              DELETE FROM operations
              WHERE id = ?
            `
          )
          .run(id);

        if (deleteOperationResult.changes === 0) {
          throw new Error(
            `Не вдалося видалити операцію з id ${id}`
          );
        }

        return {
          deletedOperationId: id,
          restoredItemsCount: items.length,
        };
      }
    );

    return trx(operationId);
  },
};