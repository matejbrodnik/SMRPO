<template>
  <v-btn class="bg-deep-purple new-project-button" theme="dark" v-if="isAdmin" @click="showDialog"
    >New organization</v-btn
  >
  <DlgNewOrganization
    v-model="organizationDlg"
    @update:show="organizationDlg = $event"></DlgNewOrganization>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DlgNewOrganization from '../dialogs/DlgNewOrganization.vue';
const organizationDlg = ref(false);

const showDialog = () => {
  organizationDlg.value = true;
};

const isAdmin = localStorage.getItem('user_role') === 'admin' ? true : false;
</script>
