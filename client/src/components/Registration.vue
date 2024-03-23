<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabaseClient';
const email = ref('');
const password = ref('');
const name = ref('');
const surname = ref('');
const loading = ref(false);
const router = useRouter();

const handleSignup = async () => {
  loading.value = true;
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
    options: {
      data: {
        name: name.value,
        surname: surname.value,
        email: email.value,
      },
    },
  });

  if (error) {
    alert(error);
  } else {
    router.push('/');
  }
  loading.value = false;
};
</script>

<!-- Registration Page -->
<template>
  <form class="flex items-center justify-center min-h-screen" @submit.prevent="handleSignup">
    <div class="flex flex-col px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
      <input
        class="w-full px-3 py-2 mb-4 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
        required
        type="text"
        placeholder="Your name"
        v-model="name" />
      <input
        class="w-full px-3 py-2 mb-4 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
        required
        type="text"
        placeholder="Your surname"
        v-model="surname" />
      <input
        class="w-full px-3 py-2 mb-4 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
        required
        type="email"
        placeholder="Your email"
        v-model="email" />
      <input
        class="w-full px-3 py-2 mb-6 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
        required
        type="password"
        placeholder="Your password"
        v-model="password" />
      <input
        class="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
        type="submit"
        :value="loading ? 'Loading...' : 'Sign up'"
        :disabled="loading" />
    </div>
  </form>
</template>
