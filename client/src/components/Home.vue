<script setup lang="ts">
import { useRouter } from 'vue-router';
import { supabase } from '../lib/supabaseClient';
import Project from './Project.vue';
import User from './User.vue';
// import StoryWall from './StoryWall.vue';
import Sprint from './Sprint.vue';
import ProductBacklog from './ProductBacklog.vue';
import SprintBacklog from './SprintBacklog.vue';

defineProps<{ msg: string }>();

const router = useRouter();

const signOut = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
</script>

<template>
  <v-card>
    <v-layout>
      <v-navigation-drawer class="bg-deep-purple" theme="dark" permanent>
        <v-list>
          <v-list-item prepend-icon="mdi-account-circle" @click="showDialog" class="dlgButton">
            <v-list-title style="font-weight: 600;">{{ userName }}</v-list-title>
          </v-list-item>
        </v-list>
        <v-divider :thickness="4"></v-divider>
        <v-list>
          <v-list-item @click="selected = Project" prepend-icon="mdi-view-dashboard">
            <v-list-title>Projects</v-list-title>
          </v-list-item>
          <v-list-item @click="selected = User" prepend-icon="mdi-account-box">
            <v-list-title>Users</v-list-title>
          </v-list-item>
          <!-- <v-list-item
            @click="selected = StoryWall"
            prepend-icon="mdi-pencil">
            <v-list-title>User stories (temporary)</v-list-title>
          </v-list-item> -->
          <v-list-item @click="selected = Sprint" prepend-icon="mdi-clock-fast">
            <v-list-title>Sprints</v-list-title>
          </v-list-item>
          <v-list-item @click="selected = ProductBacklog" prepend-icon="mdi-file-tree">
            <v-list-title>Product backlog</v-list-title>
          </v-list-item>
          <v-list-item @click="selected = SprintBacklog" prepend-icon="mdi-invoice-list-outline" v-if="!isProductOwner">
            <v-list-title>Sprint backlog</v-list-title>
          </v-list-item>
          <!-- <v-btn @click="$refs.dlgUserStory.show = true" class="dlgButton">New user story</v-btn>
          <dlg-new-story ref="dlgUserStory"></dlg-new-story> -->
        </v-list>

        <DlgProfile v-model="profileDlg" @update:show="profileDlg = $event"></DlgProfile>

        <template v-slot:append>
          <v-list>
            <v-list-item>Last sign in: <br>
              {{ formatDateTime(user?.last_sign_in_at ?? '') }}</v-list-item>
          </v-list>
          <div class="pa-2">
            <v-btn block @click="signOut"> Logout </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <v-main>
        <component :is="selected" />
      </v-main>
    </v-layout>
  </v-card>
</template>

<script lang="ts">
import { ref } from 'vue';
import DlgProfile from '../dialogs/DlgProfile.vue';
import { formatDateTime } from '../lib/dateFormatter';

const profileDlg = ref(false);
const isProductOwner = ref(false);

const showDialog = () => {
  profileDlg.value = true;
};

const user = await (await supabase.auth.getUser()).data.user;

async function getProjectRole() {
  const { data } = await supabase
    .from('project_role')
    .select('role')
    .eq('user_id', user?.id)

  if (data) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].role === 'product_owner') {
        isProductOwner.value = true
        return
      }
    }
  }
  isProductOwner.value = false
}

async function getUserName() {
  const { data } = await supabase
    .from('user_profile')
    .select('name, surname')
    .eq('user_id', user?.id)
    .single();

  return `${data?.name} ${data?.surname}`;
};

export default {
  data() {
    return {
      userName: '',
      selected: Project
    };
  },

  async mounted() {
    this.userName = await getUserName();
    await getProjectRole();
  },
};
</script>
