<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { api, OperationRow, OperationItemView } from "../api/api";

// --- Данні ---
const operations = ref<OperationRow[]>([]);
const operationItemsMap = ref<Record<number, OperationItemView[]>>({});
const total = ref(0);

// --- Фільтри ---
const typeFilter = ref<"in" | "out" | "">("");
const searchFilter = ref("");
const dateFrom = ref<string>("");
const dateTo = ref<string>("");

// --- Пагінація ---
const limit = 30;
const offset = ref(0);

// --- Завантаження операцій ---
async function loadOperations() {
    const res = await api.getOperations({
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
        const items = await api.getOperationItems(op.id);
        operationItemsMap.value[op.id] = items;
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
        <h2>Історія операцій</h2>

        <!-- Фільтри -->
        <div style="margin-bottom: 10px;">
            <label>
                Тип:
                <select v-model="typeFilter">
                    <option value="">Всі</option>
                    <option value="in">Прихід</option>
                    <option value="out">Продаж</option>
                </select>
            </label>

            <label>
                Дата від:
                <input type="date" v-model="dateFrom" />
            </label>

            <label>
                Дата до:
                <input type="date" v-model="dateTo" />
            </label>

            <label>
                Пошук (код або назва):
                <input type="text" v-model="searchFilter" />
            </label>

            <button @click="resetFilters">Скинути</button>
        </div>

        <div v-for="op in operations" :key="op.id">
            <h2>{{ op.type === "in" ? 'Приход' : 'Продаж' }}</h2>
            <span>{{ op.date }}</span>
            <table>
                <thead>
                    <tr>
                        <th>Код</th>
                        <th>Назва</th>
                        <th>Кількість</th>
                        <th>Ціна</th>
                        <th>Сума</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in operationItemsMap[op.id]" :key="item.id">
                        <td>{{ item.product_code }}</td>
                        <td>{{ item.product_name }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>{{ item.price }}</td>
                        <td>{{ item.total }}</td>
                    </tr>
                </tbody>
            </table>
            <p>Коментар: {{ op.comment || '-' }}</p>
            <p>Сума: {{ op.total }}</p>
        </div>

        <!-- Пагінація -->
        <div style="margin-top: 10px;">
            <button @click="prevPage" :disabled="offset === 0">Попередня</button>
            <button @click="nextPage" :disabled="offset + limit >= total">Наступна</button>
            <span>Всього: {{ total }}</span>
        </div>
    </div>
</template>
