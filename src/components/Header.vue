<template>
  <header class="bg-gray-800 text-white p-4">
    <nav class="flex space-x-4 justify-center items-center">
      <router-link to="/products" class="hover:text-gray-300 hover:scale-110 transition text-lg" active-class="border-b">Товари</router-link>
      <router-link to="/operation" class="hover:text-gray-300 hover:scale-110 transition text-lg" active-class="border-b">Операції</router-link>
      <router-link to="/history" class="hover:text-gray-300 hover:scale-110 transition text-lg" active-class="border-b">Історія
        операцій</router-link>
      <span class="flex-1"></span>
      <router-link to="/about" class="hover:text-gray-300 hover:scale-120 transition"> <svg
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"
          class="size-7">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
      </router-link>
    </nav>
  </header>
</template>