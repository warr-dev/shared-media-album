import { createSupabaseAdminClient } from "@/lib/db/supabase-server";

export async function createSupabaseSignedUpload({
  bucket,
  objectKey
}: {
  bucket: string;
  objectKey: string;
}) {
  const { data, error } = await createSupabaseAdminClient()
    .storage
    .from(bucket)
    .createSignedUploadUrl(objectKey);

  if (error) {
    throw error;
  }

  return data;
}
