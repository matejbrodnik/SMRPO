<template>
  <div>
    <v-data-iterator :items="storiesActiveAssigned" item-value="name">
      <template v-slot:default="{ items }">
        <v-text-field>Active user stories | Sprint velocity: {{ sprintDuration }} pts | Load: {{ sprintLoad }}
        </v-text-field>
        <v-row style="margin-bottom: 5px;">
          <v-col v-for="(item, index) in items" :key="item.raw.id" cols="12" lg="3" md="3" sm="6">
            <v-card @click="editStory(item, $event)" 
            :class="{ 'error': item.raw.error }">
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
    <dlg-new-story ref="dlgNewStory" :parentMethod="fetchStories"></dlg-new-story>
  <dlg-new-story ref="dlgEditStory" :parentMethod="fetchStories"></dlg-new-story>
  </div>

  <v-divider></v-divider>
  <div>
    <v-data-iterator
    :items="storiesActiveUnassigned"
    item-value="name"
  >
    <template v-slot:default="{ items }">
      <v-text-field>Unfinished user stories
        <v-btn @click="addToSprint(items)" prepend-icon="mdi-plus"  style="margin-left: 10px;" v-if="items.some((el) => el.selected)">
              Add to sprint
        </v-btn>
      </v-text-field>
      <v-row style="margin-bottom: 5px;">
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
    <v-data-iterator
    :items="storiesFinished"
    item-value="name"
  >
    <template v-slot:default="{ items }">
    <v-text-field>Completed user stories</v-text-field>
      <v-row style="margin-bottom: 5px;">
        <v-col
          v-for="(item, index) in items"
          :key="item.raw.name"
          cols="12"
          lg="3"
          md="3"
          sm="6"
        >
          <v-card @click="editStory(item, $event)">
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
    <v-data-iterator
    :items="storiesNext"
    item-value="name"
    >
      <template v-slot:default="{ items }">
        <v-text-field>Future releases</v-text-field>
        <v-row style="margin-bottom: 5px;">
          <v-col
            v-for="(item, index) in items"
            :key="item.raw.name"
            cols="12"
            lg="3"
            md="3"
            sm="6"
            >
            <v-card @click="editStory(item, $event)">
              <v-card-title class="d-flex align-center">
                <h4>{{ item.raw.name }} </h4>
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

  <v-btn style="margin-top: 20px;" @click="newStory" class="dlgButton" :disabled="!isScrum && !isOwner">New user story</v-btn>
</template>
<script lang="ts">
import { defineComponent, ref, onMounted, watch, getCurrentInstance } from 'vue';
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
    const storiesNext = ref<any[]>([]);
    const storiesActiveUnassigned = ref<any[]>([]);
    const selectedProject = ref<any>({});
    const userId = ref('');
    const isScrum = ref(false);
    const isOwner = ref(false);
    const sprintDuration = ref(0);
    const sprintLoad = ref(0);

    const dlgNewStory = ref<any>({});
    const dlgEditStory = ref<any>({});

    onMounted(() => {
      selectedProject.value = props.selectedProject;
      if (selectedProject.value.id) {
        fetchStories();
        getCurrentSprint();
      }
    });

    async function fetchStories() {
      storiesActiveAssigned.value = [];
      storiesFinished.value = [];
      storiesNext.value = [];
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
        sprintLoad.value = 0;
        projects.forEach(project => {
          project.user_story.forEach(story => {
            if (story.state !== 'finished') {
              if (story.priority == 'Won\'t have this time')
                storiesNext.value.push(story)
              else if (story.sprint_id === null)
                storiesActiveUnassigned.value.push(story);
              else {
                sprintLoad.value += story.time;
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

    async function fetchStoriesTests(edit: boolean) {
      const { data, error } = await supabase
        .from('user_stories_tests')
        .select('description, is_done')
        .eq('project_id', selectedProject.value.id)
        .eq('user_id', userId.value);
      if (error) {
        console.error(error);
        return;
      }
      if (edit) {
        dlgEditStory.value.dlgData.tests = data
        console.log("data")
        console.log(data)
      }
      else {
        dlgNewStory.value.dlgData.tests = data
        console.log("data")
        console.log(data)
      }
    }

    function newStory() {
      console.log(storiesNext.value)
      dlgNewStory.value.isScrum = isScrum.value;
      dlgNewStory.value.isOwner = isOwner.value;
      dlgNewStory.value.edit = false;
      dlgNewStory.value.currentProjectId = selectedProject.value.id;
      dlgNewStory.value.dlgData = {
        name: '',
        priority: '',
        description: '',
        sprints: {id: null, name: ''},
        work_value: null,
        time: null,
        tests: [],
        id: 0,
        comment: ''
      }
      dlgNewStory.value.sameName = false;
      dlgNewStory.value.show = true;
    }

    async function editStory(item: any, event) {
      if (event.ctrlKey)
        return;
      const { data, error } = await supabase
        .from('user_story_tests')
        .select('id, description, is_done')
        .eq('user_story_id', item.raw.id);
      if (error) {
        console.error(error);
        return;
      }

      dlgEditStory.value.isScrum = isScrum.value;
      dlgEditStory.value.isOwner = isOwner.value;
      dlgEditStory.value.dlgData = item.raw;
      dlgEditStory.value.edit = true;
      dlgEditStory.value.currentProjectId = selectedProject.value.id;
      dlgEditStory.value.dlgData.tests = data
      dlgEditStory.value.show = true;
    }

    async function getCurrentSprint() {
      console.log("AAAAAAAAA");
      console.log(selectedProject.value.id);
      const { data, error } = await supabase
          .from('sprints')
          .select('id, name, duration')
          .eq('project_id', selectedProject.value.id)
          .order('start_date', { ascending: false })
          .limit(1);
      if (error)
        console.error('Error fetching sprints');
      else if (data.length > 0) {
        sprintDuration.value = data[0].duration;
        return data[0];
      }
    }

    async function addToSprint(items: any) {
      let sprint = await getCurrentSprint();
      let tmp: any[] = [];
      for(let i = 0; i < items.length; i++) {
        if (items[i].selected && items[i].raw.time != null) {
          if (items[i].raw.time + sprintLoad.value > sprintDuration.value) {
            items[i].raw.error = true;
            tmp.push(items[i].raw)
            continue;
          }
          const {data, error} = await supabase
            .from('user_story')
            .update([{
              sprint_id: sprint?.id
            }])
            .eq('id', items[i].raw.id);
          if(error)
            throw error;
        }
      }
      await fetchStories();
      tmp.forEach((element: any) => {
        storiesActiveAssigned.value.push(element);
        sprintLoad.value += element.time;
        console.log(sprintLoad.value);
        console.log(element);
      });
    }

    function updateSelection(items: any, index: number) {
      items[index].selected = !items[index].selected;
      console.log(items)
    }

    watch(() => props.selectedProject, async (newVal) => {
      console.log("WATCH");
      console.log(selectedProject.value);
      console.log(newVal);
      selectedProject.value = newVal;
      if (selectedProject.value.id) {
        fetchStories();
        getCurrentSprint();
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
      storiesNext,
      storiesActiveUnassigned,
      dlgEditStory,
      dlgNewStory,
      newStory,
      editStory,
      addToSprint,
      updateSelection,
      fetchStories,
      sprintDuration,
      sprintLoad,
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
  background-color: #e0e0e0;
  box-shadow:inset 1px 1px 3px 3px #d7d7ee;
}
.error {
  background-color: #ee4444;
}
</style>