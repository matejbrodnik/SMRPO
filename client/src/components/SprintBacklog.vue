<template>
    <div style="height: 100%;">
        <div style="margin: 30px auto; max-width: 80%;">

            <div v-if="isLoading">Loading...</div>
            <v-select v-else v-model="selectedProject" :items="projects" label="Select a project" item-title="name"
                @update:model-value="getUserStories" return-object>
            </v-select>
            <div style="padding: 30px 0;">
                <div v-if="!hasCurrentSprint">There is no active sprint for this project.</div>
                <div v-else>
                    <b>Sprint data</b>
                    <div>Name: {{ currentSprint.name }}</div>
                    <div>Active from {{ formatDate(currentSprint.start_date) }} to {{ formatDate(currentSprint.end_date)
                        }}</div>
                    <div>Velocity: {{ currentSprint.duration }} pts</div>
                    <v-container>
                        <div v-if="hasNoUserStories">This sprint has no user stories assigned.</div>
                        <div v-else>
                            <v-card v-for="(story, index) in userStories" :key="index" color="deep-purple"
                                style="padding: 20px; margin: 30px auto;">
                                <v-card-item>
                                    <v-row>
                                        <v-col cols="6">
                                            <v-card-title>{{ story.name }}</v-card-title>
                                        </v-col>
                                        <v-col cols="6" style="display: flex; justify-content: end;">
                                            <v-card-actions>
                                                <v-btn size="large" color="white" @click="openDialog(index)">+
                                                    Add subtask</v-btn>
                                            </v-card-actions>
                                        </v-col>
                                    </v-row>
                                    <v-card-subtitle>{{ story.description }}</v-card-subtitle>
                                </v-card-item>
                                <v-divider></v-divider>
                                <v-card-text>Priority: {{ story.priority }}
                                </v-card-text>
                                <v-divider></v-divider>
                                <v-table v-if="story.subtasks && story.subtasks.length > 0">
                                    <thead>
                                        <tr>
                                            <th>Done</th>
                                            <th>Description</th>
                                            <th>Suggested developer</th>
                                            <th>Duration [h]</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="subtask in story.subtasks" :key=subtask.id>
                                            <td>
                                                <v-checkbox v-model="subtask.is_done"
                                                    @update:model-value="changeSubtaskDone(subtask)">
                                                </v-checkbox>
                                            </td>
                                            <td>
                                                {{ subtask.description }}
                                            </td>
                                            <td>
                                                {{ subtask.developer }}
                                            </td>
                                            <td>
                                                {{ subtask.estimated_time }}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            <td></td>
                                            <td></td>
                                            <td>
                                                Sum: {{ userStories[index].timeSum }} h
                                            </td>
                                        </tr>
                                    </tbody>
                                </v-table>
                            </v-card>

                            <v-dialog v-model="showDialog" style="max-width: 800px;">
                                <v-card>
                                    <v-card-title>User story: <b>{{ storyName }}</b></v-card-title>
                                    <v-card-subtitle>Add a new subtask</v-card-subtitle>
                                    <v-form ref="createForm">
                                        <v-alert v-if="successfullyCreatedSubtask" type="success">
                                            Subtask created successfully!
                                        </v-alert>
                                        <v-text-field style="margin: 20px;" v-model="subtask.description"
                                            label="Description" :rules="checkRules('Description')"></v-text-field>
                                        <v-text-field :rules="checkRules('Duration', true)" style="margin: 20px;"
                                            v-model="subtask.time" label="Duration in hours"></v-text-field>
                                        <v-select style="margin: 20px;" v-model="subtask.developer"
                                            :items="developer_names" label="Suggested developer"
                                            :rules="checkRules('Developer')"></v-select>
                                    </v-form>
                                    <v-card-actions>
                                        <v-btn style="margin: 10px;" class="bg-deep-purple"
                                            @click="createSubtask">Create</v-btn>
                                        <v-spacer></v-spacer>
                                        <v-btn @click="showDialog = false">Close</v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-dialog>
                        </div>
                    </v-container>
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
import { onMounted } from 'vue';
import { ref } from 'vue';
import { supabase } from '../lib/supabaseClient';
import { formatDate } from '../lib/dateFormatter';

