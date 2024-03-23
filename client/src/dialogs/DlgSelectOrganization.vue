<template>
  <v-dialog v-model="show" max-width="290">
    <v-card>
      <v-card-title class="headline">Select Organization</v-card-title>
      <v-card-text>
        <v-select
          :items="organizations"
          item-title="org_name"
          item-value="org_id"
          label="Select"
          v-model="selectedOrganization"></v-select>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Close" variant="text" @click="closeDialog"></v-btn>
        <v-btn color="green darken-1" text @click="enterOrganization">Enter</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<!-- <script setup lang="ts">
import { ref } from 'vue';

const show = ref(false);
const organizations = ref([]);
const selectedOrganization = ref(null);

const fetchOrganizations = async () => {
  // Fetch the organizations from the database
  // This is just a placeholder, replace it with your actual code
  console.log('Fetching organizations');
};

const enterOrganization = () => {
  // Do something with the selected organization
  console.log(selectedOrganization.value);
  show.value = false;
};

fetchOrganizations();
</script> -->

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { supabase } from '../lib/supabaseClient';
import router from '../router';

export default defineComponent({
  emits: ['update:show'],
  setup(_, { emit }) {
    const show = ref(false);
    const organizations = ref([]);
    const selectedOrganization = ref(null);

    const fetchOrganizations = async () => {
      const user = await supabase.auth.getUser();
      console.log('Fetching organizations');
      console.log('user', user);

      const userId = user?.data.user?.id; // Replace this with the actual user ID

      const { data, error } = await supabase.rpc('get_user_organizations', { user_id: userId });

      console.log('data', data);
      console.log(error);

      organizations.value = data;
      console.log('data', data);
    };

    const enterOrganization = () => {
      // Do something with the selected organization
      console.log('selectedOrganization', selectedOrganization.value);
      localStorage.setItem('organizationId', selectedOrganization.value);
      console.log(selectedOrganization.value);
      router.push('/');
      closeDialog();
    };

    const closeDialog = () => {
      show.value = false;
      emit('update:show', false);
      console.log('close dialog');
    };

    // Listen for authentication state changes
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        // Fetch organizations when the user signs in
        fetchOrganizations();
      }
    });

    return {
      show,
      organizations,
      selectedOrganization,
      enterOrganization,
      closeDialog,
    };
  },
});
</script>
