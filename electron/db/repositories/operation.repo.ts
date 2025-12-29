import { db } from "./../sqlite";

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

  

}