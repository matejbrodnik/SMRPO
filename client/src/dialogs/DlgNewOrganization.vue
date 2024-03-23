<template>
  <v-dialog v-model="show" class="dlgWindow" width="40%">
    <v-card title="Edit profile">
      <v-card-text>
        <v-row dense>
          <v-text-field
            v-model="dlgData.name"
            label="Name of the organization"
            required></v-text-field>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Close" variant="text" @click="closeDialog"></v-btn>
        <v-btn text="Save" variant="text" @click="createOrganization"></v-btn>
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
      name: '',
    });

    const closeDialog = () => {
      show.value = false;
      emit('update:show', false);
      console.log('close dialog');
    };

    const createOrganization = async () => {
      console.log('create organization');
      console.log(dlgData.value);
      const { data, error } = await supabase
        .from('organization')
        .insert([{ name: dlgData.value.name }])
        .select();
      if (error) throw error;
      closeDialog();
      console.log(data);
      return data;
    };

    return {
      show,
      edit,
      dlgData,
      closeDialog,
      createOrganization,
    };
  },
});
</script>
