<script setup lang="ts">
import { computed, reactive } from 'vue';
import type { OperationItemView, OperationRow, ProductCheck } from '../api/api';
import SearchInput from './SearchInput.vue';

type EditItem = { product: string; productId?: number; quantity: number; price: number };

const props = defineProps<{ operation: OperationRow; items: OperationItemView[] }>();
const emit = defineEmits<{ (e: 'close'): void; (e: 'save', operation: ProductCheck): void }>();

const form = reactive({
  type: props.operation.type,
  date: props.operation.date.slice(0, 10),
  comment: props.operation.comment ?? '',
  items: props.items.map((item) => ({
    product: `${item.product_code} — ${item.product_name} | ${item.product_category}`,
    productId: item.product_id ?? undefined,
    quantity: item.quantity,
    price: item.price,
  })) as EditItem[],
});

const isValid = computed(() => form.date !== '' && form.items.length > 0 && form.items.every((item) =>
  item.productId != null && Number.isInteger(item.quantity) && item.quantity > 0 && Number.isFinite(item.price) && item.price >= 0
));

function save() {
  if (!isValid.value) return;
  emit('save', {
    type: form.type,
    date: form.date,
    comment: form.comment,
    items: form.items.map((item) => ({ product_id: item.productId!, quantity: item.quantity, price: item.price })),
  });
}
</script>

<template>
  <div class="fixed top-0 left-0 h-full w-full bg-black/60">
    <div class="absolute top-1/2 left-1/2 max-h-[90vh] w-4/5 -translate-x-1/2 -translate-y-1/2 overflow-auto rounded-lg bg-white p-6">
      <h2 class="text-xl font-bold">Редагувати операцію</h2>
      <div class="mt-4 flex gap-4">
        <select v-model="form.type" class="w-60 rounded border border-gray-400 p-1"><option value="out">Продаж</option><option value="in">Прихід</option></select>
        <input v-model="form.date" type="date" class="w-60 rounded border border-gray-400 p-1">
        <input v-model="form.comment" type="text" placeholder="Коментар" class="w-1/4 rounded border border-gray-400 p-1">
      </div>
      <table class="mt-4 w-full border-collapse">
        <thead><tr class="bg-gray-300"><th class="p-2">Товар</th><th class="border-x p-2">Кількість</th><th class="border-x p-2">Ціна</th><th class="border-x p-2">Сума</th><th></th></tr></thead>
        <tbody>
          <tr v-for="(item, index) in form.items" :key="index">
            <td class="border-b"><SearchInput :model-value="item.product" @update:model-value="(value) => { item.product = value; item.productId = undefined }" @select="(product) => { item.productId = product.id }" /></td>
            <td class="w-40 border-x border-b"><input v-model.number="item.quantity" type="number" min="1" step="1" class="w-full p-1"></td>
            <td class="w-40 border-x border-b"><input v-model.number="item.price" type="number" min="0" step="0.01" class="w-full p-1"></td>
            <td class="border-x border-b p-2">{{ item.quantity * item.price }} $</td>
            <td class="w-15 border-b text-center"><button v-if="form.items.length > 1" @click="form.items.splice(index, 1)" class="text-red-600">×</button></td>
          </tr>
        </tbody>
      </table>
      <button @click="form.items.push({ product: '', quantity: 1, price: 0 })" class="mt-2 rounded bg-blue-500 px-2 py-1 text-white">Додати позицію</button>
      <p v-if="!isValid" class="mt-2 text-sm text-red-600">Оберіть товар, вкажіть додатну кількість і коректну ціну для кожної позиції.</p>
      <div class="mt-4 text-end space-x-2"><button @click="emit('close')" class="rounded bg-gray-300 px-4 py-2">Скасувати</button><button :disabled="!isValid" @click="save" class="rounded bg-green-500 px-4 py-2 text-white disabled:opacity-50">Зберегти зміни</button></div>
    </div>
  </div>
</template>
