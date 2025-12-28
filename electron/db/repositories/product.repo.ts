import { db } from "./../sqlite";

export type Product = {
  id?: number;
  code: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
};

export type ProductFilter = {
  search?: string;
  limit?: number;
  offset?: number;
};

export const ProductRepo = {
  getList({ search = "", limit = 50, offset = 0 }: ProductFilter) {
    const where = search
      ? `WHERE name LIKE @search OR code LIKE @search OR category LIKE @search`
      : "";

    return db
      .prepare(
        `SELECT * FROM products
        ${where}
        LIMIT @limit OFFSET @offset`
      )
      .all({
        search: `%${search}%`,
        limit: limit,
        offset: offset,
      }) as Product[]
  },
  
  count(search = ""): number {
    const where = search
      ? `WHERE name LIKE @search OR code LIKE @search OR category LIKE @search`
      : "";

    const result = db
      .prepare(
        `SELECT COUNT(*) as count 
        FROM products ${where}`)
        .get({ search: `%${search}%` }) as { count: number };

    return result.count;
  },

  getById(id: number): Product | undefined {
    return db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as
      | Product
      | undefined;
  },

  create(product: Product) {
    return db
      .prepare(
        `
      INSERT INTO products (code, name, category, quantity, price)
      VALUES (@code, @name, @category, @quantity, @price)
    `
      )
      .run(product);
  },

  update(id: number, product: Product) {
    return db
      .prepare(
        `
      UPDATE products
      SET code = @code,
          name = @name,
          category = @category,
          quantity = @quantity,
          price = @price
      WHERE id = @id
    `
      )
      .run({ ...product, id });
  },

  delete(id: number) {
    return db.prepare(`DELETE FROM products WHERE id = ?`).run(id);
  },
};
