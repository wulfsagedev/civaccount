'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * The name other people see on Town Hall. One field for the desktop account
 * panel and both phone menus: before 18 Nov 2026 only the desktop panel had
 * it, so on a phone the public name was the start of the email address.
 */
export default function DisplayNameField({ id = 'display-name' }: { id?: string }) {
  const { user, displayName } = useAuth();
  const [name, setName] = useState(displayName ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (displayName) setName(displayName);
  }, [displayName]);

  if (!user) return null;

  const trimmed = name.trim();
  const unchanged = trimmed === (displayName ?? '');

  const handleSave = async () => {
    if (!trimmed || unchanged) return;
    if (trimmed.length < 2 || trimmed.length > 50) {
      setError('Use 2 to 50 letters.');
      return;
    }
    setIsSaving(true);
    setError('');
    const supabase = createClient();
    // Supabase returns errors rather than throwing them, so check this one:
    // the database refuses some names, and the old panel then reloaded as if
    // the name had been saved.
    const { error: saveError } = await supabase
      .from('users')
      .update({ display_name: trimmed })
      .eq('id', user.id);
    setIsSaving(false);
    if (saveError) {
      setError('That name was not saved. Use 2 to 50 letters and try again.');
      return;
    }
    setSaved(true);
    // Reload so the new name shows everywhere.
    window.location.reload();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="type-caption font-medium">
        Your name on Town Hall
      </Label>
      <div className="flex gap-2">
        <Input
          id={id}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          placeholder="Your name or a nickname"
          maxLength={50}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          // 16px: under it, an iPhone zooms the page when the field is tapped
          className="h-11 flex-1 type-body"
        />
        <Button
          type="button"
          variant={saved ? 'outline' : 'default'}
          disabled={isSaving || !trimmed || unchanged}
          onClick={handleSave}
          className="h-11 cursor-pointer"
        >
          {saved ? <Check className="h-4 w-4 text-positive" aria-label="Saved" /> : isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} className="type-body-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
