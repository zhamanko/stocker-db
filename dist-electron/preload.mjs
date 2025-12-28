"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  getProducts: (params) => electron.ipcRenderer.invoke("products:list", params),
  addProduct: (product) => electron.ipcRenderer.invoke("products:add", product)
});
