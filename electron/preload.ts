import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getProducts: (params: { search?: string; limit?: number; offset?: number }) => ipcRenderer.invoke('products:list', params),
  addProduct: (product: any) => ipcRenderer.invoke('products:add', product),
})
