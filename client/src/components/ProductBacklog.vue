<template>

<div style="height: 100%;">
    <div style="margin: 30px auto; max-width: 80%;">
    <!-- Project Dropdown -->
    <v-card width="50%">

        <div v-if="isLoading">Loading...</div>
        <v-select v-else v-model="selectedProject" :items="projects" label="Select a project" item-title="name"
            return-object @change="onProjectChange">
        </v-select>
    </v-card>
    <!-- Content that changes based on the selection -->

    <div style="margin: 20px 0;">
        <div v-if="isLoading"></div>
        <div v-else>
            <h3>Details for {{ selectedProject.name }}</h3>
            <p>Description: {{ selectedProject.description }}</p>
            <!-- Add more project details here -->
            <v-card>
                <component :is="StoryWall" :selectedProject="selectedProject" />
            </v-card>
        </div>
    </div>
    </div>
</div>


</template>


<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { supabase } from "../lib/supabaseClient";
import StoryWall from './StoryWall.vue';
onMounted(() => {
    getProjects();
});
const isLoading = ref(true);
const isAdmin = ref(false);
const projects = ref<any[]>([]);
supabase.auth.onAuthStateChange(async (_, session) => {
    if (session) {
        const jwt = session.access_token;
        const payload = JSON.parse(atob(jwt.split('.')[1]));
        isAdmin.value = payload.user_role === 'admin';
    } else {
        console.log('The user is not authenticated');
    }
});
async function getProjects() {
    const organizationId = localStorage.getItem('organizationId');
    const { data, error } = await supabase
        .from('project')
        .select('id, name, description')
        .eq('organization_id', organizationId);
    if (error) {
        console.error('Error fetching projects');
    } else {
        projects.value = data;
        isLoading.value = false;
        console.log('Projects:', projects.value);
        console.log(data)
        selectedProject.value = projects.value[0];
    }
}
const selectedProject = ref({
    id: '',
    name: '',
    description: '',
});
function onProjectChange() {
    console.log('Selected project:', selectedProject.value);
}
</script>