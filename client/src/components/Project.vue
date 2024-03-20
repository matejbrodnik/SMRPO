<template>
  <div style="height: 100vh; overflow: hidden;">
    <div style="margin: 30px auto; max-width: 80%;">
      <v-btn class="bg-deep-purple" theme="dark" style="margin: 30px 0;" v-if="isAdmin" @click="openModal">
        New project
      </v-btn>

      <v-dialog v-model="isModalOpen" style="max-width: 800px;">
        <v-card>
          <v-card-title class="headline">Create a new project</v-card-title>
          <v-card-text>
            <v-form ref="createForm">
              <v-row dense>
                <v-col cols="12">
                  <v-text-field v-model="name" label="Name" :rules="checkEmpty('Name')"></v-text-field>
                </v-col>
              </v-row>
              <v-textarea v-model="description" label="Describe this project"
                :rules="checkEmpty('Description')"></v-textarea>
              <v-row>
                <v-col cols="12">
                  <v-select v-model="productOwner" :items="user_names" label="Product Owner"
                    :rules="checkEmpty('Product Owner')">
                  </v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-select v-model="scrumMaster" :items="user_names" item-text="name" item-value="id"
                    label="Scrum Master" :rules="checkEmpty('Scrum Master')"></v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-select v-model="developers" :items="user_names" item-text="name" item-value="id" label="Developers"
                    multiple :rules="checkEmpty('Developers', true)"></v-select>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn class="bg-deep-purple" @click="createProject" style="margin: 0 0 20px 20px">Create</v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="isModalOpen = false, showDatePicker = false" style="margin: 0 20px 20px 0">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="isEditModalOpen" style="max-width: 800px">
        <v-card>
          <v-card-title class="headline">Edit project</v-card-title>
          <v-card-text>
            <v-form ref="updateForm">
              <v-alert v-if="editProjectAlert" type="error">
                Invalid input data. Project name already exists or project owner is scrum master/part of developers.
              </v-alert>
              <v-alert v-if="showProjectSuccessMessage" type="success">
                Project edited successfully!
              </v-alert>
              <v-row dense>
                <v-col cols="12">
                  <v-text-field v-model="selectedProject.name" :rules="checkEmpty('Name')" label="Name"></v-text-field>
                </v-col>
              </v-row>
              <v-textarea v-model="selectedProject.description" :rules="checkEmpty('Description')"
                label="Describe this project"></v-textarea>
              <v-row>
                <v-col cols="12">
                  <v-select v-model="selectedProject.productOwner" :items="user_names" label="Product Owner"
                    :rules="checkEmpty('Product Owner')">
                  </v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-select v-model="selectedProject.scrumMaster" :items="user_names" item-text="name" item-value="id"
                    label="Scrum Master" :rules="checkEmpty('Scrum Master')"></v-select>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="12">
                  <v-select v-model="selectedProject.developers" :items="user_names" item-text="name" item-value="id"
                    label="Developers" multiple :rules="checkEmpty('Developers', true)"></v-select>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-btn class="bg-deep-purple" @click="updateProject" style="margin: 0 0 20px 20px">Update</v-btn>
            <v-btn class="bg-deep-purple" @click="showSprintCreate = true" style="margin: 0 0 20px 20px">Create new
            sprint</v-btn>
            <v-spacer></v-spacer>
            <v-btn @click="isEditModalOpen = false, showDatePicker = false, editProjectAlert = false"
              style="margin: 0 20px 20px 0">Close</v-btn>
            <v-dialog v-model="showSprintCreate" class="dlgWindow" width="50%">
              <v-card title="New sprint">
                <v-card-text>
                  <!-- Edit start date, end date and name -->
                  <v-row dense>
                    <!-- row to show errors when entering things -->
                    <v-col cols="12">
                      <v-alert id="sprintError" v-if="showSprintError" type="error" elevation="2" colored>
                        Start and end date must be weekdays, and not in the past.
                        Start date must be before end date.
                      </v-alert>
                      <v-alert v-if="sprintOverlap">
                        Overlap with existing sprint, please change dates or name.
                      </v-alert>
                      <v-alert v-if="showSuccessMessage" type="success">
                        Sprint created successfully!
                      </v-alert>


                    </v-col>
                    <v-col cols="7">
                      <v-text-field v-model="sprintData.name" label="Name" required></v-text-field>
                    </v-col>
                    <v-divider></v-divider>

                    <v-col cols="4">
                      <v-menu v-model="showDatePickerStart" :close-on-content-click="false" :nudge-right="40"
                        transition="scale-transition" offset-y min-width="290px">
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field v-model="sprintData.start_date" @click="showDatePickerStart = true"
                            label="Start date" prepend-icon="mdi-calendar" v-bind="attrs" v-on="on"></v-text-field>

                          <v-date-picker v-model="sprintData.start_date" @input="showDatePickerStart = false"
                            v-if="showDatePickerStart" no-title>
                            <v-spacer></v-spacer>

                          </v-date-picker>
                        </template>
                      </v-menu>
                    </v-col>
                    <!-- <v-divider></v-divider> -->
                    <v-col cols="4">
                      <v-menu v-model="showDatePickerEnd" :close-on-content-click="false" :nudge-right="40"
                        transition="scale-transition" offset-y min-width="290px">
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field v-model="sprintData.end_date" @click="showDatePickerEnd = true" label="End date"
                            prepend-icon="mdi-calendar" v-bind="attrs" v-on="on"></v-text-field>

                          <v-date-picker v-model="sprintData.end_date" v-if="showDatePickerEnd"
                            no-title></v-date-picker>
                        </template>
                      </v-menu>
                    </v-col>
                  </v-row>
                </v-card-text>

                <v-divider></v-divider>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn text="Close" variant="text" @click="showSprintCreate = false"></v-btn>
                  <v-btn text="Save" variant="text" @click="saveSprint"></v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <div v-if="isLoading">Loading...</div>
      <v-data-table style="margin: auto;" v-else :headers="headers" :items="items" show-expand>
        <template v-slot:item.action="{ item }">
          <v-btn v-if="canEdit" class="bg-deep-purple" size="30" @click="openEditModal(item)">
            <v-icon size="medium20">mdi-pencil</v-icon>
          </v-btn>
        </template>
        <template v-slot:expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length">
              Description: {{ item.description }}
            </td>
          </tr>
        </template>
      </v-data-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { supabase } from "../lib/supabaseClient";