onMounted(() => {
    getProjects();
});

const isLoading = ref(true);
const organizationId = localStorage.getItem('organizationId');
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
const hasCurrentSprint = ref(false);
const hasNoUserStories = ref(false);
const userStories = ref<any[]>([]);

const showDialog = ref(false);
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
            .in('user_id', user_ids.map((user: any) => user.user_id));

        if (error) {
            console.error('Error fetching user profiles');
        } else {
            developer_names.value = users.map((user: any) => user.name + ' ' + user.surname);
        }
    }
}

async function openDialog(index: number) {
    successfullyCreatedSubtask.value = false;
    activeIndex.value = index;
    showDialog.value = true;
    storyName.value = userStories.value[index].name;
}

async function getProjects() {
    const { data, error } = await supabase
        .from('project')
        .select('id, name, description')
        .eq('organization_id', organizationId);
    if (error) {
        console.error('Error fetching projects');
    } else {
        projects.value = data;
        isLoading.value = false;
        selectedProject.value = projects.value[0];
    }

    await getUserStories();
}

async function getCurrentSprint() {
    const currentDate = new Date();
    const { data, error } = await supabase
        .from('sprints')
        .select('id, name, start_date, end_date, duration')
        .eq('project_id', selectedProject.value.id)
    if (error) {
        console.error('Error fetching sprints');
    } else {
        if (data) {
            data.forEach((sprint) => {
                if (new Date(sprint.start_date) < currentDate && new Date(sprint.end_date) > currentDate) {
                    hasCurrentSprint.value = true;
                    currentSprint.value = sprint;
                    return;
                }
            })
        }
    }
}

async function getUserStories() {
    hasCurrentSprint.value = false;
    await getCurrentSprint();

    if (currentSprint.value.id == "") {
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
        userStories.value.forEach(async (userStory: any) => {
            await getSubtasks(userStory);
        });
        await getDevelopers(selectedProject.value.id);
    }
}

async function getSubtasks(userStory: any) {
    const { data, error } = await supabase
        .from('subtasks')
        .select('id, description, estimated_time, developer_id, is_done')
        .eq('user_story_id', userStory.id);
    if (error) {
        console.error('Error fetching subtasks');
    } else {
        // Sum hours of estimated_time
        userStory.subtasks = data;
        const timeSum = ref(0);
        for (const subtask of userStory.subtasks) {
            const { data: developer, error } = await supabase
                .from('user_profile')
                .select('name, surname')
                .eq('id', subtask.developer_id)
                .single();
            if (error) {
                console.error('Error fetching developer');
            } else {
                subtask.developer = developer.name + ' ' + developer.surname;
                subtask.estimated_time = parseFloat(subtask.estimated_time.toFixed(1));
                timeSum.value += subtask.estimated_time;
            }
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
    if (!formItems.every((item: any) => !!item)) {
        return;
    }
    const { data: developer, error } = await supabase
        .from('user_profile')
        .select('id')
        .eq('name', subtask.value.developer.split(' ')[0])
        .eq('surname', subtask.value.developer.split(' ')[1])
        .single();

    if (error) {
        console.error('Error fetching developer');
    } else {
        const { error } = await supabase
            .from('subtasks')
            .insert([
                {
                    user_story_id: userStories.value[activeIndex.value].id,
                    description: subtask.value.description,
                    estimated_time: subtask.value.time,
                    developer_id: developer.id,
                    is_done: false,
                }
            ]);
        if (error) {
            console.error('Error creating subtask');
        } else {
            successfullyCreatedSubtask.value = true;
            
            setTimeout(() => {
                showDialog.value = false;
                subtask.value.description = '';
                subtask.value.time = '';
                subtask.value.developer = '';
            }, 1000);
            await getSubtasks(subtask.value);
        }
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

const checkRules = (field: any, duration = false) => {
    let rules = [(v) => !!v || `${field} is required`];
    if (duration) {
        rules.push((v) => !isNaN(parseFloat(v)) || 'Input must be a number');
    }
    return rules;
};
</script>