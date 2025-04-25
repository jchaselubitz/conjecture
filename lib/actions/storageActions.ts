'use server';

import * as Sentry from '@sentry/nextjs';
import { revalidatePath } from 'next/cache';

import { createClient } from '@/supabase/server';

import { authenticatedUser } from './baseActions';

async function uploadFile({ bucket, file, path }: { bucket: string; file: File; path: string }) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).upload(`${path}`, file);
  return { data, error };
}

export type StorageObject = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: any;
};

export async function deleteFile({
  bucket,
  url,
  folderPath
}: {
  bucket: string;
  url: string;
  folderPath: string;
}) {
  const fileName = url.split('/').pop();
  const path = `${folderPath}/${fileName}`;

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).remove([path]);
  console.log(data, error);
  if (error) {
    Sentry.captureException(error);
    throw new Error('Failed to delete image');
  }
  return data;
}

async function getPublicFile({ bucket, path }: { bucket: string; path: string }) {
  const supabase = await createClient();
  const { data: image } = supabase.storage.from(bucket).getPublicUrl(`${path}`);
  return image.publicUrl;
}

export async function uploadStatementImage({
  oldImageUrl,
  file,
  fileName,
  creatorId,
  statementId
}: {
  oldImageUrl: string | undefined;
  file: FormData;
  creatorId: string;
  statementId: string;
  fileName: string;
}) {
  const user = await authenticatedUser(creatorId);
  const userId = user.id;
  const bucket = 'statement-images';

  if (oldImageUrl) {
    await deleteFile({
      bucket,
      url: oldImageUrl,
      folderPath: `${userId}/${statementId}`
    });
  }
  const fileForUpload = file.get('image') as File;

  const { data, error } = await uploadFile({
    bucket,
    file: fileForUpload,
    path: `${userId}/${statementId}/${fileName}`
  });

  if (error) {
    if (error.message === 'The resource already exists') {
      const publicUrl = getPublicFile({
        bucket,
        path: `${userId}/${statementId}/${fileName}`
      });
      return publicUrl;
    }
    Sentry.captureException(error);
  }
  if (!data) {
    return null;
  }

  const publicUrl = getPublicFile({ bucket, path: data?.path });
  return publicUrl;
}

export async function deleteStoredStatementImage({
  url,
  creatorId,
  statementId
}: {
  url: string;
  creatorId: string;
  statementId: string;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return;
  }

  if (userId !== creatorId) {
    throw new Error('Unauthorized');
  }

  const bucket = 'statement-images';
  const path = `${userId}/${statementId}`;
  await deleteFile({ bucket, url, folderPath: path });
}

export async function uploadProfileImage({
  oldImageUrl,
  file,
  profileId,
  fileName
}: {
  oldImageUrl: string | null;
  file: FormData;
  profileId: string;
  fileName: string;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const userId = user?.id;

  if (!userId) {
    return;
  }

  if (userId !== profileId) {
    throw new Error('Unauthorized');
  }

  const bucket = 'user-images';
  if (oldImageUrl) {
    await deleteFile({ bucket, url: oldImageUrl, folderPath: profileId });
  }
  const fileForUpload = file.get('image') as File;

  const { data, error } = await uploadFile({
    bucket,
    file: fileForUpload,
    path: `${profileId}/${fileName}`
  });

  if (error) {
    Sentry.captureException(error);
    console.log('error', error);
  }

  if (!data) return null;

  return getPublicFile({ bucket, path: data?.path });
}

export async function deleteProfileImage({ profileId, url }: { profileId: string; url: string }) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return;
  }

  if (userId !== profileId) {
    throw new Error('Unauthorized');
  }

  const bucket = 'user-images';
  await deleteFile({ bucket, url, folderPath: profileId });
  revalidatePath('/', 'page');
}

export async function getStatementImages({
  statementId,
  creatorId
}: {
  statementId: string;
  creatorId: string;
}) {
  const supabase = await createClient();
  const statementImages = await supabase.storage
    .from('statement-images')
    .createSignedUrls([`${creatorId}/${statementId}/`], 3600);

  return statementImages;
}
