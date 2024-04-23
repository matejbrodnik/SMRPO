import { supabase } from '../lib/supabaseClient';

export async function getProjects() {
  const user = (await supabase.auth.getUser()).data.user;
  const userId = user.id;

  const { data, error } = await supabase
    .from('project_role')
    .select(
      `
            project:project_id ( id, name, description )
        `
    )
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching projects');
    return null;
  } else {
    return data.map((project: any) => project.project);
  }
}
