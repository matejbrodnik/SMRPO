<template>
  <v-dialog v-model="show" class="dlgWindow" width="40%">
    <v-card title="Edit profile">
      <v-card-text>
        <!-- <v-row dense>
          <v-text-field v-model="dlgData.user" label="Uporabniško ime" required></v-text-field>
        </v-row> -->

        <v-row dense>
          <v-text-field v-model="dlgData.name" label="Ime" required></v-text-field>
        </v-row>
        <v-row dense>
          <v-text-field v-model="dlgData.surname" label="Priimek" required></v-text-field>
        </v-row>
        <v-row dense>
          <v-text-field
            v-model="dlgData.email"
            label="E-mail"
            :rules="[rules.required, rules.email]"
            required>
          </v-text-field>
        </v-row>
        <v-row dense>
          <v-text-field
            v-model="dlgData.password"
            label="Change password"
            type="password"
            :rules="[rules.required, rules.min]"
            required></v-text-field>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Close" variant="text" @click="closeDialog"></v-btn>
        <v-btn text="Save" variant="text" @click="updateProfile"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { supabase } from '../lib/supabaseClient';

export default defineComponent({
  setup(_, { emit }) {
    const show = ref(false);
    const edit = ref(false);
    const dlgData = ref({
      id: '',
      name: '',
      surname: '',
    });

    const updateProfile = async () => {
      const user = await (await supabase.auth.getUser()).data.user;
      if (dlgData.value.email !== user.email) {
        // Update the user's email
        const { error: emailError, data } = await supabase.auth.updateUser({
          email: dlgData.value.email,
        });
        /* const { data, error } = await supabase
          .from('auth.users')
          .update({ email: dlgData.value.email })
          .eq('id', supabase.auth.user().id); */

        console.log('data', data);

        if (emailError) {
          console.error('Error updating email:', emailError.message);
        }
      }

      if (dlgData.value.password && dlgData.value.password.length >= 8) {
        // Update the user's password
        const { error: passwordError } = await supabase.auth.update({
          password: dlgData.value.password,
        });

        if (passwordError) {
          console.error('Error updating password:', passwordError.message);
        }
      } else {
        console.error('Password must be at least 8 characters long');
      }
      console.log(JSON.stringify(dlgData.value));
    };

    async function fetchProfile() {
      const user = await (await supabase.auth.getUser()).data.user;
      const userId = user.id;
      const email = user.email;

      let { data, error } = await supabase.from('user_profile').select('*').eq('user_id', userId);
      console.log('Profile: ', data);
      if (error) console.log('Error: ', error);
      else console.log('Profile: ', data);
      dlgData.value = {
        id: data[0].id,
        name: data[0].name,
        surname: data[0].surname,
        email: email,
      };
    }

    const closeDialog = () => {
      show.value = false;
      emit('update:show', false);
      console.log('close dialog');
    };

    fetchProfile();

    return {
      show,
      edit,
      dlgData,
      updateProfile,
      closeDialog,
      rules,
    };
  },
});

export const rules = {
  required: (value) => !!value || 'Required.',
  min: (value) => (value && value.length >= 8) || 'Min 8 characters',
  email: (value) => {
    const pattern = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return pattern.test(value) || 'Invalid e-mail.';
  },
  name: (value) => (value && value.length >= 1) || 'Enter your name',
  surname: (value) => (value && value.length >= 1) || 'Enter your surname',
  organization: (value) => {
    console.log('value', value);
    return (value && value.length >= 1) || 'Select an organization';
  },
};
</script>
