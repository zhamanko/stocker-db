import { db } from './../sqlite'

export type Product = {
  id?: number
  code: string
  name: string
  category?: string
  quantity: number
  price: number
}

export const ProductRepo = {
  getAll(): Product[] {
    return db.prepare(`SELECT * FROM products`).all() as Product[]
  },

  getById(id: number): Product | undefined {
    return db.prepare(`SELECT * FROM products WHERE id = ?`).get(id) as Product | undefined
  },

  create(product: Product) {
    return db.prepare(`
      INSERT INTO products (code, name, category, quantity, price)
      VALUES (@code, @name, @category, @quantity, @price)
    `).run(product)
  },

  update(id: number, product: Product) {
    return db.prepare(`
      UPDATE products
      SET code = @code,
          name = @name,
          category = @category,
          quantity = @quantity,
          price = @price
      WHERE id = @id
    `).run({ ...product, id })
  },

  delete(id: number) {
    return db.prepare(`DELETE FROM products WHERE id = ?`).run(id)
  },
}
