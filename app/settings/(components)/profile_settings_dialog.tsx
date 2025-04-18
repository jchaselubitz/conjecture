'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useUserContext } from '@/contexts/userContext';

import ProfileForm from './profile_form';
export default function ProfileSettingsDialog() {
  const { settingsDialog, setSettingsDialog } = useUserContext();
  return (
    <Dialog open={settingsDialog} onOpenChange={setSettingsDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profile Settings</DialogTitle>
          <DialogDescription>Manage your profile settings here.</DialogDescription>
        </DialogHeader>
        <ProfileForm />
      </DialogContent>
    </Dialog>
  );
}
