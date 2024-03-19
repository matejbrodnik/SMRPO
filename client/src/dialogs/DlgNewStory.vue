<template>
  <v-dialog v-model="show" class="dlgWindow" width="50%">
    <v-card :title="edit ? 'Edit user story' : 'New user story'">
      <v-form @submit.prevent>
        <v-card-text>
          <v-row dense>
            <v-col cols="7">
              <v-text-field v-model="dlgData.name" label="Title" :rules="checkEmpty" required></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-select v-model="dlgData.priority" label="Priority" :items="prio" :rules="checkEmpty" required></v-select>
            </v-col>
            <v-col>
              <v-text-field v-model="dlgData.work_value" label="Value" required></v-text-field>
            </v-col>
          </v-row>
          <v-row dense>
            <v-textarea
            label="Description"
            clearable
            v-model="dlgData.description"
            ></v-textarea>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text="Close" variant="text" @click="show = false"></v-btn>
          <v-btn text="Save" variant="text" @click="saveUserStory" type="submit"></v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { supabase } from '../lib/supabaseClient';
  
  export default defineComponent({
    setup() {
      const show = ref(false);
      const edit = ref(false);
      const prio = ref(['Must have', 'Should have', 'Could have', 'Won\'t have this time']);
      const dlgData = ref({
        name: '',
        priority: 'Must have',
        description: '',
        work_value: '',
        //tests: [],
      });
      const checkEmpty = [(value: string) => !!value || 'This field is required'];
  
      const saveUserStory = async () => {
        if (edit.value) {
          console.log('edit');
  
        }
        else {
          console.log(JSON.stringify(dlgData.value));
        
          // const {data, error} = await supabase.from('user_story').insert([{name: dlgData.value.name, surname: dlgData.value.surname}]).select();
          // if(error)
          //   throw error;
          // console.log(data);
          // return data;
        }
  
      }
  
      return {
        show,
        edit,
        prio,
        dlgData,
        checkEmpty,
        saveUserStory,
      };
    },
  });
  </script>
  