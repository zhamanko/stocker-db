import { ipcMain } from 'electron'
import { ProductRepo } from '../db/repositories/product.repo'

ipcMain.handle('products:get', () => {
  return ProductRepo.getAll()
})

ipcMain.handle('products:add', (_, product) => {
  ProductRepo.create(product)
  return true
})
