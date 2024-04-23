<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabaseClient';

const loading = ref(false);
const email = ref('');
const password = ref('');
const router = useRouter();
const showDlgSelectOrganization = ref(false);

const handleLogin = async () => {
  try {
    loading.value = true;
    console.log(email.value);
    console.log(password.value);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) throw error;
  } catch (error) {
    if (error instanceof Error) {
      alert(error.message);
    }
  } finally {
    loading.value = false;

    // show the dialog
    //showDlgSelectOrganization.value = true;

    router.push('/');
  }
};

const showDialog = () => {
  showDlgSelectOrganization.value = true;
};
</script>

<template>
  <form class="flex items-center justify-center min-h-screen" @submit.prevent="handleLogin">
    <div class="flex flex-col px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
      <input
        class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow"
        required
        type="email"
        placeholder="Your email"
        v-model="email" />
      <input
        class="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow"
        required
        type="password"
        placeholder="Your password"
        v-model="password" />
      <input
        class="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700e"
        type="submit"
        :value="loading ? 'Loading' : 'Sign in'"
        :disabled="loading" />
      <router-link to="/register" class="mt-4 text-blue-500 hover:text-blue-700"
        >Don't have an account? Sign up</router-link
      >
    </div>
  </form>
  <!-- <DlgSelectOrganization
    v-model="showDlgSelectOrganization"
    @update:show="showDlgSelectOrganization = $event" /> -->
</template>
