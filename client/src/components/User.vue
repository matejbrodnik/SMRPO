<template>
  <div style= "height: 100vh; overflow: hidden;">
    <div style="width: 80%; margin: 30px auto">
      <v-btn @click="
      $refs.dlgNewUser.show = true;
      " class="bg-deep-purple dlgButton" style="margin: 30px 0;" v-if="isAdmin">Add user</v-btn>
      <dlg-new-user ref="dlgNewUser"></dlg-new-user>
      <dlg-users-tbl ref="dlgUsersTbl"></dlg-users-tbl>
    </div>
  </div>
</template>

<script setup lang="ts">
import DlgNewUser from '../dialogs/DlgNewUser.vue';
import DlgUsersTbl from '../dialogs/DlgUsersTbl.vue';
import { supabase } from "../lib/supabaseClient";
import { onMounted, ref, defineComponent } from 'vue'

const isAdmin = ref(false);

supabase.auth.onAuthStateChange(async (_, session) => {
  if (session) {
    const jwt = session.access_token;

    const payload = JSON.parse(atob(jwt.split('.')[1]));
    isAdmin.value = payload.user_role === 'admin';

  } else {
    console.log('The user is not authenticated');
  }
});

// export default defineComponent({
//   components: {
//     DlgNewUser,
//     DlgUsersTbl,
//   },
// })
</script>