import { onMounted, ref } from 'vue';
import { formatDate, formatDateTime } from '../lib/dateFormatter';
import { de } from "vuetify/locale";

onMounted(() => {
  getProjects();
  getUsers();
})

const name = ref('');
const description = ref('');
const users = ref<any[]>([]);

const productOwner = ref(null);
const scrumMaster = ref(null);
const developers = ref([]);

const isAdmin = ref(false);
const isModalOpen = ref(false);
const canEdit = ref(false);

const isLoading = ref(true);
const items = ref<any[]>([]);

const showDatePicker = ref(false);

const currentProjectId = ref(0);

const user_names = ref<string[]>([]);

const createForm = ref(null);
const updateForm = ref(null);


const checkEmpty = (field, isMultiple = false) => {
  return isMultiple
    ? [(v) => (v && v.length > 0) || `${field} are required`]
    : [(v) => !!v || `${field} is required`];
};

const headers = ref([
  { title: 'Name', key: 'name' },
  { title: 'Project id', key: 'id' },
  { title: 'Created at', key: 'created_at' },
  { title: '', key: 'action', sortable: false },
]);

const editProjectAlert = ref(false);
const showProjectSuccessMessage = ref(false);

const selectedProject = ref({
  id: '',
  name: '',
  description: '',
  productOwner: '',
  scrumMaster: '',
  developers: [],
});
const isEditModalOpen = ref(false);

async function getUserRoles(projectId: number, project: any) {
  let isSuccessful = false;
  const { data: roles, error } = await supabase
    .from('project_role')
    .select('user_id, role')
    .eq('project_id', projectId);

  if (error) {
    console.error('Error fetching project roles', error);
  } else {
    const userPromises = roles.map(async (role) => {
      const { data: userProfile, error: userError } = await supabase
        .from('user_profile')
        .select('name, surname')
        .eq('user_id', role.user_id)
        .single();

      if (userError) {
        console.error('Error fetching user profile', userError);
        return;
      }

      if (userProfile) {
        const fullName = `${userProfile.name} ${userProfile.surname}`;
        switch (role.role) {
          case 'product_owner':
            project.productOwner = fullName;
            break;
          case 'scrum_master':
            project.scrumMaster = fullName;
            break;
          case 'developer':
            project.developers = project.developers || [];
            project.developers.push(fullName);
            break;
          default:
            // Handle any other roles or ignore
            break;
        }
      }
    });

    // Wait for all user profile fetches to complete
    await Promise.all(userPromises);
    isSuccessful = true; // Set success to true if everything completes without error
  }

  // Return both the project and the operation success status
  return { project, isSuccessful };
}

async function openEditModal(project: any) {
  if (project) {
    project.developers = []; // Reset developers array
    const { project: updatedProject, isSuccessful } = await getUserRoles(project.id, project);

    if (isSuccessful) {
      selectedProject.value = Object.assign({}, updatedProject);
      isEditModalOpen.value = true;
      showDatePicker.value = false;
    }
  } else {
    console.log("Error opening edit modal");
  }
}

