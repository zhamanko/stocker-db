<script setup lang="ts">
import { ref, watch } from 'vue';
import { getProductListInput } from '../service/product.service';

export type Product = {
  id: number;
  code: string;
  name: string;
  quantity: number;
};

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'select', product: Product): void;
}>();

const suggestions = ref<Product[]>([]);

watch(() => props.modelValue, async (val) => {
  if (!val || val.length < 1) {
    suggestions.value = [];
    return;
  }
  suggestions.value = await getProductListInput(val);
});

function selectProduct(product: Product) {
  emit(
    'update:modelValue',
    `${product.code} — ${product.name} | ${product.quantity}`
  );
  emit('select', product);
  suggestions.value = [];
}
</script>
<template>
  <div class="relative w-full">
    <input
      type="text"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      class="w-full px-2 py-1"
      placeholder="Пошук товару..."
    />

    <ul
      v-if="suggestions.length"
      class="absolute bg-white border border-gray-300 w-full max-h-40 overflow-auto z-10"
    >
      <li
        v-for="product in suggestions"
        :key="product.id"
        class="p-1 hover:bg-gray-200 cursor-pointer"
        @mousedown.prevent="selectProduct(product)"
      >
        {{ product.code }} — {{ product.name }} | {{ product.quantity }}
      </li>
    </ul>
  </div>
</template>
