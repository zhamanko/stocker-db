export type Product = {
  id?: number
  code: string
  name: string
  category?: string
  quantity: number
  price: number
}

export type ProductListResponse = {
  items: Product[]
  total: number
}

declare global {
  interface Window {
    api: {
      getProducts: (params: { search?: string; limit?: number; offset?: number }) => Promise<ProductListResponse>
      addProduct: (product: Product) => Promise<void>
      updatedProduct: (product: Product) => Promise<void>
      deleteProduct: (id: number) => Promise<void>
    }
  }
}

export const api = {
  getProducts: (params: { search?: string; limit?: number; offset?: number }): Promise<ProductListResponse> => window.api.getProducts(params),
  addProduct: (product: Product): Promise<void> => window.api.addProduct(product),
  updatedProduct: (product: Product): Promise<void> => window.api.updatedProduct(product),
  deleteProduct: (id: number): Promise<void> => window.api.deleteProduct(id),
}
