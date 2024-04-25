<template>
  <div style="height: 100%">
    <div style="margin: 30px auto; max-width: 80%">
      <div v-if="isLoading">Loading...</div>
      <div v-else>
        <v-select v-model="selectedProject" :items="projects" label="Select a project" item-title="name"
          @update:model-value="getCurrentSprint" return-object>
        </v-select>
        <div style="padding: 30px 0">
          <div v-if="noActiveSprint">There is no active sprint for this project.</div>
          <div v-else-if="fetchingData">Getting user stories...</div>
          <div v-else>
            <b>Sprint data</b>
            <div>Name: {{ currentSprint.name }}</div>
            <div>
              Active from {{ formatDate(currentSprint.start_date) }} to
              {{ formatDate(currentSprint.end_date) }}
            </div>
            <div>Velocity: {{ currentSprint.duration }} pts</div>
            <v-container>
              <div v-if="hasNoUserStories">This sprint has no user stories assigned.</div>
              <div v-else>
                <v-card v-for="(story, index) in userStories" :key="index" color="deep-purple"
                  style="padding: 20px; margin: 30px auto">
                  <v-card-item>
                    <v-row>
                      <v-col cols="6">
                        <v-card-title>{{ story.name }}</v-card-title>
                      </v-col>
                      <v-col cols="6" style="display: flex; justify-content: end">
                        <v-card-actions>
                          <v-btn size="large" color="white" @click="openDialog(index)">+ Add subtask</v-btn>
                        </v-card-actions>
                      </v-col>
                    </v-row>
                    <v-card-subtitle>{{ story.description }}</v-card-subtitle>
                  </v-card-item>
                  <v-divider></v-divider>
                  <v-card-text>Priority: {{ story.priority }} </v-card-text>
                  <v-divider></v-divider>
                  <v-table v-if="story.subtasks && story.subtasks.length > 0">
                    <thead>
                      <tr>
                        <th>Done</th>
                        <th>Description</th>
                        <th>Suggested developer</th>
                        <th>Assigned developer</th>
                        <th>Logged time [h]</th>
                        <th>Remaining time [h]</th>
                        <!-- <th>Estimated time [h]</th> -->
                        <th></th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="subtask in story.subtasks" :key="subtask.id">
                        <td>
                          <v-checkbox v-model="subtask.is_done"
                            :disabled="subtask.assigned_developer_id !== user_profile_id.valueOf()"
                            @update:model-value="changeSubtaskDone(subtask)">
                          </v-checkbox>
                        </td>
                        <td>
                          {{ subtask.description }}
                        </td>
                        <td>
                          {{ subtask.developer }}
                        </td>

                        <td>{{ subtask.assigned_developer }}</td>
                        <td>
                          {{ subtask.loggedTimeSum }}
                        </td>
                        <td>
                          {{ subtask.remaining_time }}
                        </td>
                        <!-- <td>
                          {{ subtask.estimated_time }}
                        </td> -->
                        <td>
                          <v-btn color="green" v-if="checkTaskCanBeAccepted && !subtask.assigned_developer_id"
                            @click="acceptSubtask(subtask)">Accept</v-btn>
                          <v-btn color="red" v-if="
                            subtask.assigned_developer_id === user_profile_id.valueOf() &&
                            !subtask.is_done
                          " @click="rejectSubtask(subtask)">Reject</v-btn>
                        </td>
                        <td>
                          <v-btn color="white" v-if="
                            subtask.assigned_developer_id === user_profile_id.valueOf() &&
                            !subtask.is_done
                          " @click="openLogTimeDialog(subtask)">
                            Log time
                          </v-btn>
                        </td>
                      </tr>
                      <tr>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td>Total logged time: {{ userStories[index].loggedTimeSum }}</td>
                        <td> Total remaining time: {{ userStories[index].timeSum }} </td>
                        <!-- <td>Estimated time sum: {{ userStories[index].timeSum }} h</td> -->
                      </tr>
                    </tbody>
                  </v-table>
                </v-card>

                <v-dialog v-model="showDialog" style="max-width: 800px">
                  <v-card>
                    <v-card-title>User story: <b>{{ storyName }}</b></v-card-title>
                    <v-card-subtitle>Add a new subtask</v-card-subtitle>
                    <v-form ref="createForm">
                      <v-alert v-if="successfullyCreatedSubtask" type="success">
                        Subtask created successfully!
                      </v-alert>
                      <v-text-field style="margin: 20px" v-model="subtask.description" label="Description"
                        :rules="checkRules('Description')"></v-text-field>
                      <v-text-field :rules="checkRules('Duration', true)" style="margin: 20px" v-model="subtask.time"
                        label="Duration in hours"></v-text-field>
                      <v-select style="margin: 20px" v-model="subtask.developer" :items="developer_names"
                        label="Suggested developer"></v-select>
                    </v-form>
                    <v-card-actions>
                      <v-btn style="margin: 10px" class="bg-deep-purple" @click="createSubtask">Create</v-btn>
                      <v-spacer></v-spacer>
                      <v-btn @click="showDialog = false">Close</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>


                <v-dialog v-model="showLogTimeDialog" class="dlgWindow" width="50%">
                  <v-card>
                    <v-card-title>Log time</v-card-title>
                    <v-table v-if="timelogs.length > 0">
                      <thead>
                        <tr>
                          <th>Start time</th>
                          <th>Duration [h]</th>

                        </tr>
                      </thead>

                      <tbody>
                        <tr v-for="timelog in timelogs" :key="timelog.id">
                          <template v-if="!timelog.is_active">
                            <td>{{ formatDate(timelog.start_time) }}</td>
                            <td>{{ parseFloat(timelog.duration.toFixed(2)) }}</td>
                            <td>
                             
                                <v-btn class="bg-deep-purple" size="30" @click="editTimelogDuration(timelog)">
                                  <v-icon size="medium20">mdi-pencil</v-icon>
                                </v-btn>
                            
                            </td>
                          </template>
                        </tr>
                      </tbody>
                    </v-table>



                    <v-card-actions>
                      <v-btn color="green" v-if="!activeSessionExists" @click="startSession()">
                        Start session
                      </v-btn>
                      <v-btn color="red" v-if="activeSessionExists" @click="endSession()">
                        End session
                      </v-btn>
                    </v-card-actions>

                  </v-card>
                  
                </v-dialog>
                <v-dialog v-model="editTimelog"  class="dlgWindow" width="30%">
                  <v-card>
                    <v-card-title>Edit timelog duration [h]</v-card-title>
                    <v-text-field v-model="currentTimelog.duration" label="Duration"></v-text-field>

                    <v-text-field v-model="estimatedSubtaskTime" label="Estimated remaining subtask time"></v-text-field>
                    <v-card-actions>
                      <v-btn color="blue" @click="closeEditTimelog()">Close</v-btn>
                      <v-btn color="green" @click="saveTimelog()">Save</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-dialog>
              </div>
            </v-container>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.v-input__details {
  display: none;
}
</style>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { formatDate } from '../lib/dateFormatter';
import { supabase } from '../lib/supabaseClient';


