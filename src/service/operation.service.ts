import { api, ProductCheck } from './../api/api'


export async function createOperation(operation: ProductCheck) {
   const res = await api.addOperation(operation)

  if (!res.success) {
    throw new Error(res.message)
  }

  return res.id
}

