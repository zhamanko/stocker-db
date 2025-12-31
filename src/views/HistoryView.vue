<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { OperationRow, OperationItemView } from "../api/api";
import { getOperationItems, getOperations, deleteOperation } from '../service/operation.service'

// --- Данні ---
const operations = ref<OperationRow[]>([]);
const operationItemsMap = ref<Record<number, OperationItemView[]>>({});
const total = ref(0);
const currentPage = computed(() => {
    return Math.floor(offset.value / limit) + 1;
});

// всього сторінок
const totalPages = computed(() => {
    return Math.ceil(total.value / limit);
});

// --- Фільтри ---
const typeFilter = ref<"in" | "out" | "">("");
const searchFilter = ref("");
const dateFrom = ref<string>("");
const dateTo = ref<string>("");

// --- Пагінація ---
const limit = 20;
const offset = ref(0);

// --- Завантаження операцій ---
async function loadOperations() {
    const res = await getOperations({
        limit,
        offset: offset.value,
        type: typeFilter.value || undefined,
        search: searchFilter.value || undefined,
        from: dateFrom.value || undefined,
        to: dateTo.value || undefined
    });
    operations.value = res.items;
    total.value = res.total;

    // Завантаження позицій для всіх операцій
    for (const op of operations.value) {
        const items = await getOperationItems(op.id);
        operationItemsMap.value[op.id] = items;
    }
}

async function removeOperation(id: number) {
  if (!confirm("Впевнені, що потрібно видалити операцію?")) return;

  try {
    await deleteOperation(id);
    await loadOperations();
    alert("Операція видалена");
  } catch (e: any) {
    alert(e.message);
  }
}

// --- Скидання фільтрів ---
function resetFilters() {
    typeFilter.value = "";
    searchFilter.value = "";
    dateFrom.value = "";
    dateTo.value = "";
    offset.value = 0;
    loadOperations();
}

// --- Пагінація ---
function nextPage() {
    if (offset.value + limit < total.value) {
        offset.value += limit;
        loadOperations();
    }
}
function prevPage() {
    if (offset.value - limit >= 0) {
        offset.value -= limit;
        loadOperations();
    }
}

function formatDate(dateString: string | Date): string {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

// --- Автоматичне застосування фільтрів ---
watch([typeFilter, searchFilter, dateFrom, dateTo], () => {
    offset.value = 0;
    loadOperations();
});

// Завантажуємо при монтуванні
onMounted(loadOperations);
</script>


<template>
    <div>
        <h1 class="font-bold text-2xl">Історія операцій</h1>

        <!-- Фільтри -->
        <div class="p-4 flex gap-4 justify-center items-center flex-wrap">
            <div class="space-x-2 flex flex-col">
                <label>Тип:</label>
                <select v-model="typeFilter" class="w-30 border border-gray-400  rounded p-1">
                    <option value="">Всі</option>
                    <option value="in">Прихід</option>
                    <option value="out">Продаж</option>
                </select>
            </div>

            <div class="space-x-2 flex flex-col">
                <label>Дата від:</label>
                <input type="date" v-model="dateFrom" class="w-60 border border-gray-400  rounded p-1" />
            </div>

            <div class="space-x-2 flex flex-col">
                <label>Дата до:</label>
                <input type="date" v-model="dateTo" class="w-60 border border-gray-400 rounded p-1" />
            </div>

            <div class="space-x-2 flex flex-col">
                <label>Пошук:</label>
                <input type="text" v-model="searchFilter" placeholder="Пошук..." class="w-60 border border-gray-400  rounded p-1" />
            </div>

            <button @click="resetFilters" class="bg-blue-500 text-white px-4 py-2 rounded-2xl">Скинути</button>
        </div>

        <div class="flex justify-center gap-2 mb-4" :class="totalPages <= 1 ? 'hidden' : ''">
            <button @click="prevPage" class="cursor-pointer" :class="currentPage === 1 ? 'hidden' : ''"><svg xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>

            </button>
            <span>{{ currentPage }} з {{ totalPages }}</span>
            <button @click="nextPage" class="cursor-pointer" :class="currentPage === totalPages ? 'hidden' : ''"><svg xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>

            </button>
        </div>

        <div v-if="operations.length" class="flex flex-col gap-4">
            <div v-for="op in operations" :key="op.id" class="p-4 rounded-2xl space-y-4"
                :class="op.type === 'in' ? 'bg-green-100' : 'bg-blue-100'">
                <div class="flex justify-between">
                    <h2 class="font-bold text-lg">{{ op.type === "in" ? 'Приход' : 'Продаж' }}</h2>
                    <span>{{ formatDate(op.date) }}</span>
                    <button @click="removeOperation(op.id)"
                    class="bg-red-500 px-4 py-1 rounded hover:bg-red-600 transition text-white">Видалити</button>
                </div>
                <table class="w-full">
                    <thead>
                        <tr :class="op.type === 'in' ? 'bg-green-300' : 'bg-blue-300'">
                            <th class="rounded-tl-xl py-2">Код товару</th>
                            <th class="py-2 border-x">Назва</th>
                            <th class="py-2 border-x">Категорія</th>
                            <th class="py-2">Кількість</th>
                            <th class="py-2 border-x">Ціна за один.</th>
                            <th class="rounded-tr-xl">Сума</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in operationItemsMap[op.id]" :key="item.id" class="text-center"
                            :class="op.type === 'in' ? 'bg-green-200' : 'bg-blue-200'">
                            <td class="py-2 w-70">{{ item.product_code }}</td>
                            <td class="py-2 border-x">{{ item.product_name }}</td>
                            <td class="py-2 border-x w-70">{{ item.product_category }}</td>
                            <td class="py-2 w-40">{{ item.quantity }}</td>
                            <td class="py-2 border-x w-40">{{ item.price }}</td>
                            <td class="py-2">{{ item.total}} $</td>
                        </tr>
                    </tbody>
                </table>
                <div class="flex justify-between ">
                    <p><strong>Коментар:</strong> {{ op.comment || '-' }}</p>
                    <p><strong>Сума: </strong> {{ op.total }} $</p>
                </div>
            </div>
        </div>

    <div v-else>
        <p class="text-center text-lg">Нічого не знайдено</p>
    </div>


        <div class="flex justify-center gap-2 mt-4" :class="totalPages <= 1 ? 'hidden' : ''">
            <button @click="prevPage" class="cursor-pointer" :class="currentPage === 1 ? 'hidden' : ''"><svg xmlns="http://www.w3.org/2000/svg" fill="none"
                    viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>

            </button>
            <span>{{ currentPage }} з {{ totalPages }}</span>
            <button @click="nextPage" class="cursor-pointer" :class="currentPage === totalPages ? 'hidden' : ''"><svg xmlns="http://www.w3.org/2000/svg"
                    fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>

            </button>
        </div>
    </div>
</template>