const user_profile_id = ref('');

onMounted(async () => {
  const user = (await supabase.auth.getUser()).data.user;
  const userId = user.id;
  let { data: profile, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId);
  user_profile_id.value = profile[0].id;
  console.log('User profile id:', user_profile_id.value);

  getProjects();
});

const isLoading = ref(true);
const projects = ref<any[]>([]);
const selectedProject = ref({
  id: '',
  name: '',
  description: '',
  sprint: '',
});
const currentSprint = ref({
  id: '',
  name: '',
  start_date: '',
  end_date: '',
  duration: '',
});
const noActiveSprint = ref(false);
const hasNoUserStories = ref(false);
const userStories = ref<any[]>([]);

const timelogs = ref<any[]>([]);
const editTimelog = ref(false);
const currentTimelog = ref({
  id: '',
  start_time: '',
  duration: '',
  subtask_id: '',
});
const estimatedSubtaskTime = ref(0);

const showDialog = ref(false);
const showLogTimeDialog = ref(false);
const activeSessionExists = ref(false);
const storyName = ref('');
const activeIndex = ref(0);

const successfullyCreatedSubtask = ref(false);
const subtask = ref({
  description: '',
  time: '',
  developer: '',
  is_done: false,
});

const developer_names = ref<string[]>([]);
const createForm = ref(null);

