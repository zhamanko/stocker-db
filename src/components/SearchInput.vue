<script lang="ts" setup>
import { ref, watch } from 'vue';
import { getProductListInput } from '../service/product.service';

export type Product = {
  id: number;
  code: string;
  name: string;
}

const emit = defineEmits<{
  (e: 'select', product: Product): void
}>();

const searchInput = ref('');
const suggestions = ref<Product[]>([]);

watch(searchInput, async (val) => {
  if (val.length < 1) {
    return;
  }
  suggestions.value = await getProductListInput(val);
});

function selectProduct(product: Product) {
  searchInput.value = `${product.code} — ${product.name}`; 
  emit('select', product); 
}
</script>

<template>
  <div class="relative w-full">
    <input
      type="text"
      v-model="searchInput"
      class="border border-gray-400 w-full px-2 py-1"
      placeholder="Пошук товару..."
    />
    <ul
      v-if="suggestions.length > 0"
      class="absolute bg-white border border-gray-300 w-full max-h-40 overflow-auto z-10"
    >
      <li
        v-for="product in suggestions"
        :key="product.id"
        class="p-1 hover:bg-gray-200 cursor-pointer"
        @click="selectProduct(product)"
      >
        {{ product.code }} — {{ product.name }}
      </li>
    </ul>
  </div>
</template>
