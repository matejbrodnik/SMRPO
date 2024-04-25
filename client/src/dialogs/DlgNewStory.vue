<template>
  <v-dialog v-model="show" class="dlgWindow" width="50%">
    <v-card>
      <v-card-title>
        <v-row>
          <v-col cols="10">
            <p style="text-align: left">
              {{ edit ? dlgData.name : 'New user story' }}
              <!-- <span style="float:right;">
            <v-icon>mdi-delete</v-icon>
          </span> -->
            </p>
          </v-col>
          <v-col cols="2">
            <v-btn v-if="edit" @click="showComments = true; console.log(dlgData.comments)"
              >Comment&nbsp;
              <v-icon v-if="dlgData.comments.length == 0">mdi-message-text</v-icon>
              <v-badge color="red" :content="dlgData.comments.length" v-if="dlgData.comments.length != 0">
                <v-icon>mdi-message-text</v-icon>
              </v-badge>
              <v-tooltip activator="parent" location="bottom">
                {{ dlgData.comment }}
              </v-tooltip>
            </v-btn>
            <v-dialog v-model="showComments" style="max-width: 800px">
              <v-card>
                <v-card-title>Comments</v-card-title>
                <v-card-item>
                    <v-data-iterator :items="dlgData.comments" :items-per-page="10">
                      <template v-slot:default="{ items }">
                        <v-row v-for="(item, index) in items" dense>
                          <v-card :subtitle="item.raw.rejected ? item.raw.user_name + ' - Product owner' : item.raw.user_name" :text="item.raw.comment" style="white-space: pre-wrap;">
                          </v-card>
                        </v-row>
                      </template>
                    </v-data-iterator>
                </v-card-item>
                <v-divider></v-divider>
                <v-card-actions>
                  <v-btn
                    class="bg-deep-purple"
                    style="margin: 0 0 20px 20px"
                    variant="text"
                    @click="addComment"
                    type="submit"
                    v-if="!isOwner && !isScrum && edit"
                    >Add comment</v-btn
                  >
                  <v-spacer></v-spacer>
                  <v-btn text="Close" variant="text" @click="showComments = false"></v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-col>
        </v-row>
      </v-card-title>
      <v-form @submit.prevent>
        <v-alert v-if="sameName" type="error"> Story cannot have a duplicate name. </v-alert>
        <v-alert v-if="!storyReady" type="error"> Story must first complete all subtasks/tests. </v-alert>
        <v-card-text>
          <v-row dense>
            <v-col cols="7">
              <v-text-field
                v-model="dlgData.name"
                label="Title"
                :rules="checkEmpty"
                :disabled="!isScrum && !isOwner"
                required></v-text-field>
            </v-col>
            <v-col cols="3">
              <v-select
                v-model="dlgData.priority"
                label="Priority"
                :items="prio"
                :rules="checkEmpty"
                :disabled="!isScrum && !isOwner"
                required></v-select>
            </v-col>
            <v-col>
              <v-text-field
                v-model="dlgData.work_value"
                label="Value"
                :rules="checkEmpty && checkRange"
                :disabled="!isScrum && !isOwner"
                required></v-text-field>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12">
              <v-textarea
                label="Description"
                clearable
                v-model="dlgData.description"
                :disabled="!isScrum && !isOwner"></v-textarea>
            </v-col>
          </v-row>
          <v-row dense>
            <v-col cols="12">
              <v-data-iterator :items="dlgData.tests">
                <template v-slot:default="{ items }">
                  <v-row v-for="(item, index) in items" dense>
                    <v-checkbox v-model="item.raw.is_done"></v-checkbox>
                    <v-text-field
                      v-model="item.raw.description"
                      label="Acceptance test"
                      :disabled="!isScrum && !isOwner">
                    </v-text-field>
                  </v-row>
                </template>
              </v-data-iterator>
            </v-col>
          </v-row>
          <v-row dense>
            <v-btn style="margin: 0 0 20px 4px" @click="addNewTest" v-if="isScrum || isOwner">
              <v-icon size="large" style="margin-right: 5px">mdi-plus</v-icon>
              New acceptance test
            </v-btn>
          </v-row>
          <v-row dense>
            <v-col cols="3">
              <v-text-field
                v-model="dlgData.time"
                label="Time cost (pts)"
                :disabled="!isScrum"
                v-if="edit"></v-text-field>
            </v-col>
            <!-- <v-col cols="3">
              <v-select v-model="dlgData.sprint_id" label="Sprint" :items="sprints" item-value="id" item-title="name" :disabled="!isScrum"  v-if="edit"></v-select>
            </v-col> -->
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn
            class="bg-deep-purple"
            style="margin: 0 0 20px 20px"
            variant="text"
            @click="completeStory"
            type="submit"
            v-if="isOwner && edit && dlgData.sprint_id != null && dlgData.state != 'finished'"
            >Accept</v-btn
          >
          <v-btn
            class="bg-deep-purple"
            style="margin: 0 0 20px 20px"
            variant="text"
            @click="rejectStory"
            type="submit"
            v-if="isOwner && edit && dlgData.sprint_id != null && dlgData.state != 'finished'"
            >Reject</v-btn
          >
          <v-btn
            class="bg-deep-purple"
            style="margin: 0 0 20px 20px"
            variant="text"
            @click="saveStory"
            type="submit"
            :disabled="!isScrum && !isOwner"
            >Save</v-btn
          >
          <v-btn
            class="bg-deep-purple"
            style="margin: 0 0 20px 20px"
            variant="text"
            @click="deleteStory"
            type="submit"
            v-if="edit"
            :disabled="!isScrum && !isOwner"
            >Delete</v-btn
          >
          <v-spacer></v-spacer>
          <v-btn text="Close" variant="text" @click="show = false"></v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
  <dlg-comment ref="dlgReject" :parentMethod="fetchStories"></dlg-comment>
