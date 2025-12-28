<script setup lang="ts">
import { reactive, watch } from 'vue';
import { Product } from '../api/api';

const form = reactive<Product>(
    {
        code: '',
        name: '',
        category: '',
        quantity: 0,
        price: 0
    }
);

const emit = defineEmits<{
    (e: 'save', value: Product): void,
    (e: 'close', value: boolean): void
}>()

const props = defineProps<{
    item: Product | null
}>()

function closeModal() {
    emit('close', false)
}

function saveProduct() {
    emit('save', { ...form, id: props.item?.id })
    closeModal()
}

watch(() => props.item, (newItem) => {
    if (newItem) {
        form.code = newItem.code || ''
        form.name = newItem.name || ''
        form.category = newItem.category || ''
        form.quantity = newItem.quantity || 0
        form.price = newItem.price || 0
    } else {
        form.code = ''
        form.name = ''
        form.category = ''
        form.quantity = 0
        form.price = 0
    }
}, { immediate: true })


</script>

<template>
    <div class="fixed top-0 left-0 w-full h-full bg-black/60">
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
            <h1 class="font-bold text-lg">Додати товар</h1>
            <div class="grid grid-cols-2 gap-4 mt-4">
                <div class="flex flex-col">
                    <label for="">Код товару</label>
                    <input type="text" v-model="form.code" class="border border-gray-500">
                </div>
                <div class="flex flex-col">
                    <label for="">Назва</label>
                    <input type="text" v-model="form.name" class="border border-gray-500">
                </div>
                <div class="flex flex-col">
                    <label for="">Категорія</label>
                    <input type="text" v-model="form.category" class="border border-gray-500">
                </div>
                <div class="flex flex-col">
                    <label for="">Кількість</label>
                    <input type="text" v-model="form.quantity" class="border border-gray-500">
                </div>
                <div class="flex flex-col">
                    <label for="">Ціна</label>
                    <input type="text" v-model="form.price" class="border border-gray-500">
                </div>
            </div>
            <div class="text-end space-x-2">
                <button @click="closeModal" class="bg-gray-300 text-black px-4 py-2 rounded mt-4">Відмінити</button>
                <button @click="saveProduct" class="bg-blue-500 text-white px-4 py-2 rounded mt-4">Зберегти</button>
            </div>
        </div>
    </div>
</template>