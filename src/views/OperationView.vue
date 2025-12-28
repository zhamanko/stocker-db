<script setup lang="ts">
import { watch, ref } from 'vue';
import SearchInput from '../components/SearchInput.vue';

export type Item = {
  product: string;
  productId?: number;
  quantity: number;
  price: number;
}

const date = ref('');
const totalPrice = ref(0);
const typeOperation = ref<'in' | 'out'>('out');
const items = ref<Item[]>([
  { product: '', quantity: 1, price: 0 }
]);

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
  console.log(newItems)
  totalPrice.value = newItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
}, { deep: true });
</script>

<template>
  <div class="space-y-4 space-x-4">
    <select v-model="typeOperation">
      <option value="out">Продаж</option>
      <option value="in">Прихід</option>
    </select>
    <input type="date" v-model="date" class="border border-gray-400">
    <input type="text" class="border border-gray-400" placeholder="Коментар">

    <table class="border-collapse border border-gray-400 w-full">
      <thead>
        <tr>
          <th class="border border-gray-400">Товар</th>
          <th class="border border-gray-400">Кількість</th>
          <th class="border border-gray-400">Ціна</th>
          <th class="border border-gray-400">Сума</th>
          <th class="border border-gray-400">Дії</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in items" :key="index">
          <td>
            <SearchInput @select="(product) => {
              item.product = `${product.code} — ${product.name}`;
              item.productId = product.id
            }" />
          </td>
          <td><input type="number" v-model.number="item.quantity" class="border border-gray-400"></td>
          <td><input type="number" v-model.number="item.price" class="border border-gray-400"></td>
          <td class="border border-gray-400">{{ item.quantity * item.price }}</td>
          <td>
            <button @click="removeItem(index)" class="text-red-500">❌</button>
          </td>
        </tr>
      </tbody>
    </table>

    <span>Загальна сума: {{ totalPrice }}</span>

    <button @click="addItem" class="bg-blue-500 text-white px-2 py-1 rounded">Додати позицію</button>
    <button class="bg-green-500 text-white px-2 py-1 rounded">Зберегти операцію</button>
  </div>
</template>
