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
                        <div>Active from {{ formatDate(currentSprint.start_date) }} to {{ formatDate(currentSprint.end_date) }}</div>
                        <div>Velocity: {{ currentSprint.duration }} pts</div>
                    <v-container style="margin-top: 40px;">
                        <v-row align="center" justify="center">
                            <v-col cols="10">
                                <div v-if="hasNoUserStories">This sprint has no user stories assigned.</div>
                                <div v-else>
                                    <v-card v-for="story in userStories" :key="story.id" color="deep-purple"
                                        style="padding: 20px; margin-bottom: 30px;">
                                        <v-card-item>
                                            <v-card-title>{{ story.name }}</v-card-title>
                                            <v-card-subtitle>{{ story.description }}</v-card-subtitle>
                                        </v-card-item>
                                        <v-divider></v-divider>
                                        <v-card-text>Priority: {{ story.priority }}
                                        </v-card-text>
                                        <v-divider></v-divider>
                                        <v-checkbox v-for="subtask in story.subtasks" :key=subtask.id
                                            v-model="subtask.is_done" :label="subtask.description"
                                            @update:model-value="changeSubtaskDone(subtask)">
                                        </v-checkbox>
                                    </v-card>
                                </div>
                            </v-col>
                        </v-row>
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
    }
}

async function getSubtasks(userStory: any) {
    const { data, error } = await supabase
        .from('subtasks')
        .select('id, description, is_done')
        .eq('user_story_id', userStory.id);
    if (error) {
        console.error('Error fetching subtasks');
    }
    userStory.subtasks = data;
}

async function changeSubtaskDone(subtask: any) {
    console.log("Changing subtask done");
    const { error } = await supabase
        .from('subtasks')
        .update({ is_done: subtask.is_done })
        .eq('id', subtask.id);
    if (error) {
        console.error('Error updating subtask');
    }
}

</script>