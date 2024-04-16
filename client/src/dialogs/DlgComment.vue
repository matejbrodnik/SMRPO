<template>
  <v-dialog v-model="show" width="50%">
    <v-card>
      <v-card-title>Rejection comment</v-card-title>
      <v-card-text>
        <v-textarea v-model="comment"></v-textarea>
      </v-card-text>
      <v-divider></v-divider>
        <v-card-actions>
          <v-btn text="Confirm" variant="text" @click="rejectStory"></v-btn>
          <v-spacer></v-spacer>
          <v-btn text="Close" variant="text" @click="show = false"></v-btn>
        </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { supabase } from '../lib/supabaseClient';

export default defineComponent({
  setup() {
    const show = ref(false);
    const comment = ref("");
    const storyId = ref(0);

    async function rejectStory() {
      if (comment.value == "")
        return;
      const {data, error} = await supabase
          .from('user_story')
          .update([{
            sprint_id: null,
            state: "idle",
            comment: comment.value 
          }])
          .eq('id', storyId.value);
        
        if(error)
          throw error;
      show.value = false;
    }
    
    return {
      show,
      comment,
      storyId,
      rejectStory
    };
  }
});
</script>