const fetchingData = ref(false);

const checkTaskCanBeAccepted = ref(false);
async function fetchUserProjectRole() {
  const user = (await supabase.auth.getUser()).data.user;
  const userId = user.id;
  const { data, error } = await supabase
    .from('project_role')
    .select('role')
    .eq('project_id', selectedProject.value.id)
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching user project role');
  } else {
    if (data[0].role === 'developer') {
      checkTaskCanBeAccepted.value = true;
    }
  }
}

watch(selectedProject, fetchUserProjectRole);

async function getDevelopers(projectId: string) {
  const { data: user_ids, error } = await supabase
    .from('project_role')
    .select('user_id')
    .eq('project_id', projectId)
    .eq('role', 'developer');
  if (error) {
    console.error('Error fetching project role');
  } else {
    const { data: users, error } = await supabase
      .from('user_profile')
      .select('name, surname')
      .in(
        'user_id',
        user_ids.map((user: any) => user.user_id)
      );

    if (error) {
      console.error('Error fetching user profiles');
    } else {
      developer_names.value = users.map((user: any) => user.name + ' ' + user.surname);
    }
  }
}

async function openDialog(index: number) {
  subtask.value.description = '';
  subtask.value.time = '';
  subtask.value.developer = '';
  subtask.value.is_done = false;
  successfullyCreatedSubtask.value = false;
  activeIndex.value = index;
  showDialog.value = true;
  storyName.value = userStories.value[index].name;
}

async function getProjects() {
  const user = (await supabase.auth.getUser()).data.user;
  const userId = user.id;

  const { data, error } = await supabase
    .from('project_role')
    .select(
      `
            project:project_id ( id, name, description )
        `
    )
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching projects');
  } else {
    projects.value = data.map((project: any) => project.project);
    selectedProject.value = projects.value[0];
  }
  await getCurrentSprint();
  isLoading.value = false;
}

async function getCurrentSprint() {
  const currentDate = new Date();
  const { data, error } = await supabase
    .from('sprints')
    .select('id, name, start_date, end_date, duration')
    .eq('project_id', selectedProject.value.id);
  if (error) {
    console.error('Error fetching sprints');
  } else {
    if (data) {
      for (const sprint of data) {
        if (new Date(sprint.start_date) < currentDate && new Date(sprint.end_date) > currentDate) {
          currentSprint.value = sprint;
          noActiveSprint.value = false;
          fetchingData.value = true;

          await getDevelopers(selectedProject.value.id);
          await getUserStories();

          fetchingData.value = false;
          return;
        }
      }
      noActiveSprint.value = true;
    }
  }
}

async function getUserStories() {
  if (currentSprint.value.id == '') {
    hasNoUserStories.value = true;
    return;
  }
  hasNoUserStories.value = false;

  const { data, error } = await supabase
    .from('user_story')
    .select('id, name, description, state, priority')
    .eq('sprint_id', currentSprint.value.id);
  if (error) {
    console.error('Error fetching user stories');
  } else {
    userStories.value = data;
    for (const story of userStories.value) {
      await getLoggedTimes(story);
      await getSubtasks(story);
    }
  }
}

