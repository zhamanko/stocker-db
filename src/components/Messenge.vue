<script setup lang="ts">
interface Props {
    massage: string,
    type: 'info' | 'confirm',
    id?: number,
}

type UserResponse = {
    confirmed: boolean
    id?: number
}


const props = defineProps<Props>()
const emit = defineEmits<{ (e: 'user-response', value: UserResponse): void }>()


function handleClick(confirmed: boolean) {
    emit('user-response', { confirmed, id: props.id })
}
</script>

<template>
    <div class="fixed top-0 left-0 bg-black/60 w-full h-full">
        <div
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg w-1/4">
            <p class="text-lg">{{ massage }}</p>

            <div class="text-end">
                <div v-if="type === 'info'">
                    <button class="bg-green-500 text-white px-4 py-2 rounded mt-4 hover:bg-green-600 transition" @click="handleClick(true)">Ок</button>
                </div>

                <div v-if="type === 'confirm'" class="space-x-2">
                    <button  class="bg-gray-300 text-black px-4 py-2 rounded mt-4 hover:bg-gray-400 transition" @click="handleClick(false)">Ні</button>
                    <button class="bg-red-500 text-white px-4 py-2 rounded mt-4 hover:bg-red-600 transition" @click="handleClick(true)">Так</button>
                </div>
            </div>
        </div>
    </div>
</template>