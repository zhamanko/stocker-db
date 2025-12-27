import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  getProducts: () => ipcRenderer.invoke('products:get'),
  addProduct: (product: any) => ipcRenderer.invoke('products:add', product),
})
