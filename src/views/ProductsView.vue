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
    <input v-model="search" @input="onSearchInput(search)" placeholder="Пошук..." />
        <button @click="openModal = true">Додати товар</button>

    <table>
        <thead>
            <tr>
                <th @click="sort('id')">№</th>
                <th @click="sort('code')">Код</th>
                <th @click="sort('name')">Назва</th>
                <th @click="sort('category')">Категорія</th>
                <th @click="sort('quantity')">Кількість</th>
                <th @click="sort('price')">Ціна</th>
                <th></th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="product in sortedProducts" :key="product.id">
                <td>{{ product.id }}</td>
                <td>{{ product.code }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.category }}</td>
                <td>{{ product.quantity }}</td>
                <td>{{ product.price }}</td>
                <td><div class="space-x-2">
                    <button @click="selectedProduct = product; openModal = true">Редагувати</button>
                    <button @click="product.id !== undefined && deleteProducte(product.id)">Видалити</button>
                </div></td>
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

    <ProductForm v-if="openModal" @close="openModal = false; selectedProduct = null" :item="selectedProduct" @save="save"/>

</template>