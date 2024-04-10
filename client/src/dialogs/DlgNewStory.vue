<template>
  <v-dialog v-model="show" class="dlgWindow" width="50%">
    <v-card>
      <v-card-title>
        <p style="text-align:left;">
          {{ edit ? dlgData.name : 'New user story' }}
          <!-- <span style="float:right;">
            <v-icon>mdi-delete</v-icon>
          </span> -->
        </p>
      </v-card-title>
      <v-form @submit.prevent>
        <v-alert v-if="sameName" type="error">
          Story cannot have a duplicate name.
        </v-alert>
        <v-card-text>
          <v-row dense>
            <v-col cols="7">
              <v-text-field v-model="dlgData.name" label="Title" :rules="checkEmpty" :disabled="!isScrum && !isOwner" required></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-select v-model="dlgData.priority" label="Priority" :items="prio" :rules="checkEmpty" :disabled="!isScrum && !isOwner" required></v-select>
            </v-col>
            <v-col>
              <v-text-field v-model="dlgData.work_value" label="Value" :rules="checkEmpty && checkRange" :disabled="!isScrum && !isOwner" required></v-text-field>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12">
              <v-textarea
              label="Description"
              clearable
              v-model="dlgData.description"
              :disabled="!isScrum && !isOwner"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12">
              <v-data-iterator :items="dlgData.tests">
              <template v-slot:default="{ items }">
                <v-row v-for="(item, index) in items" dense>
                  <!-- <v-checkbox v-model="item.selected"></v-checkbox> -->
                  <v-text-field v-model="item.raw" label="Acceptance test" @input="updateItem(item, index)" :disabled="!isScrum && !isOwner">
                  </v-text-field>
                </v-row>
              </template>
            </v-data-iterator>
            </v-col>
          </v-row>
          <v-row dense>
            <v-btn style="margin: 0 0 20px 4px" @click="addNewTest" v-if="isScrum || isOwner">
            <v-icon size="large" style="margin-right:5px">mdi-plus</v-icon>
            New acceptance test
            </v-btn>
          </v-row>
          <v-row dense>
            <v-col cols="3">
              <v-text-field v-model="dlgData.time" label="Time cost" :disabled="!isScrum"  v-if="edit"></v-text-field>
            </v-col>
            <!-- <v-col cols="3">
              <v-select v-model="dlgData.sprint_id" label="Sprint" :items="sprints" item-value="id" item-title="name" :disabled="!isScrum"  v-if="edit"></v-select>
            </v-col> -->
          </v-row>
          
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn class="bg-deep-purple" style="margin: 0 0 20px 20px" variant="text" @click="completeStory" type="submit" v-if="isOwner && edit">Complete</v-btn>
          <v-btn class="bg-deep-purple" style="margin: 0 0 20px 20px" variant="text" @click="rejectStory" type="submit" v-if="isOwner && edit">Reject</v-btn>
          <v-btn class="bg-deep-purple" style="margin: 0 0 20px 20px" variant="text" @click="saveStory" type="submit" :disabled="!isScrum && !isOwner">Save</v-btn>
          <v-btn class="bg-deep-purple" style="margin: 0 0 20px 20px" variant="text" @click="deleteStory" type="submit" v-if="edit" :disabled="!isScrum && !isOwner">Delete</v-btn>
          <v-spacer></v-spacer>
          <v-btn text="Close" variant="text" @click="show = false"></v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
  <dlg-comment ref="dlgReject"></dlg-comment>