async function getSubtasks(userStory: any) {
  const { data, error } = await supabase
    .from('subtasks')
    .select('id, description, estimated_time, remaining_time, developer_id, is_done, assigned_developer_id, user_story_id')
    .eq('user_story_id', userStory.id);
  if (error) {
    console.error('Error fetching subtasks');
  } else {
    userStory.subtasks = data;
    const timeSum = ref(0);

    for (const subtask of userStory.subtasks) {

      const loggedTimeSum = ref(0);


      for (const index in userStory.loggedTimes) {

        var timelog = userStory.loggedTimes.at(index)
        if (timelog.subtask_id === subtask.id) {
          loggedTimeSum.value += parseFloat(timelog.duration.toFixed(2));
        }
      }

      subtask.loggedTimeSum = loggedTimeSum.value;

      if (subtask.assigned_developer_id) {
        const { data: assignedDeveloper } = await supabase
          .from('user_profile')
          .select('name, surname')
          .eq('id', subtask.assigned_developer_id)
          .single();

        subtask.assigned_developer = assignedDeveloper?.name + ' ' + assignedDeveloper?.surname;
      }

      if (subtask.developer_id) {
        const { data: developer, error } = await supabase
          .from('user_profile')
          .select('name, surname')
          .eq('id', subtask.developer_id)
          .single();
        subtask.developer = developer.name + ' ' + developer.surname;
      }

      subtask.remaining_time = parseFloat(subtask.remaining_time.toFixed(1));

      timeSum.value += subtask.remaining_time;

      // subtask.remainingTime = subtask.estimated_time - subtask.loggedTimeSum;
    }
    userStory.timeSum = timeSum.value;
  }
}

async function createSubtask() {
  if (createForm.value) {
    const createFormValue = createForm.value as { validate: () => void };
    createFormValue.validate();
  }

  const formItems = [subtask.value.description, subtask.value.time, subtask.value.developer];
  // Check for empty subtask.value.description and subtask.value.time
  if (formItems[0] === '' || formItems[1] === '') {
    return;
  }

  let subtaskPayload = {
    user_story_id: userStories.value[activeIndex.value].id,
    description: subtask.value.description,
    estimated_time: subtask.value.time,
    developer_id: null,
    is_done: false,
  }

  if (subtask.value.developer !== '') {
    const { data: developer, error } = await supabase
      .from('user_profile')
      .select('id')
      .eq('name', subtask.value.developer.split(' ')[0])
      .eq('surname', subtask.value.developer.split(' ')[1])
      .single();

    if (error) {
      console.error('Error fetching developer');
      return;
    }
    subtaskPayload['developer_id'] = developer.id;

  }
  const { error: insertError } = await supabase.from('subtasks').insert([
    {
      user_story_id: subtaskPayload.user_story_id,
      description: subtaskPayload.description,
      estimated_time: subtaskPayload.estimated_time,
      remaining_time: subtaskPayload.estimated_time,
      developer_id: subtaskPayload.developer_id,
      is_done: subtaskPayload.is_done,
    },
  ]);
  if (insertError) {
    console.error('Error creating subtask');
  } else {
    successfullyCreatedSubtask.value = true;

    setTimeout(() => {
      showDialog.value = false;
      subtask.value.description = '';
      subtask.value.time = '';
      subtask.value.developer = '';
    }, 1000);

    await getUserStories();
  }
}

async function changeSubtaskDone(subtask: any) {
  const { error } = await supabase
    .from('subtasks')
    .update({ is_done: subtask.is_done })
    .eq('id', subtask.id);
  if (error) {
    console.error('Error updating subtask');
  }
}

async function acceptSubtask(subtask: any) {
  console.log('Accepting subtask', subtask);
  const user = (await supabase.auth.getUser()).data.user;
  const userId = user.id;
  let { data: profile, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    console.error('Error fetching user profile');
  } else {
    const { error } = await supabase
      .from('subtasks')
      .update({ assigned_developer_id: profile[0].id })
      .eq('id', subtask.id);
    if (error) {
      console.error('Error accepting subtask');
    } else {
      console.log('Subtask accepted');
      await getUserStories();
    }
  }
}

