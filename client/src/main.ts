import '@mdi/font/css/materialdesignicons.css'; // ikone
import { createApp, createApp } from 'vue';
import App from './App.vue';
import './index.css';
import './style.css';

// Vuetify
import '@mdi/font/css/materialdesignicons.css';
import { VueQueryPlugin } from '@tanstack/vue-query';
import { jwtDecode } from 'jwt-decode';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import { supabase } from './lib/supabaseClient';
import router from './router';
import store from './store';

const vuetify = createVuetify({
  components,
  directives,
});

supabase.auth.onAuthStateChange(async (event, session) => {
  if (session) {
    console.log(session);
    const jwt = jwtDecode(session.access_token);
    console.log('jwt', jwt);
    localStorage.setItem('user_role', jwt.user_role); // replace 'role' with the actual property name
    //store.commit('setUserRole', jwt.user_role); // replace 'role' with the actual property name
  } else {
    // Clear the user role in the Vuex store when the user logs out
    store.commit('setUserRole', null);
  }
});

createApp(App).use(vuetify).use(router).use(store).use(VueQueryPlugin).mount('#app');
