import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    on: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => func(...args));
  },
  send: (channel: string, data?: any) => {
    ipcRenderer.send(channel, data);
  },
  getProducts: (params: { search?: string; limit?: number; offset?: number }) =>
    ipcRenderer.invoke("products:list", params),
  addProduct: (product: any) => ipcRenderer.invoke("products:add", product),
  updatedProduct: (product: any) =>
    ipcRenderer.invoke("products:update", product),
  deleteProduct: (id: number) => ipcRenderer.invoke("products:delete", id),
  getProductById: (id: number) => ipcRenderer.invoke("products:getById", id),
  getProductListInput: (search?: string) =>
    ipcRenderer.invoke("products:getListInput", search),
  addOperation: (operation: {
    type: string;
    items: { product_id: number; quantity: number; price: number };
    date: string;
    comment?: string;
  }) => ipcRenderer.invoke("operation:add", operation),

  getOperations: (params: {
    from?: string;
    to?: string;
    productId?: number;
    type?: 'in' | 'out';
    search?: string;
    limit?: number;
    offset?: number;
  }) => ipcRenderer.invoke("operations:list", params),

  getOperationItems: (operationId: number) =>
    ipcRenderer.invoke("operations:getItems", operationId),
  deleteOperation: (operationId: number) =>
    ipcRenderer.invoke("operations:delete", operationId)
});
