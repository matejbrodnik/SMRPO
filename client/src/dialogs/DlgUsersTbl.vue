<template>
  <!-- <v-dialog v-model="show" class="dlgWindow" width="50%"> -->
  <v-card>
    <template v-slot:text>
      <v-text-field
        v-model="search"
        label="Search"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        hide-details
        single-line
        density="compact"></v-text-field>
    </template>
    <v-data-table
      density="compact"
      :headers="headers"
      :items="users"
      :search="search"
      @click:row="editUser">
    </v-data-table>
  </v-card>

  <!-- </v-dialog> -->
  <dlg-edit-user ref="dlgEditUser" :user="user"></dlg-edit-user>
</template>
<script lang="ts">
import { useQuery } from '@tanstack/vue-query';
import { defineComponent, ref } from 'vue';
import DlgEditUser from '../dialogs/DlgEditUser.vue';
import DlgNewUser from '../dialogs/DlgNewUser.vue';
import { supabase } from '../lib/supabaseClient';

export default defineComponent({
  components: {
    DlgNewUser,
    DlgEditUser,
  },
  setup() {
    const show = ref(false);
    const search = ref('');
    const headers = ref([
      {
        align: 'start',
        key: 'name',
        sortable: false,
        title: 'Name',
      },
      {
        key: 'surname',
        title: 'Surname',
      },
    ]);
    const dlgEditUser = ref(null);
    const user = ref(null);

    async function editUser(click, item) {
      console.log('item', item.item);
      user.value = item.item;
      dlgEditUser.value.show = true;

      /* dlgEditUser.value.dlgData = item.item;
      dlgEditUser.value.show = true;

      // Fetch all organizations
      const { data: orgData, error: orgError } = await supabase.from('organization').select('*');
      if (orgError) {
        console.error('Error fetching organizations:', orgError.message);
      } else {
        dlgEditUser.value.dlgData.organizations = orgData;
      }

      // Fetch organizations the user belongs to
      const { data: userOrgData, error: userOrgError } = await supabase
        .from('orgs_users')
        .select('*')
        .eq('user_id', item.item.user_id);
      if (userOrgError) {
        console.error('Error fetching user organizations:', userOrgError.message);
      } else {
        dlgEditUser.value.dlgData.selectedOrganizations = userOrgData;
      }
 */
    }

    const usersQuery = useQuery({
      queryKey: ['users'],
      queryFn: async () => {
        const { data, error } = await supabase.from('user_profile').select('*');
        if (error) {
          throw error;
        }
        return data;
      },
    });
    // Watch for changes in usersQuery and log the new data

    return {
      show,
      search,
      headers,
      users: usersQuery.data,
      dlgEditUser,
      editUser,
      user,
    };
  },
});
</script>
