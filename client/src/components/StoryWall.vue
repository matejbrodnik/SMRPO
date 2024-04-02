<template>

  <div>
    <v-text-field>Active, assigned user stories</v-text-field>
    <v-data-iterator :items="storiesActiveAssigned" item-value="name">
      <template v-slot:default="{ items }">
        <v-row>
          <v-col v-for="(item, index) in items" :key="item.raw.id" cols="12" lg="3" md="3" sm="6">
            <v-card @click="editStory(item, $event)" 
            :class="{ 'selected': item.selected }"
            @click.ctrl="updateSelection(items, index)">
              <v-card-title class="d-flex align-center">
                <h4 style="text-align:left;" class="card-title">{{ item.raw.name + " (" + item.raw.priority + ") " }}
                </h4>
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
          v-for="(item, index) in items"
          :key="item.raw.name"
          cols="12"
          lg="3"
          md="3"
          sm="6"
        >
          <v-card @click="editStory(item, $event)" 
          :class="{ 'selected': item.selected }"
          @click.ctrl="updateSelection(items, index)">
            <v-card-title class="d-flex align-center">
              <h4 class="card-title" >{{ item.raw.name + " (" + item.raw.priority + ") "}} </h4>
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
          v-for="(item, index) in items"
          :key="item.raw.name"
          cols="12"
          lg="3"
          md="3"
          sm="6"
        >
          <v-card @click="editStory(item, $event)" 
          :class="{ 'selected': item.selected }"
          @click.ctrl="updateSelection(items, index)">
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

  <v-btn @click="newStory" class="dlgButton" :disabled="!isScrum && !isOwner">New user story</v-btn>
</template>
<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { supabase } from '../lib/supabaseClient';
import DlgNewStory from '../dialogs/DlgNewStory.vue';
import { ClickOutside } from 'vuetify/directives';

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
    const userId = ref('');
    const isScrum = ref(false);
    const isOwner = ref(false);

    const dlgNewStory = ref<any>({});
    const dlgEditStory = ref<any>({});

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
      isScrum.value = false;
      isOwner.value = false;
      const organizationId = localStorage.getItem('organizationId');
      const { data: projects, error } = await supabase
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

            } else {
              storiesFinished.value.push(story);
            }
          });
        });
        const { data: roles, error } = await supabase
          .from('project_role')
          .select('role')
          .eq('project_id', selectedProject.value.id)
          .eq('user_id', userId.value);
        if (error) {
          console.error(error);
          return;
        }
        roles.forEach(role => {
          if (role.role == 'scrum_master')
            isScrum.value = true;
          if (role.role == 'product_owner')
            isOwner.value = true;
        });
      }
    }

    function newStory() {
      dlgNewStory.value.isScrum = isScrum.value;
      dlgNewStory.value.isOwner = isOwner.value;
      dlgNewStory.value.edit = false;
      dlgNewStory.value.currentProjectId = selectedProject.value.id;
      dlgNewStory.value.show = true;
    }
    function editStory(item: any, event) {
      if (event.ctrlKey)
        return;
      dlgEditStory.value.isScrum = isScrum.value;
      dlgEditStory.value.isOwner = isOwner.value;
      dlgEditStory.value.dlgData = item.raw;
      dlgEditStory.value.edit = true;
      dlgEditStory.value.currentProjectId = selectedProject.value.id;
      dlgEditStory.value.show = true;
    }

    function updateSelection(items: any, index: number) {
      items[index].selected = !items[index].selected;
    }

    watch(() => props.selectedProject, async (newVal) => {
      selectedProject.value = newVal;
      if (selectedProject.value.id) {
        fetchStories();
      }
    });

    supabase.auth.onAuthStateChange(async (_, session) => {
      if (session) {
        const jwt = session.access_token;

        const payload = JSON.parse(atob(jwt.split('.')[1]));
        userId.value = payload.sub;
      } else {
        console.log('The user is not authenticated');
      }
    });

    return {
      show,
      isScrum,
      isOwner,
      search,
      storiesActiveAssigned,
      storiesFinished,
      storiesActiveUnassigned,
      dlgEditStory,
      dlgNewStory,
      newStory,
      editStory,
      updateSelection
    };
  },
});
</script>

<style scoped>
.card-title {
  max-width: 100%;
  height: auto;
  min-height: 32px;
  white-space: pre-wrap;
}
.selected {
  background-color: #e7e7e7;
  box-shadow:inset 1px 1px 3px 3px #d9d9f0;
}
</style>