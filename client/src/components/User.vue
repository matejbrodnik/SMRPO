<template>
  <div style="height: 100vh; overflow: hidden">
    <div style="width: 80%; margin: 30px auto">
      <v-btn
        @click="$refs.dlgNewUser.show = true"
        class="bg-deep-purple dlgButton"
        style="margin: 30px 0"
        v-if="isAdmin"
        >Add user</v-btn
      >
      <dlg-new-user ref="dlgNewUser"></dlg-new-user>
      <dlg-users-tbl ref="dlgUsersTbl"></dlg-users-tbl>
    </div>
  </div>
</template>

<script setup lang="ts">
import DlgNewUser from '../dialogs/DlgNewUser.vue';
import DlgUsersTbl from '../dialogs/DlgUsersTbl.vue';

const isAdmin = localStorage.getItem('user_role') === 'admin' ? true : false;


// export default defineComponent({
//   components: {
//     DlgNewUser,
//     DlgUsersTbl,
//   },
// })
</script>
