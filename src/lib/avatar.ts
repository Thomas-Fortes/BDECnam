import type { SupabaseClient } from "@supabase/supabase-js";
import { prepareAvatarFile } from "@/lib/image";

export async function uploadAvatar(
  supabase: SupabaseClient,
  participantId: string,
  file: File
): Promise<string> {
  const prepared = await prepareAvatarFile(file);
  const path = `${participantId}.webp`;

  const { error } = await supabase.storage.from("avatars").upload(path, prepared, {
    upsert: true,
    contentType: "image/webp",
    cacheControl: "3600",
  });
  if (error) throw error;

  const { error: updateError } = await supabase
    .from("participants")
    .update({ photo_path: path })
    .eq("id", participantId);
  if (updateError) throw updateError;

  return path;
}

export async function removeAvatar(supabase: SupabaseClient, participantId: string, photoPath: string) {
  await supabase.storage.from("avatars").remove([photoPath]);
  const { error } = await supabase.from("participants").update({ photo_path: null }).eq("id", participantId);
  if (error) throw error;
}