</template>

<script lang="ts">
import { defineComponent, getCurrentInstance, onMounted, ref } from 'vue';
import { supabase } from '../lib/supabaseClient';
import DlgComment from './DlgComment.vue';

export default defineComponent({
  components: {
    DlgComment,
  },
  props: {
    parentMethod: Function,
  },
  setup(props) {
    const show = ref(false);
    const edit = ref(false);
    const prio = ref(['Must have', 'Should have', 'Could have', "Won't have this time"]);
    const dlgData = ref<any>({
      name: '',
      priority: '',
      description: '',
      sprints: { id: null, name: '' },
      work_value: null,
      time: null,
      tests: [{ id: 1, description: '# ', is_done: false }],
      comments: [{ comment: '', user_name: '', rejected: false }],
      id: 0,
      state: 'idle',
      comment: '',
    });
    const checkEmpty = [(value: string) => !!value || 'This field is required'];
    const checkRange = [
      (value: any) => (/^\d+$/.test(value) && value > 0 && value <= 10) || 'Must be of value 1-10',
    ];
    const sprints = ref<any[]>([]);
    const instance = ref<any>();
    const currentProjectId = ref(1);
    const isScrum = ref(false);
    const isOwner = ref(false);
    const dlgReject = ref<any>({});
    const sameName = ref(false);
    const storyReady = ref(true);
    const userId = ref('');
    const showComments = ref(false);

    onMounted(() => {
      instance.value = getCurrentInstance();
      fetchSprints();
    });

    async function fetchSprints() {
      const { data, error } = await supabase.from('project').select('id, name, sprints(*)');

      if (error) {
        console.error('Error fetching sprints', error);
      } else {
        data.forEach((project: any) => {
          project.sprints.forEach((sprint: any) => {
            sprints.value.push({ id: sprint.id, name: sprint.name, project_id: project.id });
          });
        });
        console.log('SPRINTS');
        console.log(sprints.value);
      }
    }

    const saveStory = async () => {
      if (await checkDuplicate()) {
        //če ime že obstaja, vrne true
        sameName.value = true;
        return;
      }
      let editTests = [];
      let newTests = [];
      let storyId = 1;
      for (let i = 0; i < dlgData.value.tests.length; i++) {
        if (dlgData.value.tests[i] != '' && dlgData.value.tests[i] != '# ') {
          if (dlgData.value.tests[i].id == null) newTests.push(dlgData.value.tests[i]);
          else editTests.push(dlgData.value.tests[i]);
        }
      }
      if (edit.value) {
        if (dlgData.value.state === 'finished') {
          return;
        }
        if (dlgData.value.sprint_id !== null) {
          if (dlgData.value.time === null) {
            return;
          }
        }

        const { data, error } = await supabase
          .from('user_story')
          .update([
            {
              sprint_id: dlgData.value.sprint_id,
              name: dlgData.value.name,
              description: dlgData.value.description,
              project_id: currentProjectId.value,
              state: 'idle',
              priority: dlgData.value.priority,
              work_value: dlgData.value.work_value,
              time: dlgData.value.time,
            },
          ])
          .eq('id', dlgData.value.id)
          .select('id');

        if (error) throw error;
        storyId = data[0].id;
        editTests.forEach(async (element) => {
          const { data: test, error } = await supabase.from('user_story_tests').upsert([
            {
              id: element.id,
              user_story_id: storyId,
              description: element.description,
              is_done: element.is_done,
            },
          ]);
          if (error) {
            console.error(error);
            return;
          }
        });
      } else {
        const { data, error } = await supabase
          .from('user_story')
          .insert([
            {
              sprint_id: dlgData.value.sprints.id,
              name: dlgData.value.name,
              description: dlgData.value.description,
              project_id: currentProjectId.value,
              state: 'idle',
              priority: dlgData.value.priority,
              work_value: dlgData.value.work_value,
              time: dlgData.value.time,
            },
          ])
          .select('id');

        if (error) throw error;
        storyId = data[0].id;
      }
      newTests.forEach(async (element) => {
        const { data: test, error } = await supabase.from('user_story_tests').insert([
          {
            user_story_id: storyId,
            description: element.description,
            is_done: element.is_done,
          },
        ]);
        if (error) {
          console.error(error);
          return;
        }
      });
      fetchStories();
      show.value = false;
    };

    async function fetchStories() {
      props.parentMethod?.();
    }

    async function checkDuplicate() {
      const { data, error } = await supabase
        .from('user_story')
        .select('id, name')
        .eq('name', dlgData.value.name)
        .neq('id', dlgData.value.id);
      if (error) return true;
      else return data.length != 0;
    }

    async function deleteStory() {
      console.log(dlgData.value.id);
      const { error } = await supabase
        .from('user_story_tests')
        .delete()
        .eq('user_story_id', dlgData.value.id);
      if (error) throw error;
      const { error: error1 } = await supabase
        .from('user_story')
        .delete()
        .eq('id', dlgData.value.id);
      if (error1) throw error1;
      show.value = false;
      fetchStories();
    }

    function addNewTest() {
      dlgData.value.tests.push({ description: '# ', is_done: false });
    }

    async function completeStory() {
      const { data, error } = await supabase
        .from('subtasks')
        .select('is_done')
        .eq('user_story_id', dlgData.value.id);
      if (error) throw error;
      storyReady.value = dlgData.value.tests.every((item: any) => item.is_done) && data.every(v => v.is_done)
      if (storyReady.value) {
        const { error } = await supabase
          .from('user_story')
          .update([
            {
              state: 'finished',
            },
          ])
          .eq('id', dlgData.value.id);
        if (error) throw error;
        fetchStories();
        show.value = false;
      }
    }

    async function rejectStory() {
      dlgReject.value.reject = true;
      dlgReject.value.userId = userId.value;
      dlgReject.value.storyId = dlgData.value.id;
      dlgReject.value.show = true;
    }

    function addComment() {
      dlgReject.value.reject = false;
      dlgReject.value.userId = userId.value;
      dlgReject.value.storyId = dlgData.value.id;
      dlgReject.value.show = true;
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
      checkEmpty,
      checkRange,
      sameName,
      currentProjectId,
      saveStory,
      deleteStory,
      completeStory,
      rejectStory,
      fetchStories,
      dlgReject,
      userId,
      showComments,
      addComment,
      storyReady
    };
  },
});
</script>

<style scoped>
.reject {
  background-color: #dd5555;
}
</style>