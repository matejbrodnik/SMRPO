<template>
  
  <div>
    <v-text-field>Active, assigned user stories</v-text-field>
    <v-data-iterator
    :items="storiesActiveAssigned"
    item-value="name"
  >
    <template v-slot:default="{ items }">
      <v-row>
        <v-col
          v-for="item in items"
          :key="item.raw.name"
          cols="12"
          lg="3"
          md="3"
          sm="6"
        >
          <v-card @click="editStory(item)">
            <v-card-title class="d-flex align-center">
              <h4>{{ item.raw.name + " (" + item.raw.priority + ") "}} </h4>
            </v-card-title>
            <v-card-text>
              {{ item.raw.description }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-data-iterator>
  
  <dlg-new-story ref="dlgNewStory"></dlg-new-story>
  <dlg-new-story ref="dlgEditStory"></dlg-new-story>
  </div>
  <v-divider></v-divider>
  <div>
    <v-text-field>Active, unassigned user stories</v-text-field>
    <v-data-iterator
    :items="storiesActiveUnassigned"
    item-value="name"
  >
    <template v-slot:default="{ items }">
      <v-row>
        <v-col
          v-for="item in items"
          :key="item.raw.name"
          cols="12"
          lg="3"
          md="3"
          sm="6"
        >
          <v-card @click="editStory(item)">
            <v-card-title class="d-flex align-center">
              <h4>{{ item.raw.name + " (" + item.raw.priority + ") "}} </h4>
            </v-card-title>
            <v-card-text>
              {{ item.raw.description }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-data-iterator>
  </div>
  <v-divider></v-divider>
  <div>
    <v-text-field>Completed user stories</v-text-field>
    <v-data-iterator
    :items="storiesFinished"
    item-value="name"
  >
    <template v-slot:default="{ items }">
      <v-row>
        <v-col
          v-for="item in items"
          :key="item.raw.name"
          cols="12"
          lg="3"
          md="3"
          sm="6"
        >
          <v-card @click="editStory(item)">
            <v-card-title class="d-flex align-center">
              <h4>{{ item.raw.name + " (" + item.raw.priority + ") "}} </h4>
            </v-card-title>
            <v-card-text>
              {{ item.raw.description }}
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
    </template>
    
  </v-data-iterator>
  
  </div>
  <v-btn @click="newStory" class="dlgButton">New user story</v-btn>
</template>
<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { supabase } from '../lib/supabaseClient';
import DlgNewStory from '../dialogs/DlgNewStory.vue';

export default defineComponent({
  components: {
    DlgNewStory
  },
  props: {
    selectedProject: Object,
  },
  setup(props) {
    const show = ref(false);
    const search = ref('');
    const storiesActiveAssigned = ref<any[]>([]);
    const storiesFinished = ref<any[]>([]);
    const storiesActiveUnassigned = ref<any[]>([]);
    const selectedProject = ref<any>({});

    onMounted(() => {
      selectedProject.value = props.selectedProject;
      if (selectedProject.value.id){
        fetchStories();
      }
    });
    
    async function fetchStories() {
      storiesActiveAssigned.value = [];
      storiesFinished.value = [];
      storiesActiveUnassigned.value = [];
      const organizationId = localStorage.getItem('organizationId'); 
      const {data: projects, error} = await supabase
      .from('project')
      .select('id, name, user_story(*)')
      .eq('organization_id', organizationId)
      .eq('id', selectedProject.value.id)

      if (error) {
        console.error(error);
        return;
      } else {
        console.log(projects);
        projects.forEach(project => {
          project.user_story.forEach(story => {
            if (story.state !== 'finished') {
              if (story.sprint_id === null)
                storiesActiveUnassigned.value.push(story);
              else {
                  storiesActiveAssigned.value.push(story);
              }
              
            }else {
              storiesFinished.value.push(story);
            }
          });
        });
      }
    }

    const dlgNewStory = ref(null);
    const dlgEditStory = ref(null);

    function newStory() {
      dlgNewStory.value.edit = false;
      dlgNewStory.value.show = true;
      
    }
    function editStory(item) {
      console.log(item)
      dlgEditStory.value.dlgData = item.raw;
      dlgEditStory.value.edit = true;
      dlgEditStory.value.show = true;
      
    }

    watch(() => props.selectedProject, async (newVal) => {
      selectedProject.value = newVal;
      if (selectedProject.value.id){
        fetchStories();
      }
    });

    return {
      show,
      search,
      storiesActiveAssigned,
      storiesFinished,
      storiesActiveUnassigned,
      dlgEditStory,
      dlgNewStory,
      newStory,
      editStory
    };
  },
});
</script>
