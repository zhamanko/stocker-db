import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getProducts: (params: { search?: string; limit?: number; offset?: number }) => ipcRenderer.invoke('products:list', params),
  addProduct: (product: any) => ipcRenderer.invoke('products:add', product),
  updatedProduct: (product: any) => ipcRenderer.invoke('products:update', product),
  deleteProduct: (id: number) => ipcRenderer.invoke('products:delete', id),
  getProductById: (id: number) => ipcRenderer.invoke('products:getById', id),
  getProductListInput: (search?: string) => ipcRenderer.invoke('products:getListInput', search),
})