const openModal = () => {
  isModalOpen.value = true;
  showDatePicker.value = false;
};


const minDate = new Date().toISOString().split('T')[0];
const showSprintError = ref(false);
const sprintOverlap = ref(false);
const showSuccessMessage = ref(false);

const validateWeekend = (date) => {
  const dayOfWeek = new Date(date).getDay();
  return dayOfWeek !== 0 && dayOfWeek !== 6; // 0 = Sunday, 6 = Saturday
};



// sprint values 
const sprintData = ref({
  name: '',
  start_date: ref([]),
  end_date: ref([]),
});
const showSprintCreate = ref(false);
const showDatePickerStart = ref(false);
const showDatePickerEnd = ref(false);

supabase.auth.onAuthStateChange(async (_, session) => {
  if (session) {
    const jwt = session.access_token;

    const payload = JSON.parse(atob(jwt.split('.')[1]));
    isAdmin.value = payload.user_role === 'admin';
  } else {
    console.log('The user is not authenticated');
  }
});

const validateSprintDates = () => {
  showSprintError.value = true;
  if (!validateWeekend(sprintData.value.start_date) || !validateWeekend(sprintData.value.end_date)) {
    showSprintError.value = true;
    return false;
  }
  if (sprintData.value.start_date > sprintData.value.end_date) {

    showSprintError.value = true;
    return false;
  }
  if (new Date(sprintData.value.start_date) < new Date(minDate) || new Date(sprintData.value.end_date) < new Date(minDate)) {
    showSprintError.value = true;
    return false;
  }
  showSprintError.value = false;
  return true;
};

async function validateSprint(sprintData) {
  const { data: projSprints, error: projSprErr } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', currentProjectId.value);

  const sprintOverlap = projSprints.some(sprint => {
    const newStartDate = new Date(sprintData.value.start_date);
    const newEndDate = new Date(sprintData.value.end_date);
    const existingStartDate = new Date(sprint.start_date);
    const existingEndDate = new Date(sprint.end_date);

    const isOverlapping =
      (existingStartDate <= newStartDate && existingEndDate >= newStartDate) ||
      (existingStartDate <= newEndDate && existingEndDate >= newEndDate);

    const isNameDuplicate = sprint.name === sprintData.value.name;

    return isOverlapping || isNameDuplicate;
  });

  return sprintOverlap;
};

const resetFormAndCloseDialog = () => {
  sprintData.value = {
    name: '',
    startDate: ref([]),
    endDate: ref([])
  }; // Reset form data
  showSprintCreate.value = false; // Close dialog
};

async function saveSprint() {
  // make sure sprintdata isn't empty 
  if (sprintData.value.name === '' || sprintData.value.start_date.length === 0 || sprintData.value.end_date.length === 0) {
    // showSprintError.value = true;
    return;
  }

  if (!validateSprintDates()) return false;
  const isInvalid = await validateSprint(sprintData);
  if (isInvalid) {
    sprintOverlap.value = true;
    return;
  }
  sprintOverlap.value = false;

  var duration = countWeekdays(sprintData.value.start_date, sprintData.value.end_date) * 8 / 6;
  // round to int
  duration = Math.round(duration)

  // insert the new sprint into the database
  const { data, error } = await supabase
    .from('sprints')
    .insert([{
      name: sprintData.value.name,
      start_date: sprintData.value.start_date,
      end_date: sprintData.value.end_date,
      project_id: currentProjectId.value,
      duration: duration,
    }]);
  showSuccessMessage.value = true;
  setTimeout(() => {
    resetFormAndCloseDialog();
    showSuccessMessage.value = false;
  }, 3000);

  console.log(JSON.stringify(sprintData.value));
}

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
}

async function checkScrumMaster(userId: any) {
  const {data, error} = await supabase
    .from('project_role')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'scrum_master');

  if (error) {
    console.error('Error fetching project roles');
  } else {
    return data.length > 0;
  }
}

async function getProjects() {
  const organizationId = localStorage.getItem('organizationId');
  const { data, error } = await supabase
    .from('project')
    .select('*')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching projects');
  } else {
    items.value = data;
    items.value.forEach((item: any) => {
      item.created_at = formatDateTime(item.created_at);
    });

    isLoading.value = false;
  }

  const userId = await (await supabase.auth.getUser()).data.user?.id;
  const isScrumMaster = await checkScrumMaster(userId);
  canEdit.value = isAdmin.value || isScrumMaster;
}

async function getUsers() {
  const { data, error } = await supabase
    .from('user_profile')
    .select('id, name, surname');

  if (error) {
    console.error("Error fetching users")
  } else {
    users.value = data;
    data.forEach((element: { name: string, surname: string }) =>
      user_names.value.push(element.name + " " + element.surname));
  }
}

