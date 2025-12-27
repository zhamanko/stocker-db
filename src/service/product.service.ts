import { api, Product } from './../api/api'

export async function fetchProducts(): Promise<Product[]> {
  const products = await api.getProducts()
  // можна додати сортування, фільтри тощо
  return products
}

export async function createProduct(product: Product) {
  await api.addProduct(product)
}
