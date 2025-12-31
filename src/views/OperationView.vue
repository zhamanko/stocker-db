<script setup lang="ts">
import { watch, ref } from 'vue';
import { createOperation } from '../service/operation.service';
import { ProductCheck } from '../api/api'
import SearchInput from '../components/SearchInput.vue';

export type Item = {
  product: string;
  productId?: number;
  comment?: string;
  quantity: number;
  price: number;
}

async function addOperation() {
  const payload: ProductCheck = {
    type: typeOperation.value,
    date: date.value,
    comment: comment.value,
    items: items.value.map(i => ({
      product_id: i.productId!,
      quantity: i.quantity,
      price: i.price
    }))
  }

  try {
    const id = await createOperation(payload)
    console.log(id)
    alert('Операція збережена')
    resetForm()
  } catch (e: any) {
    alert(e.message)
  }
}


const date = ref('');
const comment = ref('');
const totalPrice = ref(0);
const typeOperation = ref<'in' | 'out'>('out');
const items = ref<Item[]>([
  { product: '', quantity: 1, price: 0 }
]);

function resetForm() {
  typeOperation.value = 'out';
  comment.value = '';
  totalPrice.value = 0;
  items.value = [{ product: '', quantity: 1, price: 0 }];
  curronDate();
}


function curronDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = today.getFullYear();
  date.value = `${year}-${month}-${day}`;
}
curronDate();

function addItem() {
  items.value.push({ product: '', quantity: 1, price: 0 });
}

function removeItem(index: number) {
  items.value.splice(index, 1);
}

watch(items, (newItems) => {
  totalPrice.value = newItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
}, { deep: true });
</script>

<template>
  <div class="space-y-4 space-x-4">

    <h1 class="font-bold text-2xl">Операція</h1>

    <div class="flex gap-4">
      <select v-model="typeOperation" class="w-60 border border-gray-400 rounded p-1 hover:border-gray-500 transition">
        <option value="out">Продаж</option>
        <option value="in">Прихід</option>
      </select>
      <input type="date" v-model="date"
        class="w-60 border border-gray-400 rounded p-1 hover:border-gray-500 transition">
      <input type="text" v-model="comment"
        class="w-1/4 border border-gray-400 rounded p-1 hover:border-gray-500 transition" placeholder="Коментар">
    </div>

    <div class="flex flex-col gap-2">
      <table class="border-collapse w-full">
        <thead>
          <tr class="bg-gray-300">
            <th class="p-2 rounded-tl-2xl">Товар</th>
            <th class="border-x border-gray-400 p-2">Кількість</th>
            <th class="border-x border-gray-400 p-2">Ціна за один.</th>
            <th class="border-x border-gray-400 p-2">Сума</th>
            <th class="rounded-tr-2xl"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in items" :key="index">
            <td class="border-b border-gray-400">
              <SearchInput v-model="item.product" @select="(product) => {
                item.productId = product.id
              }" />

            </td>
            <td class="border-x border-b border-gray-400 w-40"><input type="number" v-model.number="item.quantity"
                class="w-full p-1"></td>
            <td class="border-x border-b border-gray-400 w-40"><input type="number" v-model.number="item.price"
                class="w-full p-1"></td>
            <td class="border-x border-b border-gray-400 p-2">{{ item.quantity * item.price }} $</td>
            <td class="border-b border-gray-400 text-center p-2 w-15">
              <div class="flex justify-center items-center" v-if="items.length !== 1">
                <button @click="removeItem(index)" class="hover:scale-130 transition cursor-pointer">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2"
                    stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <button @click="addItem" class="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition">Додати
        позицію</button>
    </div>


    <div class="flex flex-col justify-end items-end gap-2">
      <span><strong>Загальна сума:</strong> {{ totalPrice }} $</span>
      <button @click="addOperation" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
        Зберегти операцію
      </button>
    </div>
  </div>
</template>