async function rejectSubtask(subtask: any) {
  console.log('Rejecting subtask', subtask);
  const { error } = await supabase
    .from('subtasks')
    .update({ assigned_developer_id: null })
    .eq('id', subtask.id);
  if (error) {
    console.error('Error rejecting subtask');
  } else {
    console.log('Subtask rejected');
    await getUserStories();
  }
}

async function getLoggedTimes(userStory: any) {
  const { data, error } = await supabase
    .from('subtask_timelog')
    .select('*')
    .eq('user_story', userStory.id);
  if (error) {
    console.error('Error fetching logged times');
  } else {
    userStory.loggedTimes = data;
    const timeSum = ref(0);
    for (const log of userStory.loggedTimes) {
      timeSum.value += parseFloat(log.duration.toFixed(2));
    }
    userStory.loggedTimeSum = timeSum.value;
  }
}

const checkRules = (field: any, duration = false) => {
  let rules = [(v) => !!v || `${field} is required`];
  if (duration) {
    rules.push((v) => !isNaN(parseFloat(v)) || 'Input must be a number');
  }
  return rules;
};

const currentSubtask = ref({
  id: '',
  developer_id: '',
  user_story_id: '',
});

async function openLogTimeDialog(item: any) {
  showLogTimeDialog.value = true;
  activeSessionExists.value = false;

  currentSubtask.value.id = item.id;
  currentSubtask.value.developer_id = item.assigned_developer_id;
  currentSubtask.value.user_story_id = item.user_story_id;  // filter userstory.loggedTimes for this subtask
  for (const story of userStories.value) {
    if (story.id === item.user_story_id) {
      console.log(story.loggedTimes);
      var subtaskTimeLogs = story.loggedTimes.filter((log: any) => log.subtask_id === item.id && log.user_id === item.assigned_developer_id);
      break;
    }
  }

  // here if len of subtaskTimeLogs is nil we need to create them and await 
  if (subtaskTimeLogs.length === 0) {
    await createTimelogsForSubtask(item);
    await getUserStories();
    showLogTimeDialog.value = false;
    return;
  }

  for (const timelog of subtaskTimeLogs) {
    if (timelog.is_active) {
      activeSessionExists.value = true;
      break;
    }
  }

  var today = new Date();

  subtaskTimeLogs = subtaskTimeLogs.filter((log: any) => new Date(log.start_time) <= today && log.is_active != true);

  timelogs.value = subtaskTimeLogs;


  estimatedSubtaskTime.value = item.remaining_time;
}

async function createTimelogsForSubtask(item: any) {
  var start_date = new Date(currentSprint.value.start_date);
  var end_date = new Date(currentSprint.value.end_date);

  var timelogs = [];

  for (let date = new Date(start_date); date <= end_date; date.setDate(date.getDate() + 1)) {
        // Format date or perform operations
        console.log(date.toISOString().substring(0, 20));  

        var newTimelog = {
          subtask_id: item.id,
          user_id: item.assigned_developer_id,
          user_story: item.user_story_id,
          start_time: date.toUTCString(),
          duration: 0,
          is_active: false,
        }

        timelogs.push(newTimelog);
    }

    const { error } = await supabase.from('subtask_timelog').insert(timelogs);
    if (error) {
      console.log('error creating timelogs');
      console.log(error);
    } else {
      console.log('Timelogs created');
    }
}


const closeLogTimeDialog = () => {
  showLogTimeDialog.value = false;
  activeSessionExists.value = true;
  currentSubtask.value = {
    id: '',
    developer_id: '',
    user_story_id: '',
  }
  // clear all other set variables as needed
}

async function startSession() {
  console.log('Starting session');

  const { error } = await supabase.from('subtask_timelog').insert([
    {
      subtask_id: currentSubtask.value.id,
      user_id: currentSubtask.value.developer_id,
      user_story: currentSubtask.value.user_story_id,
      // start_time: new Date(),
      // duration: 0,
      is_active: true,
    },
  ]);
  if (error) {
    console.log('error starting session');
    console.log(error);
  } else {
    console.log('Session started');
    closeLogTimeDialog();

    await getUserStories();
  }
}

