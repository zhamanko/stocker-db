"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  getProducts: (params) => electron.ipcRenderer.invoke("products:list", params),
  addProduct: (product) => electron.ipcRenderer.invoke("products:add", product),
  updatedProduct: (product) => electron.ipcRenderer.invoke("products:update", product),
  deleteProduct: (id) => electron.ipcRenderer.invoke("products:delete", id)
});
