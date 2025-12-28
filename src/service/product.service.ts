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

export async function updateProduct(product: Product) {
  await api.updatedProduct(product)
}

export async function deleteProduct(id: number) {
  await api.deleteProduct(id)
}

export async function getProductById(id: number): Promise<Product | undefined> {
  return await api.getProductById(id)
}

export async function getProductListInput(search: string) {
  return await api.getProductListInput(search);
}
