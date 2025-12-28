import { ipcMain } from 'electron'
import { ProductRepo } from '../db/repositories/product.repo'

ipcMain.handle('products:list', (_e, params) => {
  const items = ProductRepo.getList(params)
  const total = ProductRepo.count(params.search || "")
  return { items, total }
})

ipcMain.handle('products:add', (_, product) => {
  ProductRepo.create(product)
  return true
})

ipcMain.handle('products:update', (_, product) => {
  if (!product.id) {
    throw new Error('Product ID is required for update')
  }
  ProductRepo.update(product.id, product)
  return true
})

ipcMain.handle('products:delete', (_, id) => {
  ProductRepo.delete(id)
  return true
})
