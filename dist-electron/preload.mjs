"use strict";const e=require("electron");e.contextBridge.exposeInMainWorld("api",{getProducts:()=>e.ipcRenderer.invoke("products:get"),addProduct:r=>e.ipcRenderer.invoke("products:add",r)});
