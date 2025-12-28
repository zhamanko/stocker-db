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
