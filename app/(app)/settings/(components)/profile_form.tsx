'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { useUserContext } from '@/contexts/userContext';
import { deleteProfileImage, uploadProfileImage } from '@/lib/actions/storageActions';
import {
  checkUsername,
  updateEmail,
  updateProfile,
  updateUsername
} from '@/lib/actions/userActions';
import { handleImageCompression } from '@/lib/helpers/helpersImages';
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.'
  }),
  username: z.string().min(3, {
    message: 'Username must be at least 3 characters.'
  })
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileForm() {
  const { name, email, imageUrl, userId, username } = useUserContext();
  const [imageLoading, setImageLoading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: name || '',
      email: email || '',
      username: username || ''
    }
  });

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageLoading(true);
    const files = event.target.files?.length ? Array.from(event.target.files) : null;
    if (files && files.length > 0) {
      files.map(async (file) => {
        try {
          const compressedFile = await handleImageCompression(file);
          if (!compressedFile) return;
          // const imageUrl = await fileToImageUrl(compressedFile);
          const fileFormData = new FormData();
          fileFormData.append('image', compressedFile);
          if (!userId) {
            alert('Please set your profile name first.');
            return;
          }
          const newImageUrl = await uploadProfileImage({
            file: fileFormData,
            profileId: userId,
            fileName: compressedFile.name,
            oldImageUrl: imageUrl ?? null
          });
          await updateProfile({ name: name ?? '', imageUrl: newImageUrl });
          toast('Success', {
            description: 'Profile picture updated successfully!'
          });
        } catch (error) {
          toast('Error', {
            description: 'Failed to upload image. Please try again.'
          });
        } finally {
          setIsUploading(false);
        }
      });
    }
    setImageLoading(false);
  };

  const handlePhotoButtonClick = () => {
    if (photoInputRef.current !== null) {
      photoInputRef.current.click();
    }
  };

  const handleImageDelete = async () => {
    if (!imageUrl || !userId) return;
    await deleteProfileImage({ profileId: userId, url: imageUrl });
    await updateProfile({
      name: name ?? '',
      imageUrl: null
    });
  };

  async function onSubmit(data: ProfileFormValues) {
    try {
      if (data.username !== username) {
        const c = confirm(
          'Changing your username will change your public URL and break existing links to your posts. Are you sure you want to continue?'
        );
        if (!c) return;

        const usernameAvailable = await checkUsername(data.username);
        if (!usernameAvailable) {
          toast('Error', {
            description: 'Username is already taken. Please try another.'
          });
          return;
        }
        await updateUsername(data.username);
      }

      if (data.email !== email) {
        await updateEmail(data.email);
        toast('Email Update', {
          description: 'Email update request sent. Please check your inbox.'
        });
      }

      await updateProfile({
        name: data.name,
        imageUrl: imageUrl
      });

      toast('Success', {
        description: 'Profile updated successfully!'
      });
    } catch (error) {
      toast('Error', {
        description: 'Failed to update profile. Please try again.'
      });
    }
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={imageUrl} className="object-cover" />
            <AvatarFallback>{name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-center space-y-2">
            <Input
              type="file"
              ref={photoInputRef}
              accept="image/*"
              className="hidden"
              id="avatar-upload"
              onChange={handleImageChange}
              disabled={isUploading}
            />
            <Button variant="outline" onClick={handlePhotoButtonClick}>
              {isUploading ? 'Uploading...' : 'Change Avatar'}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} />
                  </FormControl>
                  <FormDescription>This is your public display name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Your email" {...field} />
                  </FormControl>
                  <FormDescription>
                    {`You'll need to verify your new email if you change it.`}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Your username" {...field} />
                  </FormControl>
                  <FormDescription>This defines your public URL.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <LoadingButton
              type="submit"
              buttonState={form.formState.isSubmitting ? 'loading' : 'default'}
              text="Save changes"
              loadingText="Saving..."
            />
          </form>
        </Form>
      </div>
    </div>
  );
}
