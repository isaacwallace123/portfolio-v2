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
import { useTranslations } from 'next-intl';

type TestimonialFormProps = {
  onSubmitted?: () => void;
};

export function TestimonialForm({ onSubmitted }: TestimonialFormProps) {
  const t = useTranslations('testimonials');
  const [formLoadTime] = useState(() => Date.now());
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
      toast.error(t('imageTooLarge'));
      return;
    }

    setAvatarFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t('enterName'));
      return;
    }
    if (message.trim().length < 10) {
      toast.error(t('messageMinLength'));
      return;
    }
    if (rating === 0) {
      toast.error(t('selectRating'));
      return;
    }
    if (linkedin.trim() && !/^https:\/\/(www\.)?linkedin\.com\//.test(linkedin.trim())) {
      toast.error(t('linkedinUrlInvalid'));
      return;
    }

    try {
      setSubmitting(true);

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
        _hp_field: '',
        _timestamp: formLoadTime,
      });
      toast.success(t('submitted'));
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="testimonial-name">{t('nameLabel')}</Label>
          <Input
            id="testimonial-name"
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="testimonial-role">{t('roleLabel')}</Label>
          <Input
            id="testimonial-role"
            placeholder={t('rolePlaceholder')}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="testimonial-linkedin">{t('linkedinLabel')}</Label>
        <UrlInput
          id="testimonial-linkedin"
          placeholder={t('linkedinPlaceholder')}
          value={linkedin}
          onChange={setLinkedin}
          className={linkedinInvalid ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {linkedinInvalid && (
          <p className="text-xs text-destructive">{t('linkedinInvalid')}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>{t('photoLabel')}</Label>
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
            {t('uploadPhoto')}
          </Button>
        )}
        <p className="text-xs text-muted-foreground">{t('photoHint')}</p>
      </div>

      <div className="space-y-2">
        <Label>{t('ratingLabel')}</Label>
        <StarRating value={rating} onChange={setRating} size={28} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testimonial-message">{t('messageLabel')}</Label>
        <Textarea
          id="testimonial-message"
          placeholder={t('messagePlaceholder')}
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
        />
      </div>

      {/* Honeypot field (hidden from humans, bots fill it) */}
      <input
        type="text"
        name="_hp_field"
        defaultValue=""
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          height: 0,
          width: 0,
        }}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {/* Timestamp field */}
      <input type="hidden" name="_timestamp" value={formLoadTime} />

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
