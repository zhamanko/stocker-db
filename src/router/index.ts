import { createRouter, createWebHashHistory } from 'vue-router'
import ProductsView from '../views/ProductsView.vue'
import OperationView from '../views/OperationView.vue'


const routes = [
  { path: '/', redirect: '/products' },
  { path: '/products', component: ProductsView },
  { path: '/operation', component: OperationView },
  
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