async function endSession() {
  console.log('Ending session');
  // check if there are two sessions happening on the same day (today)
  const today = new Date();

  for (const story of userStories.value) {
    if (story.id === currentSubtask.value.user_story_id) {
      var subtaskTimeLogs = story.loggedTimes.filter((log: any) => log.subtask_id === currentSubtask.value.id && log.user_id === currentSubtask.value.developer_id);
      break;
    }
  }
  for (const timelog of subtaskTimeLogs) {
    if (timelog.is_active) {
      var activeSession = timelog;
      break;
    }
  }



  var count = 0;
  for (const timelog of subtaskTimeLogs) {
    if (areSameDate(new Date(timelog.start_time), today)) {
      count++;
      if (timelog.is_active != true) {
        var inactiveSession = timelog;
        console.log("inactive session");
        console.log(inactiveSession);
      }
    }
  }

  var duration = getDifferenceInHours(new Date(activeSession.start_time), today);
  console.log(duration);

  if (count > 1) {
    console.log('There are two active sessions today');
    duration = duration + parseFloat(inactiveSession.duration);
    console.log(duration);

    const { error: deleteError } = await supabase.from('subtask_timelog').delete().eq('id', activeSession.id);
    if (deleteError) {
      console.log('error ending session');
      console.log(deleteError);
    } else {
      console.log('Session deleted');
    }

    const { error } = await supabase.from('subtask_timelog').update([
      {
        duration: duration,
        is_active: false,
      }
    ]).eq('id', inactiveSession.id);
    if (error) {
      console.log('error ending session');
      console.log(error);
    } else {
      console.log('Session ended');
      closeLogTimeDialog();
    }
  } else {
    const { error } = await supabase.from('subtask_timelog').update([
      {
        duration: duration,
        is_active: false,
      }
    ]).eq('id', activeSession.id);
    if (error) {
      console.log('error ending session');
      console.log(error);
    } else {
      console.log('Session ended');
      closeLogTimeDialog();
    }
  }


  closeLogTimeDialog();

  await getUserStories();


}

const editTimelogDuration = (item) => {
  currentTimelog.value.id = item.id;
  currentTimelog.value.duration = item.duration;
  currentTimelog.value.subtask_id = item.subtask_id;
  // console.log(item);
  editTimelog.value = true;
}

const closeEditTimelog = () => {
  editTimelog.value = false;
  currentTimelog.value = {
    id: '',
    start_time: '',
    duration: '',
    subtask_id: '',
  }
}

async function saveTimelog() {


  if (parseFloat(currentTimelog.value.duration) < 0) {
    console.log('Duration cannot be negative');
    return;
  }
  if (parseFloat(currentTimelog.value.duration) > 20) {
    console.log('Duration cannot be more than 20 hours');
    return;
  }

  const { error } = await supabase.from('subtask_timelog').update([
    {
      duration: currentTimelog.value.duration,
    }
  ]).eq('id', currentTimelog.value.id);
  if (error) {
    console.log('error saving timelog');
    console.log(error);
  } else {
    console.log('Timelog saved');

    // update subtask estimated time 

    const { error: subtaskError } = await supabase.from('subtasks').update([
      {
        remaining_time: estimatedSubtaskTime.value,
      }
    ]).eq('id', currentTimelog.value.subtask_id);
    if (subtaskError) {
      console.log('error updating subtask');
      console.log(subtaskError);
    } else {
      console.log('Subtask updated');
    }

    closeEditTimelog();
    closeLogTimeDialog();
    await getUserStories();
  }
}


function areSameDate(date1: Date, date2: Date) {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

function getDifferenceInHours(date1, date2) {
  // Difference in milliseconds
  const difference = date2 - date1;

  // Convert milliseconds to hours
  const hours = difference / (1000 * 60 * 60);

  return hours;
}

</script>
