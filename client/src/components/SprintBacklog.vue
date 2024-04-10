<template>
    <div style="height: 100%;">
        <div style="margin: 30px auto; max-width: 80%;">

            <div v-if="isLoading">Loading...</div>
            <v-select v-else v-model="selectedProject" :items="projects" label="Select a project" item-title="name"
                @update:model-value="getUserStories" return-object>
            </v-select>
            <div>
                <div v-if="isLoading"></div>
                <div v-else>
                    <h3>Details for {{ selectedProject.name }}</h3>
                    <p>Description: {{ selectedProject.description }}</p>
                    <v-container style="margin-top: 40px;">
                        <v-row align="center" justify="center" style="margin-bottom: 20px;">
                            User stories
                        </v-row>
                        <v-row align="center" justify="center">
                            <v-col cols="10">
                                <div v-if="hasNoUserStories">This sprint has no user stories assigned.</div>
                                <div v-else>
                                    <v-card v-for="story in userStories" :key="story.id" color="deep-purple" style="margin-bottom: 30px;">
                                        <v-card-item>
                                            <v-card-title>{{ story.name }}</v-card-title>
                                            <v-card-subtitle>{{ story.description }}</v-card-subtitle>
                                        </v-card-item>
                                        <v-divider></v-divider>
                                        <v-card-text>Priority: {{ story.priority }}
                                            <br>Status:
                                            <v-icon v-if="story.state=='finished'" class="bg-green"
                                            style="border-radius: 50%;">mdi-check</v-icon>
                                            <v-icon v-else style="border-radius: 50%;">mdi-progress-check</v-icon>
                                        </v-card-text>
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

<script setup lang="ts">
import { onMounted } from 'vue';
import { ref } from 'vue';
import { supabase } from '../lib/supabaseClient';

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
const sprints = ref<any[]>([]);
const currentSprint = ref({
    id: '',
    name: '',
});
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
    const { data, error } = await supabase
        .from('sprints')
        .select('id, name')
        .eq('project_id', selectedProject.value.id)
        .order('start_date', { ascending: false })
        .limit(1);
    if (error) {
        console.error('Error fetching sprints');
    } else {
        sprints.value = data;
        console.log('Sprints:', sprints.value);
        currentSprint.value = sprints.value[0];
    }
}

async function getUserStories() {
    await getCurrentSprint();

    if (!currentSprint.value) {
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
    }
}


</script>