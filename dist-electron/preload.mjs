"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  getProducts: () => electron.ipcRenderer.invoke("products:get"),
  addProduct: (product) => electron.ipcRenderer.invoke("products:add", product)
});
