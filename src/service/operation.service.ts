import { api, ProductCheck } from './../api/api'


export async function createOperation(operation: ProductCheck) {
   const res = await api.addOperation(operation)

  if (!res.success) {
    throw new Error(res.message)
  }

  return res.id
}

export async function getOperations(params:any) {
  return await api.getOperations(params);
}

export async function getOperationItems(params: any) {
  return await api.getOperationItems(params);
}

export async function deleteOperation(params: number) {
  return await api.deleteOperation(params);
  
}
