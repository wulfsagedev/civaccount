'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CARD_STYLES } from '@/lib/utils';
import { User } from 'lucide-react';

export default function DisplayNamePrompt() {
  const { user, displayName } = useAuth();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Only show if user is signed in and display_name is the default (email prefix)
  if (!user || dismissed) return null;
  const emailPrefix = user.email?.split('@')[0];
  if (!emailPrefix || displayName !== emailPrefix) return null;

  // Check if already dismissed this session
  if (typeof window !== 'undefined' && sessionStorage.getItem('name_prompt_dismissed')) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    const supabase = createClient();
    await supabase
      .from('users')
      .update({ display_name: name.trim() })
      .eq('id', user.id);

    setIsSubmitting(false);
    setDismissed(true);
    // Reload to pick up the new name
    window.location.reload();
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('name_prompt_dismissed', '1');
  };

  return (
    <div className={`${CARD_STYLES} p-4 sm:p-5 mb-4`}>
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="type-body-sm font-semibold mb-2">Choose a display name</p>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name or nickname"
              aria-label="Display name"
              maxLength={50}
              className="h-10 flex-1"
            />
            <Button type="submit" size="sm" disabled={isSubmitting || !name.trim()} className="h-10 cursor-pointer">
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleDismiss} className="h-10 cursor-pointer">
              Skip
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
