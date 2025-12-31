"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  on: (channel, func) => {
    electron.ipcRenderer.on(channel, (_event, ...args) => func(...args));
  },
  send: (channel, data) => {
    electron.ipcRenderer.send(channel, data);
  },
  getProducts: (params) => electron.ipcRenderer.invoke("products:list", params),
  addProduct: (product) => electron.ipcRenderer.invoke("products:add", product),
  updatedProduct: (product) => electron.ipcRenderer.invoke("products:update", product),
  deleteProduct: (id) => electron.ipcRenderer.invoke("products:delete", id),
  getProductById: (id) => electron.ipcRenderer.invoke("products:getById", id),
  getProductListInput: (search) => electron.ipcRenderer.invoke("products:getListInput", search),
  addOperation: (operation) => electron.ipcRenderer.invoke("operation:add", operation),
  getOperations: (params) => electron.ipcRenderer.invoke("operations:list", params),
  getOperationItems: (operationId) => electron.ipcRenderer.invoke("operations:getItems", operationId),
  deleteOperation: (operationId) => electron.ipcRenderer.invoke("operations:delete", operationId)
});
