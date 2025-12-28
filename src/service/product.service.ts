import { api, Product } from './../api/api'

export async function fetchProducts( page: number, search: string) {
  const limit = 50
  const offset = (page - 1) * limit
  const response = await api.getProducts({ search, limit, offset })
  return response
}

export async function createProduct(product: Product) {
  await api.addProduct(product)
}