</template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, getCurrentInstance } from 'vue';
  import { supabase } from '../lib/supabaseClient';
  import DlgComment from './DlgComment.vue';
  import { GoTrueAdminApi } from '@supabase/supabase-js';

  export default defineComponent({
    components: {
      DlgComment
    },
    setup() {
      const show = ref(false);
      const edit = ref(false);
      const prio = ref(['Must have', 'Should have', 'Could have', 'Won\'t have this time']);
      const dlgData = ref<any>({
        name: '',
        priority: '',
        description: '',
        sprints: {id: null, name: ''},
        work_value: null,
        time: null,
        tests: [],
        id: 0
      });
      const checkEmpty = [(value: string) => !!value || 'This field is required'];
      const checkRange = [(value: any) => (/^\d+$/.test(value) && value > 0 && value <= 10) || 'Must be of value 1-10'];
      const sprints = ref<any[]>([]);
      const instance = ref<any>();
      const currentProjectId = ref(1);
      const isScrum = ref(false);
      const isOwner = ref(false);
      const dlgReject = ref<any>({});
      const sameName = ref(false);

      onMounted(() => {
        instance.value = getCurrentInstance();
        fetchSprints();
      });

      async function fetchSprints() {
        const organizationId = localStorage.getItem('organizationId');  
        const {data, error} = await supabase
        .from('project')
        .select('id, name, organization_id, sprints(*)')
        .eq('organization_id', organizationId);

        if (error) {
          console.error('Error fetching sprints', error);
        } else {
          data.forEach((project: any) => {
            project.sprints.forEach((sprint: any) => {
              sprints.value.push({id: sprint.id, name: sprint.name, project_id: project.id});
            });
          });
          console.log("SPRINTS");
          console.log(sprints.value);
        }
      }

      const saveStory = async () => {
        if(await checkDuplicate()) {//če ime že obstaja, vrne true
          sameName.value = true;
          console.log("AAAAA")
          return;
        }
        // let properSprint = false;
        // sprints.value.forEach((sprint) => {
        //   if (sprint.id === dlgData.value.sprint_id) {  //sprint value se ne sme inicializirati pri ustvarjanju
        //     if (sprint.project_id === currentProjectId.value){
        //       properSprint = true;
        //    }
        //   }
        // });
        // if (!properSprint) {
        //   return;
        // }
        if (edit.value) {
          console.log('edit');
          console.log(dlgData.value);
          if (dlgData.value.state === 'finished') {
            return;
          }
          if (dlgData.value.sprint_id !== null) { 
            if (dlgData.value.time === null){ 
              return;
            }
          }
          let tmp = [];
          for (let i = 0; i < dlgData.value.tests.length; i++) {
            if (dlgData.value.tests[i] != "" && dlgData.value.tests[i] != "# ")
              tmp.push(dlgData.value.tests[i])
          }
          const {data, error} = await supabase
            .from('user_story')
            .update([{
              sprint_id: dlgData.value.sprint_id,
              name: dlgData.value.name, 
              description: dlgData.value.description,
              project_id: currentProjectId.value,
              state: "idle",
              priority: dlgData.value.priority,
              work_value: dlgData.value.work_value,
              time: dlgData.value.time,
              tests: tmp
            }])
            .eq('id', dlgData.value.id);
          
          if(error)
            throw error;
        }
        else {
          let tmp = [];
          for (let i = 0; i < dlgData.value.tests.length; i++) {
            if (dlgData.value.tests[i] != "" && dlgData.value.tests[i] != "# ")
              tmp.push(dlgData.value.tests[i])
          }
          const {data, error} = await supabase
            .from('user_story')
            .insert([{
              sprint_id: dlgData.value.sprints.id,
              name: dlgData.value.name, 
              description: dlgData.value.description,
              project_id: currentProjectId.value,
              state: "idle",
              priority: dlgData.value.priority,
              work_value: dlgData.value.work_value,
              time: dlgData.value.time,
              tests: tmp
            }]);
          if(error)
            throw error;
          console.log(data);
        }
        show.value = false;
      }

      async function checkDuplicate() {
        const {data, error} = await supabase
          .from('user_story')
          .select('id, name')
          .eq('name', dlgData.value.name)
          .neq('id', dlgData.value.id);
        if(error)
          return true;
        else
          return data.length != 0; 
      }

      async function deleteStory() {
        console.log(dlgData.value.id);
        const { error } = await supabase
          .from('user_story')
          .delete()
          .eq('id', dlgData.value.id);
          if(error)
            throw error;
          show.value = false;
      }

      function addNewTest(){
        dlgData.value.tests.push('# '); 
      }

      function updateItem(item: any, index: number){
        dlgData.value.tests[index] = item.raw;
      }

      function completeStory(){
        console.log(dlgData.value.tests)
      }

      function rejectStory(){
        dlgReject.value.show = true;
        dlgReject.value.storyId = dlgData.value.id;
      }
  
      return {
        show,
        edit,
        isScrum,
        isOwner,
        prio,
        dlgData,
        sprints,
        addNewTest,
        updateItem,
        checkEmpty,
        checkRange,
        sameName,
        currentProjectId,
        saveStory,
        deleteStory,
        completeStory,
        rejectStory,
        dlgReject
      };
    },
  });
  </script>
  