import { createSupabaseAdminClient } from "@/lib/db/supabase-server";

const maxUploadBytes = 1024 * 1024 * 50;

async function ensureSupabaseStorageBucket(bucket: string) {
  const supabase = createSupabaseAdminClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw listError;
  }

  if (buckets?.some((item) => item.name === bucket)) {
    const { error: updateError } = await supabase.storage.updateBucket(bucket, {
      public: false,
      allowedMimeTypes: ["image/*", "video/*"],
      fileSizeLimit: maxUploadBytes
    });

    if (updateError) {
      throw updateError;
    }

    return supabase;
  }

  const { error: createError } = await supabase.storage.createBucket(bucket, {
    public: false,
    allowedMimeTypes: ["image/*", "video/*"],
    fileSizeLimit: maxUploadBytes
  });

  if (createError) {
    throw createError;
  }

  return supabase;
}

export async function createSupabaseSignedUpload({
  bucket,
  objectKey
}: {
  bucket: string;
  objectKey: string;
}) {
  const supabase = await ensureSupabaseStorageBucket(bucket);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(objectKey);

  if (error) {
    throw error;
  }

  return data;
}
