import { ipcMain } from 'electron'
import { ProductRepo } from '../db/repositories/product.repo'
import { OperationRepo } from '../db/repositories/operation.repo'

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

ipcMain.handle('products:getById', (_, id) => {
  return ProductRepo.getById(id)
})

ipcMain.handle('products:getListInput', (_, params) => {
  return ProductRepo.getListInput(params)
}) 

ipcMain.handle('operation:add', (_, operation) => {
  try {
    const operationId = OperationRepo.create(operation)

    return {
      success: true,
      id: Number(operationId)
    }
  } catch (e: any) {
    return {
      success: false,
      message: e.message
    }
  }
})

ipcMain.handle('operations:list', (_e, params) => {
  return OperationRepo.getList(params);
});

ipcMain.handle('operations:getItems', (_e, operationId) => {
  return OperationRepo.getItems(operationId);
});

ipcMain.handle('operations:delete', (_e, operationId) => {
  return OperationRepo.deleteOperation(operationId);
})
