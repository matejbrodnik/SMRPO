<template>
  <v-dialog v-model="show" class="dlgWindow" width="40%">
    <v-card title="New user">
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
          <v-row dense>
            <v-text-field
              v-model="dlgData.email"
              label="E-mail"
              :rules="[rules.required, rules.email]"
              required></v-text-field>
          </v-row>
          <v-row dense>
            <v-text-field
              v-model="dlgData.password"
              label="Choose password"
              type="password"
              :rules="[rules.required, rules.min]"
              required></v-text-field>
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
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { rules } from './DlgProfile.vue';

export default defineComponent({
  setup() {
    const show = ref(false);
    const dlgData = ref({
      password: '',
      name: '',
      surname: '',
      email: '',
      rights: 'user',
    });

    const form = ref(null);


    const saveNewUser = async () => {
      const value = await form.value.validate();
      console.log('value', value.valid);
      if (value.valid) {
        // form is valid, proceed with adding new user
        console.log('form is valid');

        const body = JSON.stringify({
          name: dlgData.value.name,
          email: dlgData.value.email,
          surname: dlgData.value.surname,
          password: dlgData.value.password,
        });
        console.log('body', body);

        const { data, error } = await supabase.functions.invoke('createUser', {
          body: body,
        });

        console.log('data', data);
        console.log('error', error);

        if (!error) {
          // No error, close the dialog
          show.value = false;
        }

        return data;
      }
    };

    return {
      show,
      dlgData,
      saveNewUser,
      rules,
      form,
    };
  },
});
</script>
