<template>
  <v-dialog v-model="show" class="dlgWindow" width="40%">
    <v-card title="Edit profile">
      <v-card-text>
        <!-- <v-row dense>
          <v-text-field v-model="dlgData.user" label="Uporabniško ime" required></v-text-field>
        </v-row> -->

        <v-row dense v-if="successMessage">
          <v-alert type="success">{{ successMessage }}</v-alert>
        </v-row>
        <v-row dense v-if="errorMessage">
          <v-alert type="error">{{ errorMessage }}</v-alert>
        </v-row>

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
            :rules="[rules.password]"
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
      password: '',
    });

    const originalEmail = ref('');

    const successMessage = ref('');
    const errorMessage = ref('');

    const updateProfile = async () => {
      const user = await (await supabase.auth.getUser()).data.user;

      if (dlgData.value.password && dlgData.value.password.length >= 8) {
        // Update the user's password
        const { error: passwordError } = await supabase.auth.updateUser({
          password: dlgData.value.password,
        });

        if (passwordError) {
          errorMessage.value = 'Error updating password: ' + passwordError.message;
          setTimeout(() => {
            successMessage.value = '';
          }, 2000);

          //dont update profile if password update failed
          return;
        }
      }

      //await supabase.auth.updateUser({ "e65dc24b0fa76b955fd9bfc9f6a7e8ae90e81807d767e4ffd7cb0290" });

      if (dlgData.value.email !== originalEmail.value) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: dlgData.value.email,
        });
        if (emailError) {
          console.log('Error updating email: ', emailError);
        }
      }

      const { data, error } = await supabase
        .from('user_profile')
        .update({
          name: dlgData.value.name,
          surname: dlgData.value.surname,
        })
        .eq('id', dlgData.value.id);

      if (error) {
        errorMessage.value = 'Error updating profile: ' + error.message;
        setTimeout(() => {
          successMessage.value = '';
        }, 2000);
      } else {
        successMessage.value = 'Profile updated successfully!';
        setTimeout(() => {
          successMessage.value = '';
        }, 2000);
      }
    };

    async function fetchProfile() {
      const user = await (await supabase.auth.getUser()).data.user;
      const userId = user.id;
      originalEmail.value = user.email;

      let { data, error } = await supabase.from('user_profile').select('*').eq('user_id', userId);
      console.log('Profile: ', data);
      if (error) console.log('Error: ', error);
      else console.log('Profile: ', data);
      dlgData.value = {
        id: data[0].id,
        name: data[0].name,
        surname: data[0].surname,
        email: user.email,
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
      successMessage,
      errorMessage,
    };
  },
});

export const rules = {
  required: (value) => !!value || 'Required.',
  min: (value) => (!!value && value.length >= 8) || 'Min 8 characters',
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
  password: (value) => {
    if (!value) {
      return true;
    }
    return value.length >= 8 || 'Min 8 characters';
  },
  passwordsMatch: (password) => (value) => value === password || 'Passwords do not match',
};
</script>
