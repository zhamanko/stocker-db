import { createRouter, createWebHashHistory } from 'vue-router'
import ProductsView from '../views/ProductsView.vue'


const routes = [
  { path: '/', redirect: '/products' },
  { path: '/products', component: ProductsView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
