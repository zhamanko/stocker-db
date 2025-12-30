<script setup lang="ts">
import ProductForm from '../components/ProductForm.vue'

import { computed, watch, ref } from 'vue'
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../service/product.service'
import { Product } from './../api/api'

let searchTimeout: number | null = null

const openModal = ref(false)
const selectedProduct = ref<Product | null>(null)

const products = ref<Product[]>([])
const totalPages = ref(0)
const total = ref(0)
const page = ref(1)
const search = ref('')

type SortKey = keyof Product | null

const sortKey = ref<keyof Product | null>(null)
const sortDir = ref<'asc' | 'desc'>('asc')


const sortedProducts = computed(() => {
    if (!sortKey.value) return products.value

    return [...products.value].sort((a, b) => {
        const aVal = a[sortKey.value!]
        const bVal = b[sortKey.value!]

        if (aVal == null) return 1
        if (bVal == null) return -1

        // числа
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDir.value === 'asc'
                ? aVal - bVal
                : bVal - aVal
        }

        // рядки
        return sortDir.value === 'asc'
            ? String(aVal).localeCompare(String(bVal))
            : String(bVal).localeCompare(String(aVal))
    })
})

async function loadProducts(p = page.value, s = search.value) {
    page.value = p
    const res = await fetchProducts(p, s)
    products.value = res.items
    total.value = res.total
}

function save(item: Product) {
    if (item.id == null) {
        createProduct(item).then(() => {
            loadProducts()
        })
    } else {
        updateProduct(item).then(() => {
            loadProducts()
        })
    }
}

function deleteProducte(id: number) {
    deleteProduct(id).then(() => {
        loadProducts()
    })
}

function onSearchInput(value: string) {
    if (searchTimeout) {
        clearTimeout(searchTimeout)
    }

    searchTimeout = window.setTimeout(() => {
        loadProducts(1, value)
    }, 400) // ← 400 мс після завершення вводу
}

function sort(key: SortKey) {
    if (!key) return

    if (sortKey.value === key) {
        // повторний клік — міняємо напрям
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
        // нове поле
        sortKey.value = key
        sortDir.value = 'asc'
    }
}



watch(total, (newTotal) => {
    totalPages.value = Math.ceil(newTotal / 50)
})

loadProducts() 
</script>

<template>
    <h1 class="font-bold text-2xl">Товари</h1>
    <div class="flex justify-between my-6">
        <input v-model="search" @input="onSearchInput(search)" class="border border-gray-400 w-1/4 p-1 rounded hover:border-gray-500 transition"
            placeholder="Пошук..." />
        <button @click="openModal = true" class="bg-blue-500 px-4 py-3 rounded text-white hover:bg-blue-600 transition">Додати товар</button>
    </div>

    <table class="w-full">
        <thead>
            <tr class="bg-gray-300">
                <th @click="sort('id')" class="rounded-tl-xl cursor-pointer py-2 w-20 hover:bg-gray-400 transition">
                    <div class="flex justify-center items-center">
                        <span>№</span>
                        <span v-if="sortKey === 'id'">
                            <svg v-if="sortDir === 'asc'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 15l7-7 7 7" />
                            </svg>

                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>
                </th>
                <th @click="sort('code')" class="cursor-pointer py-2 border-x border-gray-400 hover:bg-gray-400 transition">
                    <div class="flex justify-center items-center">
                        <span>Код товару</span>
                        <span v-if="sortKey === 'code'">
                            <svg v-if="sortDir === 'asc'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 15l7-7 7 7" />
                            </svg>

                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>
                </th>
                <th @click="sort('name')" class="cursor-pointer max-w-120 py-2 border-x border-gray-400 hover:bg-gray-400 transition">
                    <div class="flex justify-center items-center">
                        <span>Назва</span>
                        <span v-if="sortKey === 'name'">
                            <svg v-if="sortDir === 'asc'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 15l7-7 7 7" />
                            </svg>

                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>
                </th>
                <th @click="sort('category')" class="cursor-pointer py-2 border-x border-gray-400 w-60 hover:bg-gray-400 transition">
                    <div class="flex justify-center items-center">
                        <span>Категорія</span>
                        <span v-if="sortKey === 'category'">
                            <svg v-if="sortDir === 'asc'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 15l7-7 7 7" />
                            </svg>

                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>
                </th>
                <th @click="sort('quantity')" class="cursor-pointer py-2 border-x border-gray-400 w-40 hover:bg-gray-400 transition">
                    <div class="flex justify-center items-center">
                        <span>Кількість</span>
                        <span v-if="sortKey === 'quantity'">
                            <svg v-if="sortDir === 'asc'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 15l7-7 7 7" />
                            </svg>

                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>

                </th>
                <th @click="sort('price')" class="cursor-pointer py-2 border-x border-gray-400 w-40 hover:bg-gray-400 transition">
                    <div class="flex justify-center items-center">
                        <span>Ціна за один.</span>
                        <span v-if="sortKey === 'price'">
                            <svg v-if="sortDir === 'asc'" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 15l7-7 7 7" />
                            </svg>

                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none"
                                viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>

                </th>
                <th class="rounded-tr-xl"></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="product in sortedProducts" :key="product.id" class="text-center ">
                <td class="p-2 border-b border-gray-400">{{ product.id }}</td>
                <td class="p-2 border-x border-b border-gray-400">{{ product.code }}</td>
                <td class="p-2 border-x border-b border-gray-400 max-w-120">{{ product.name }}</td>
                <td class="p-2 border-x border-b border-gray-400">{{ product.category }}</td>
                <td class="p-2 border-x border-b border-gray-400">{{ product.quantity }}</td>
                <td class="p-2 border-x border-b border-gray-400">{{ product.price }}</td>
                <td class="p-2 w-70 border-b border-gray-400">
                    <div class="space-x-2 text-white">
                        <button @click="selectedProduct = product; openModal = true"
                            class="bg-blue-500 px-4 py-1 rounded hover:bg-blue-600 transition">Редагувати</button>
                        <button @click="product.id !== undefined && deleteProducte(product.id)"
                            class="bg-red-500 px-4 py-1 rounded hover:bg-red-600 transition">Видалити</button>
                    </div>
                </td>
            </tr>
        </tbody>
    </table>

    <div v-if="totalPages > 1">
        <button :disabled="page === 1" @click="loadProducts(page - 1)">
            ←
        </button>
        <span>Сторінка {{ page }} з {{ totalPages }}</span>
        <button :disabled="page * 50 >= total" @click="loadProducts(page + 1)">
            →
        </button>
    </div>

    <ProductForm v-if="openModal" @close="openModal = false; selectedProduct = null" :item="selectedProduct"
        @save="save" />

</template>