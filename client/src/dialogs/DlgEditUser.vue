<template>
  <v-dialog v-model="show" class="dlgWindow" width="40%">
    <v-card title="Edit user">
      <v-card-text>
        <v-form ref="form">
          <v-row dense>
            <v-text-field
              v-model="dlgData.name"
              label="First name"
              required
              :rules="[rules.required, rules.name]"></v-text-field>
          </v-row>
          <v-row dense>
            <v-text-field
              v-model="dlgData.surname"
              label="Last name"
              :rules="[rules.required, rules.surname]"></v-text-field>
          </v-row>
          <!-- <v-row dense>
            <v-text-field v-model="dlgData.email" label="E-mail" readonly></v-text-field>
          </v-row> -->
          <!-- <v-row dense>
            <v-text-field
              v-model="dlgData.password"
              label="Choose password"
              type="password"
              :rules="[rules.password]"
              required></v-text-field>
          </v-row> -->
          <v-row dense>
            <v-combobox
              v-model="selectedOrgs"
              :items="dlgData.organizations"
              label="Organizations"
              :item-title="(item) => item.name"
              :item-value="(item) => item.name"
              :rules="[rules.required, rules.organization]"
              multiple></v-combobox>
          </v-row>
          <v-row>
            <v-radio-group v-model="dlgData.rights" inline label="Sistem rights:" :disabled="false">
              <v-radio label="Administrator" value="admin"></v-radio>
              <v-radio label="User" value="user"></v-radio>
            </v-radio-group>
          </v-row>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Close" variant="text" @click="show = false"></v-btn>
        <v-btn text="Save" variant="text" @click="saveNewUser"></v-btn>
        <v-btn text="Delete Account" color="error" @click="deleteAccount"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { useQueryClient } from '@tanstack/vue-query';
import { defineComponent, ref, watch } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { rules } from './DlgProfile.vue';

export default defineComponent({
  props: {
    user: Object,
  },
  setup(props) {
    const show = ref(false);
    const dlgData = ref({
      password: '',
      name: '',
      surname: '',
      email: '',
      rights: 'user',
      organizations: [],
      selectedOrganizations: [],
    });

    const selectedOrgs = ref([]);
    const queryClient = useQueryClient();

    watch(
      () => props.user,
      async (user) => {
        console.log('newVal', user);
        dlgData.value = {
          ...dlgData.value,
          ...user,
        };
        // Fetch all organizations
        const { data: orgData, error: orgError } = await supabase.from('organization').select('*');
        if (orgError) {
          console.error('Error fetching organizations:', orgError.message);
        } else {
          dlgData.value.organizations = orgData;
        }

        // Fetch user role
        const { data: userRoleData, error: userRoleError } = await supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', user.user_id);
        /*
         */

        console.log('userRoleData', userRoleData);
        if (userRoleError) {
          console.error('Error fetching user role:', userRoleError.message);
        } else {
          dlgData.value.rights = userRoleData[0]?.role;
        }

        // Fetch organizations the user belongs to
        const { data: userOrgData, error: userOrgError } = await supabase
          .from('orgs_users')
          .select('*')
          .eq('user_id', user.user_id);
        if (userOrgError) {
          console.error('Error fetching user organizations:', userOrgError.message);
        } else {
          dlgData.value.selectedOrganizations = userOrgData;
        }
      }
    );

    watch(
      () => dlgData.value.selectedOrganizations,
      (newVal) => {
        selectedOrgs.value = newVal?.map((org) =>
          dlgData.value.organizations.find((o) => o.id === org.org_id)
        );
      }
    );

    const deleteAccount = async () => {
      // TODO: Implement account deletion
      const body = JSON.stringify({
        user_id: dlgData.value.user_id,
      });
      console.log('body', body);

      const { data, error } = await supabase.functions.invoke('deleteUser', {
        body: body,
      });

      if (error) {
        console.error('Error deleting user:', error.message);
      } else {
        console.log('User deleted:', data);
        show.value = false;
        await queryClient.invalidateQueries({
          queryKey: ['users'],
        });
      }

      console.log('data', data);
      console.log('error', error);
      console.log('Delete account clicked');
    };

    const form = ref(null);

    const saveNewUser = async () => {
      console.log('saveNewUser', await form.value.validate());
      if (await form.value.validate()) {
        const { data, error } = await supabase
          .from('user_profile')
          .update({
            name: dlgData.value.name,
            surname: dlgData.value.surname,
          })
          .eq('user_id', dlgData.value.user_id);

        if (error) {
          console.error('Error saving user:', error.message);
        } else {
          console.log('User saved:', data);
          show.value = false;
          await queryClient.invalidateQueries({
            queryKey: ['users'],
          });
        }

        selectedOrgs.value.map((org) => ({
          user_id: dlgData.value.user_id,
          org_id: org.id,
        }));

        await supabase.from('orgs_users').delete().eq('user_id', dlgData.value.user_id);
        await supabase.from('orgs_users').insert(
          selectedOrgs.value.map((org) => ({
            user_id: dlgData.value.user_id,
            org_id: org.id,
          }))
        );

        await supabase
          .from('user_roles')
          .update({ role: dlgData.value.rights })
          .eq('user_id', dlgData.value.user_id);

        console.log;
      }
    };

    return {
      show,
      dlgData,
      rules,
      form,
      selectedOrgs,
      deleteAccount,
      saveNewUser,
    };
  },
});
</script>

<!-- create table
  public.user_roles (
    user_id uuid not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    role public.user_role null,
    id uuid not null default gen_random_uuid (),
    constraint user_roles_pkey primary key (id),
    constraint public_user_roles_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
  ) tablespace pg_default; -->
