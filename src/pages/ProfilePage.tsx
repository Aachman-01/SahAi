import { useEffect, useState } from 'react';
import { Card, Badge } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { User, Phone, MapPin, Clock, Tag, CreditCard, Save, Star, Images, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  useProfile,
  useUpdateProfile,
  useBusinessProfile,
  useUpdateBusinessProfile,
  useReviews,
  useGallery,
  useAddGalleryImage,
  useDeleteGalleryImage,
  useUpdateGalleryImage,
  useRemoveProfilePicture,
} from '@/hooks/useApi';
import { validateBusinessProfile, formatBusinessUpdatedAt, type BusinessFieldErrors } from '@/utils/validation';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { data: vendor, isLoading } = useProfile();
  const { data: businessProfile } = useBusinessProfile();
  const { data: reviews = [] } = useReviews();
  const { data: gallery = [] } = useGallery();
  const updateProfile = useUpdateProfile();
  const updateBusinessProfile = useUpdateBusinessProfile();
  const removeProfilePicture = useRemoveProfilePicture();
  const addGalleryImage = useAddGalleryImage();
  const updateGalleryImage = useUpdateGalleryImage();
  const deleteGalleryImage = useDeleteGalleryImage();

  const [form, setForm] = useState({
    name: '', owner: '', phone: '', upiId: '', location: '', hours: '', category: '', description: '',
  });
  const [errors, setErrors] = useState<BusinessFieldErrors>({});
  const [conflictWarning, setConflictWarning] = useState('');

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name, owner: vendor.owner, phone: vendor.phone, upiId: vendor.upiId,
        location: vendor.location, hours: vendor.hours, category: vendor.category,
        description: vendor.description || '',
      });
    }
  }, [vendor]);

  // The shared React Query cache is the source of truth for fields used by
  // both Business Profile and QR Payment.
  useEffect(() => {
    if (businessProfile) {
      setForm((prev) => ({
        ...prev,
        name: businessProfile.businessName,
        phone: businessProfile.phone,
        upiId: businessProfile.upiId,
      }));
    }
  }, [businessProfile]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [k]: e.target.value });
    const ek = (k === 'name' ? 'businessName' : k) as keyof BusinessFieldErrors;
    setErrors((prev) => (prev[ek] ? { ...prev, [ek]: undefined } : prev));
  };

  const saving = updateProfile.isPending || updateBusinessProfile.isPending;

  const save = async () => {
    // Validate the shared fields client-side first.
    const errs = validateBusinessProfile({ businessName: form.name, phone: form.phone, upiId: form.upiId });
    if (Object.keys(errs).length) {
      setErrors(errs);
      toast.error('Please fix the highlighted fields');
      return;
    }
    setErrors({});
    try {
      // Shared fields go through the single source-of-truth endpoint so the
      // QR Payment page reflects the change automatically.
      const saved = await updateBusinessProfile.mutateAsync({
        businessName: form.name,
        phone: form.phone,
        upiId: form.upiId,
        baseUpdatedAt: businessProfile?.updatedAt ?? null,
      });
      if (saved.conflict) {
        setConflictWarning('Another device saved changes after this form was loaded. Your latest save was applied.');
      } else {
        setConflictWarning('');
      }
      // Profile-only fields are saved separately.
      await updateProfile.mutateAsync({
        owner: form.owner, location: form.location, hours: form.hours,
        category: form.category, description: form.description,
      });
      toast.success('Profile saved!');
    } catch (err: any) {
      const fields = err?.response?.data?.fields as BusinessFieldErrors | undefined;
      if (fields) setErrors(fields);
      toast.error(err?.response?.data?.error || 'Could not save profile');
    }
  };

  // ---- Profile picture (avatar/logo) handlers ----
  const onAvatarChange = async (url: string | null) => {
    if (url === null) {
      await removeProfilePicture.mutateAsync();
    } else {
      await updateProfile.mutateAsync({ logo: url });
    }
  };

  // ---- Gallery handlers ----
  const onGalleryAdd = async (url: string | null) => {
    if (!url) return;
    await addGalleryImage.mutateAsync({ url });
  };

  const onGalleryReplace = (id: string) => async (url: string | null) => {
    if (url === null) {
      await deleteGalleryImage.mutateAsync(id);
    } else {
      await updateGalleryImage.mutateAsync({ id, patch: { url } });
    }
  };

  if (isLoading || !vendor) {
    return <div className="space-y-6"><Skeleton className="h-24 rounded-2xl" /><Skeleton className="h-64 rounded-2xl" /></div>;
  }

  const initials = form.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Business Profile</h2>
          <p className="text-sm text-gray-500">Your digital business identity</p>
          <p className="mt-1 text-xs text-gray-400">Last updated: {formatBusinessUpdatedAt(businessProfile?.updatedAt)}</p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {conflictWarning && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{conflictWarning}</span>
        </div>
      )}

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <ImageUploader
            variant="avatar"
            value={vendor.logo || null}
            onChange={onAvatarChange}
            placeholder={<span>{initials || 'RF'}</span>}
            removeTitle="Remove profile picture?"
            removeMessage="Your profile picture will be permanently deleted. You can upload a new one at any time."
            processOptions={{ maxDimension: 512, quality: 0.9 }}
            disabled={updateProfile.isPending || removeProfilePicture.isPending}
          />
          <div className="flex-1">
            <h3 className="text-xl font-bold">{form.name}</h3>
            <p className="text-sm text-gray-500">{form.category}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <Badge color="green"><Star className="h-3 w-3 fill-current" /> {vendor.rating} ({reviews.length} reviews)</Badge>
              <Badge color="primary">{vendor.status === 'active' ? 'Active' : vendor.status}</Badge>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Tip: use the camera button to upload a picture, refresh to replace it, or the trash icon to remove it.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-bold mb-4">Business Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Business Name" value={form.name} onChange={set('name')} icon={<User className="h-4 w-4" />} error={errors.businessName} />
          <Input label="Owner Name" value={form.owner} onChange={set('owner')} icon={<User className="h-4 w-4" />} />
          <Input label="Phone Number" value={form.phone} onChange={set('phone')} icon={<Phone className="h-4 w-4" />} error={errors.phone} />
          <Input label="UPI ID" value={form.upiId} onChange={set('upiId')} icon={<CreditCard className="h-4 w-4" />} error={errors.upiId} />
          <Input label="Location" value={form.location} onChange={set('location')} icon={<MapPin className="h-4 w-4" />} />
          <Input label="Opening Hours" value={form.hours} onChange={set('hours')} icon={<Clock className="h-4 w-4" />} />
          <Input label="Category" value={form.category} onChange={set('category')} icon={<Tag className="h-4 w-4" />} />
        </div>
        <div className="mt-4">
          <Textarea label="Business Description" rows={3} value={form.description} onChange={set('description')} />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-primary-600" />
            <h3 className="font-bold">Business Photos</h3>
          </div>
          <span className="text-xs text-gray-500">{gallery.length} photo{gallery.length === 1 ? '' : 's'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {gallery.map((g) => (
            <ImageUploader
              key={g.id}
              variant="tile"
              value={g.url}
              onChange={onGalleryReplace(g.id)}
              removeTitle="Remove this photo?"
              removeMessage="This photo will be permanently removed from your gallery."
              processOptions={{ maxDimension: 1600, quality: 0.85 }}
            />
          ))}

          {/* Add-new tile: always present at the end of the gallery. */}
          <ImageUploader
            variant="tile"
            value={null}
            onChange={onGalleryAdd}
            processOptions={{ maxDimension: 1600, quality: 0.85 }}
          />
        </div>

        <p className="text-xs text-gray-500 mt-3">
          Hover any photo to replace or remove it. Uploads are auto-resized and compressed for fast page loads.
        </p>
      </Card>
    </div>
  );
}
