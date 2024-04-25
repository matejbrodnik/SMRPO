<template>
  <v-dialog v-model="show" width="50%">
    <v-card>
      <v-card-title>{{ reject ? 'Rejection comment' : 'Add comment' }}</v-card-title>
      <v-card-text>
        <v-textarea v-model="comment"></v-textarea>
      </v-card-text>
      <v-divider></v-divider>
        <v-card-actions>
          <v-btn text="Confirm" variant="text" @click="addComment"></v-btn>
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
  props: {
      parentMethod: Function
    },
  setup(props) {
    const show = ref(false);
    const reject = ref(false);
    const comment = ref("");
    const userId = ref("");
    const storyId = ref(0);

    async function addComment() {
      if (comment.value == "")
        return;
      if (reject.value) {
        const { error } = await supabase
          .from('user_story')
          .update([{
            sprint_id: null,
            state: "idle",
            comment: comment.value 
          }])
          .eq('id', storyId.value);
        if(error) throw error;
      }

      const { data, error: error0 } = await supabase
        .from('user_profile')
        .select('name, surname')
        .eq('user_id', userId.value)
        .single();
      if (error0) throw error0;

      let username = data.name + " " + data.surname;
      const { error: error1 } = await supabase
        .from('user_story_comments')
        .insert([
          {
            user_story_id: storyId.value,
            user_id: userId.value,
            comment: comment.value,
            user_name: username,
            rejected: reject.value
          },
        ]);
      
      if (error1) throw error1;
      props.parentMethod?.();
      show.value = false;
    }
    
    return {
      show,
      comment,
      storyId,
      reject,
      userId,
      addComment
    };
  }
});
</script>