<template>
  <v-dialog v-model="showSprintEditDlg" class="dlgWindow" width="50%">
    <v-card title="Edit sprint">
      <v-card-text>
        <!-- Edit start date, end date and name -->
        <v-row dense>
          <!-- row to show errors when entering things -->
          <v-col cols="12">
            <v-alert id="sprintError" v-if="showSprintError" type="error" elevation="2" colored>
              Start and end date must be weekdays, and not in the past. Start date must be before
              end date.
            </v-alert>
            <v-alert v-if="sprintOverlap">
              Overlap with existing sprint, please change dates or name.
            </v-alert>
            <v-alert v-if="showSuccessMessage" type="success">
              Sprint edited successfully!
            </v-alert>
          </v-col>
          <v-col cols="7">
            <v-text-field
              :disabled="canEditSprint == 1"
              v-model="sprintData.name"
              label="Name"
              required></v-text-field>
          </v-col>

          <v-divider></v-divider>
          <v-col cols="3">
            <v-text-field
              :disabled="canEditDuration == 1"
              v-model="sprintData.duration"
              label="Duration (pts.)"
              required></v-text-field>
          </v-col>
          <v-divider></v-divider>
          <v-col cols="4">
            <v-menu
              v-model="showDatePickerStart"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  :disabled="canEditSprint == 1"
                  v-model="sprintData.start_date"
                  @click="showDatePickerStart = true"
                  label="Start date"
                  prepend-icon="mdi-calendar"
                  v-bind="attrs"
                  v-on="on"></v-text-field>

                <v-date-picker
                  v-model="sprintData.start_date"
                  @input="showDatePickerStart = false"
                  v-if="showDatePickerStart"
                  no-title>
                  <v-spacer></v-spacer>
                </v-date-picker>
              </template>
            </v-menu>
          </v-col>
          <!-- <v-divider></v-divider> -->
          <v-col cols="4">
            <v-menu
              v-model="showDatePickerEnd"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="290px">
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  :disabled="canEditSprint == 1"
                  v-model="sprintData.end_date"
                  @click="showDatePickerEnd = true"
                  label="End date"
                  prepend-icon="mdi-calendar"
                  v-bind="attrs"
                  v-on="on"></v-text-field>

                <v-date-picker
                  v-model="sprintData.end_date"
                  v-if="showDatePickerEnd"
                  no-title></v-date-picker>
              </template>
            </v-menu>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          text="Close"
          variant="text"
          @click="
            showSprintEditDlg = false;
            resetFormAndCloseDialog();
          "></v-btn>
        <v-btn
          :disabled="canEditDuration == 1"
          text="Save"
          variant="text"
          @click="editSprint"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div style="margin: 30px auto; max-width: 80%">
    <div v-if="isLoading">Loading...</div>
    <v-select
      v-else
      v-model="selectedProject"
      :items="projects"
      label="Select a project"
      item-title="name"
      return-object>
    </v-select>
    <div style="height: 100vh; overflow: hidden">
      <div style="margin: 30px auto">
        <div v-if="isLoading">Loading...</div>
        <v-data-table
          v-else
          :headers="headers"
          :items="sprints"
          @click:row="showSprintEdit"></v-data-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, watchEffect } from 'vue';
import { getProjects } from '../functions/helperFunctions';
import { formatDateTime } from '../lib/dateFormatter';
import { supabase } from '../lib/supabaseClient';

onMounted(() => {
  fetchProjects();
});

var canEditSprint = ref(1);
var canEditDuration = ref(1);

const isAdmin = ref(false);
const canEdit = ref(false);
const isScrumMaster = ref(false);

const selectedProject = ref({
  id: '',
  name: '',
  description: '',
  sprint: '',
});

watch(selectedProject, fetchSprints);

supabase.auth.onAuthStateChange(async (_, session) => {
  if (session) {
    const jwt = session.access_token;

    const payload = JSON.parse(atob(jwt.split('.')[1]));
    isAdmin.value = payload.user_role === 'admin';
  } else {
    console.log('The user is not authenticated');
  }
});

const headers = ref([
  { title: 'Name', key: 'name' },
  { title: 'Start date', key: 'start_date' },
  { title: 'End date', key: 'end_date' },
  { title: 'Duration (pts.)', key: 'duration' },
]);

// const userId = await (await supabase.auth.getUser()).data.user?.id;
// const isScrumMaster = await checkScrumMaster(userId);
// canEdit.value = isAdmin.value || isScrumMaster;

async function checkScrumMaster() {
  const userId = await (await supabase.auth.getUser()).data.user?.id;

  const { data, error } = await supabase
    .from('project_role')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'scrum_master');
  if (error) {
    console.error('Error fetching project roles');
    return false;
  } else {
    isScrumMaster.value = data.length > 0;
    return data.length > 0;
  }
}

const sprints = ref<any[]>([]);
const isLoading = ref(true);

const sprintData = ref({
  project_id: '',
  id: '',
  name: '',
  duration: '',
  start_date: '',
  end_date: '',
});

const resetFormAndCloseDialog = () => {
  canEditDuration.value = 1;
  canEditSprint.value = 1;
  sprintData.value = {
    name: '',
    duration: '',
    startDate: '',
    endDate: '',
    project_id: '',
    id: '',
  }; // Reset form data
  showSprintEditDlg.value = false; // Close dialog
};

const showSprintEditDlg = ref(false);
const showDatePickerStart = ref(false);
const showDatePickerEnd = ref(false);

const minDate = new Date().toISOString().split('T')[0];
const showSprintError = ref(false);
const sprintOverlap = ref(false);
const showSuccessMessage = ref(false);

