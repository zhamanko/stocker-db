export type Product = {
  code: string
  name: string
  category?: string
  quantity: number
  price: number
}

declare global {
  interface Window {
    api: {
      getProducts: () => Promise<Product[]>
      addProduct: (product: Product) => Promise<void>
    }
  }
}

export const api = {
  getProducts: (): Promise<Product[]> => window.api.getProducts(),
  addProduct: (product: Product): Promise<void> => window.api.addProduct(product),
}
