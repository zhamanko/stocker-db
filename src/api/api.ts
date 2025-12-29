export type Product = {
  id?: number;
  code: string;
  name: string;
  category?: string;
  quantity: number;
  price: number;
};

export type ProductListResponse = {
  items: Product[];
  total: number;
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

export type OperationRow = {
  id: number;
  type: "in" | "out";
  date: string;
  comment?: string;
  total: number;
};

export type OperationItemView = {
  id: number;
  product_code: string;
  product_name: string;
  quantity: number;
  price: number;
  total: number;
};

export type OperationListResponse = {
  items: OperationRow[];
  total: number;
};

declare global {
  interface Window {
    api: {
      getProducts: (params: {
        search?: string;
        limit?: number;
        offset?: number;
      }) => Promise<ProductListResponse>;
      addProduct: (product: Product) => Promise<void>;
      updatedProduct: (product: Product) => Promise<void>;
      deleteProduct: (id: number) => Promise<void>;
      getProductById: (id: number) => Promise<Product | undefined>;
      getProductListInput: (search?: string) => Promise<[]>;
      addOperation: (
        operation: ProductCheck
      ) => Promise<{ success: boolean; id?: number; message?: string }>;

      getOperations: (params: {
        from?: string;
        to?: string;
        productId?: number;
        limit: number;
        offset: number;
      }) => Promise<OperationListResponse>;

      /** 🔽 ПОЗИЦІЇ ОДНОГО ЧЕКУ */
      getOperationItems: (operationId: number) => Promise<OperationItemView[]>;
    };
  }
}

export const api = {
  getProducts: (params: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductListResponse> => window.api.getProducts(params),
  addProduct: (product: Product): Promise<void> =>
    window.api.addProduct(product),
  updatedProduct: (product: Product): Promise<void> =>
    window.api.updatedProduct(product),
  deleteProduct: (id: number): Promise<void> => window.api.deleteProduct(id),
  getProductById: (id: number): Promise<Product | undefined> =>
    window.api.getProductById(id),
  getProductListInput: (search?: string): Promise<[]> =>
    window.api.getProductListInput(search),
  addOperation: (
    operation: ProductCheck
  ): Promise<{ success: boolean; id?: number; message?: string }> =>
    window.api.addOperation(operation),
};
