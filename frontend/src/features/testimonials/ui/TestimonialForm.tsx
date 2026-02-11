'use client';

import { useState, useRef, useMemo } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UrlInput } from '@/components/ui/url-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from './StarRating';
import { testimonialsApi } from '../api/testimonialsApi';
import { toast } from 'sonner';

type TestimonialFormProps = {
  onSubmitted?: () => void;
};

export function TestimonialForm({ onSubmitted }: TestimonialFormProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [linkedin, setLinkedin] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const avatarPreview = useMemo(
    () => (avatarFile ? URL.createObjectURL(avatarFile) : null),
    [avatarFile]
  );

  const linkedinInvalid =
    linkedin.trim().length > 0 &&
    !/^https:\/\/(www\.)?linkedin\.com\//.test(linkedin.trim());

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarInputRef.current) avatarInputRef.current.value = '';

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 2MB.');
      return;
    }

    setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (message.trim().length < 10) {
      toast.error('Message must be at least 10 characters');
      return;
    }
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    if (linkedin.trim() && !/^https:\/\/(www\.)?linkedin\.com\//.test(linkedin.trim())) {
      toast.error('LinkedIn URL must be a linkedin.com link');
      return;
    }

    try {
      setSubmitting(true);

      // Upload avatar only at submission time
      let avatarUrl: string | undefined;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const res = await fetch('/api/uploads/public', {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to upload image');
        }
        const data = await res.json();
        avatarUrl = data.url;
      }

      await testimonialsApi.create({
        name: name.trim(),
        role: role.trim() || undefined,
        avatar: avatarUrl,
        linkedin: linkedin.trim() || undefined,
        message: message.trim(),
        rating,
      });
      toast.success('Thank you! Your testimonial has been submitted for review.');
      setName('');
      setRole('');
      setAvatarFile(null);
      setLinkedin('');
      setMessage('');
      setRating(0);
      onSubmitted?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to submit testimonial';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* About you */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="testimonial-name">Name *</Label>
          <Input
            id="testimonial-name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="testimonial-role">Role / Company</Label>
          <Input
            id="testimonial-role"
            placeholder="e.g. Software Engineer at Acme"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="testimonial-linkedin">LinkedIn</Label>
        <UrlInput
          id="testimonial-linkedin"
          placeholder="linkedin.com/in/yourname"
          value={linkedin}
          onChange={setLinkedin}
          className={linkedinInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {linkedinInvalid && (
          <p className="text-xs text-destructive">Must be a linkedin.com link</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Photo</Label>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleAvatarSelect}
          className="hidden"
        />
        {avatarPreview ? (
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2.5">
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
              {avatarFile?.name}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setAvatarFile(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2 text-muted-foreground"
            onClick={() => avatarInputRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            Upload a photo
          </Button>
        )}
        <p className="text-xs text-muted-foreground">Optional. JPEG, PNG, WebP, or GIF. Max 2 MB.</p>
      </div>

      {/* Review */}
      <div className="space-y-2">
        <Label>Rating *</Label>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testimonial-message">Message *</Label>
        <Textarea
          id="testimonial-message"
          placeholder="Share your experience..."
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
        />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Testimonial'}
      </Button>
    </form>
  );
}