async function createProject(this: any) {
  createForm.value.validate();
  const isFormValid = validateForm([name.value, productOwner.value, scrumMaster.value, developers.value]);
  if (!isFormValid) return;

  const { data, error } = await supabase
    .from('project')
    .insert([{
      name: name.value,
      description: description.value,
      organization_id: localStorage.getItem('organizationId'),
    }]).select();

  if (error) {
    console.error("Error creating project")
  } else {
    getProjects();
    isModalOpen.value = false;
    const projectId = data[0].id;

    const po = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('name', productOwner.value.split(' ')[0])
      .eq('surname', productOwner.value.split(' ')[1])
      .single();

    const sm = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('name', scrumMaster.value.split(' ')[0])
      .eq('surname', scrumMaster.value.split(' ')[1])
      .single();

    const devs = await supabase
      .from('user_profile')
      .select('user_id')
      .in('name', developers.value.map((name: string) => name.split(' ')[0]))
      .in('surname', developers.value.map((name: string) => name.split(' ')[1]));

    await supabase
      .from('project_role')
      .insert([
        { project_id: projectId, user_id: po.data?.user_id, role: 'product_owner' },
        { project_id: projectId, user_id: sm.data?.user_id, role: 'scrum_master' },
        ...devs.data?.map((item: { user_id: any }) => ({ project_id: projectId, user_id: item.user_id, role: 'developer' })) || []
      ]);

    if (error) {
      console.error("Error creating project role")
    } else {
      getProjects();
      isModalOpen.value = false;
    }
  }
}

async function updateProject() {
  updateForm.value.validate();
  const isFormValid = validateForm([selectedProject.value.name, selectedProject.value.productOwner, selectedProject.value.scrumMaster, selectedProject.value.developers]);
  if (!isFormValid) {
    editProjectAlert.value = true;
    return;
  } else {
    editProjectAlert.value = false;
    showProjectSuccessMessage.value = true;
  }

  const { error } = await supabase
    .from('project')
    .update({ name: selectedProject.value.name, description: selectedProject.value.description })
    .eq('id', selectedProject.value.id);

  if (error) {
    console.error("Error updating project")
  } else {
    let productOwner = selectedProject.value.productOwner
    let scrumMaster = selectedProject.value.scrumMaster
    let developers = selectedProject.value.developers

    const po = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('name', productOwner.split(' ')[0])
      .eq('surname', productOwner.split(' ')[1])
      .single();

    const sm = await supabase
      .from('user_profile')
      .select('user_id')
      .eq('name', scrumMaster.split(' ')[0])
      .eq('surname', scrumMaster.split(' ')[1])
      .single();

    const devs = await supabase
      .from('user_profile')
      .select('user_id')
      .in('name', developers.map((name: string) => name.split(' ')[0]))
      .in('surname', developers.map((name: string) => name.split(' ')[1]));


    await supabase
      .from('project_role')
      .delete()
      .eq('project_id', selectedProject.value.id);

    await supabase
      .from('project_role')
      .insert([
        { project_id: selectedProject.value.id, user_id: po.data?.user_id, role: 'product_owner' },
        { project_id: selectedProject.value.id, user_id: sm.data?.user_id, role: 'scrum_master' },
        ...devs.data?.map((item: { user_id: any }) => ({ project_id: selectedProject.value.id, user_id: item.user_id, role: 'developer' })) || []
      ]);
    getProjects();
    setTimeout(() => {
      showProjectSuccessMessage.value = false;
      editProjectAlert.value = false;
      isEditModalOpen.value = false;
    }, 3000);

  }
}


const validateForm = (formItems: any[]) => {
  console.log(formItems)
  // make sure project name is not the same as existing projects.
  // make sure project owner != scrum master and project owner is not part of devs
  if (!formItems.every((item: any) => !!item)) {
    return false;
  }
  let duplicateName = false;
  items.value.forEach((item: any) => {
    if (item.name.toLowerCase() === formItems[0].toLowerCase() && item.id !== selectedProject.value.id) {
      console.log('should return false');
      duplicateName = true;
    }
  });
  if (duplicateName) {
    return false;
  }
  if (formItems[1] === formItems[2]) {
    // project owner same as scrum master
    return false;
  }
  let ownerInDevs = false;
  // if (formItems[1] in formItems[3]) {
  //   // project owner is part of developers
  //   return false;
  // }
  formItems[3].forEach((dev: any) => {
    if (formItems[1] === dev) {
      ownerInDevs = true;
    }
  });
  if (ownerInDevs) {
    return false;
  }
  return true;
}
</script>
