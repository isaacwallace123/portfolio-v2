'use client';

import { useState, useRef } from 'react';
import { ImagePlus, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [avatar, setAvatar] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const linkedinInvalid =
    linkedin.trim().length > 0 &&
    !/^https?:\/\/(www\.)?linkedin\.com\//.test(linkedin.trim());

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (avatarInputRef.current) avatarInputRef.current.value = '';

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 2MB.');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/uploads/public', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload image');
      }
      const data = await res.json();
      setAvatar(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to upload image';
      toast.error(msg);
    } finally {
      setUploadingAvatar(false);
    }
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
    if (linkedin.trim() && !/^https?:\/\/(www\.)?linkedin\.com\//.test(linkedin.trim())) {
      toast.error('LinkedIn URL must be a linkedin.com link');
      return;
    }

    try {
      setSubmitting(true);
      await testimonialsApi.create({
        name: name.trim(),
        role: role.trim() || undefined,
        avatar: avatar || undefined,
        linkedin: linkedin.trim() || undefined,
        message: message.trim(),
        rating,
      });
      toast.success('Thank you! Your testimonial has been submitted for review.');
      setName('');
      setRole('');
      setAvatar('');
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
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Avatar</Label>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          {avatar ? (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-2">
              <img
                src={avatar}
                alt="Avatar preview"
                className="h-10 w-10 rounded-full object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                Uploaded
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setAvatar('')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 text-muted-foreground"
              disabled={uploadingAvatar}
              onClick={() => avatarInputRef.current?.click()}
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {uploadingAvatar ? 'Uploading...' : 'Upload a photo'}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF. Max 2MB.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="testimonial-linkedin">LinkedIn</Label>
          <Input
            id="testimonial-linkedin"
            placeholder="https://linkedin.com/in/yourname"
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className={linkedinInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}
          />
          {linkedinInvalid && (
            <p className="text-xs text-destructive">Must be a linkedin.com link</p>
          )}
        </div>
      </div>
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
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Testimonial'}
      </Button>
    </form>
  );
}