// returns true if there is overlap
const validateSprint = (sprintData) => {
  sprints.value.forEach((item: any) => {
    if (item.id !== sprintData.id && item.project_id === sprintData.project_id) {
      if (sprintData.start_date >= item.start_date && sprintData.start_date <= item.end_date) {
        sprintOverlap.value = true;
      }
      if (sprintData.end_date >= item.start_date && sprintData.end_date <= item.end_date) {
        sprintOverlap.value = true;
      }
      if (sprintData.name === item.name) {
        sprintOverlap.value = true;
      }
    }
  });
  return sprintOverlap.value;
};

async function editSprint() {
  if (
    sprintData.value.name === '' ||
    sprintData.value.start_date.length === 0 ||
    sprintData.value.end_date.length === 0
  ) {
    return;
  }
  if (!validateSprintDates()) return false;

  if (validateSprint(sprintData)) {
    return;
  } else {
    sprintOverlap.value = false;
  }
  //var duration = countWeekdays(sprintData.value.start_date, sprintData.value.end_date) * 8 / 6;
  // round to int
  //duration = Math.round(duration)
  console.log(sprintData);
  //console.log(sprintData.value.start_date)
  var duration = Number(sprintData.value.duration);
  if (1000 < duration || duration < 0) {
    showSprintError.value = true;
    return false;
  }
  const updates = {
    id: sprintData.value.id,
    name: sprintData.value.name,
    start_date: sprintData.value.start_date,
    end_date: sprintData.value.end_date,
    duration: sprintData.value.duration,
    project_id: sprintData.value.project_id,
  };

  const { error } = await supabase.from('sprints').upsert(updates);
  // const {error} = await supabase
  // .from('sprints')
  // .update({
  //   name: sprintData.value.name,
  //   start_date: sprintData.value.start_date,
  //   end_date: sprintData.value.end_date,
  //   duration: duration,
  // })
  // .eq('id', sprintData.value.id);
  console.log(error);
  showSuccessMessage.value = true;
  setTimeout(() => {
    resetFormAndCloseDialog();
    showSuccessMessage.value = false;
    fetchSprints();
  }, 3000);
}

const showSprintEdit = (click, item) => {
  if (!canEdit.value) return;
  // test if it's current sprint - we can only edit the duration
  // if it's a future sprint everything is editable
  var start_date_details = item.item.start_date.split(' ')[0].split('.');
  var start_date = new Date(
    start_date_details[2],
    start_date_details[1] - 1,
    start_date_details[0]
  );
  var end_date_details = item.item.end_date.split(' ')[0].split('.');
  var end_date = new Date(end_date_details[2], end_date_details[1] - 1, end_date_details[0]);
  // console.log("Start date ", start_date);
  // console.log("end date ", end_date);
  if (start_date > new Date(minDate) && end_date > new Date(minDate)) {
    // this is future sprint, can edit everything
    canEditSprint.value = 0;
    canEditDuration.value = 0;
  }
  if (start_date < new Date(minDate) && end_date > new Date(minDate)) {
    // current sprint, can only edit duration
    // console.log("current sprint ");
    canEditDuration.value = 0;
  }
  sprintData.value.name = item.item.name;
  sprintData.value.id = item.item.id;
  sprintData.value.project_id = item.item.project_id;
  sprintData.value.duration = item.item.duration;
  sprintData.value.end_date = end_date.toDateString();
  sprintData.value.start_date = start_date.toDateString();
  showSprintEditDlg.value = true;
};

const countWeekdays = (startDate, endDate) => {
  // Parse the start and end dates from strings to Date objects
  let start = new Date(startDate);
  let end = new Date(endDate);

  // Counter for weekdays
  let count = 0;

  // Loop over each day from start to end
  while (start <= end) {
    // Get the day of the week, where 0 is Sunday and 6 is Saturday
    const dayOfWeek = start.getDay();

    // Check if the day is a weekday (Monday = 1 to Friday = 5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }

    // Move to the next day
    start.setDate(start.getDate() + 1);
  }

  return count;
};

const validateWeekend = (date) => {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday
};

const projects = ref<any[]>([]);

async function fetchProjects() {
  const projectsAll = await getProjects();
  console.log(projectsAll);
  if (projectsAll) {
    projects.value = projectsAll;
    isLoading.value = false;
    selectedProject.value = projectsAll[0];
  }
}

const validateSprintDates = () => {
  showSprintError.value = true;
  console.log(sprintData);
  if (
    !validateWeekend(sprintData.value.start_date) ||
    !validateWeekend(sprintData.value.end_date)
  ) {
    showSprintError.value = true;
    return false;
  }
  if (sprintData.value.start_date > sprintData.value.end_date) {
    showSprintError.value = true;
    return false;
  }
  if (
    new Date(sprintData.value.start_date) < new Date(minDate) ||
    new Date(sprintData.value.end_date) < new Date(minDate)
  ) {
    if (canEditDuration.value == 0) {
      showSprintError.value = false;
      return true;
    }
    showSprintError.value = true;
    return false;
  }
  showSprintError.value = false;
  return true;
};

async function fetchSprints() {
  if (selectedProject.value) {
    const projectId = selectedProject.value.id;
    const { data, error } = await supabase.from('sprints').select('*').eq('project_id', projectId);
    if (error) {
      console.error('Error fetching sprints:', error.message);
    } else {
      sprints.value = data;
    }

    sprints.value.forEach((sprint) => {
      sprint.start_date = formatDateTime(sprint.start_date);
      sprint.end_date = formatDateTime(sprint.end_date);
      sprint.project_id = projectId;
    });
  }
}

watchEffect((isScrumMaster) => {
  canEdit.value = Boolean(isAdmin.value || isScrumMaster);
});
</script>
