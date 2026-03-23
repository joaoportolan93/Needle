import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useForm, Controller } from 'react-hook-form';
import { updateUserSettings } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { toast } from 'sonner';
import { Upload, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

const SettingsPage = () => {
    const { user, updateUser } = useAuth();
    const { register, handleSubmit, control, setValue, watch, formState: { isDirty } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const avatarUrl = watch('avatar_url');
    const { t } = useTranslation();

    useEffect(() => {
        if (user) {
            setValue('avatar_url', user.avatar_url || '');
            setValue('bio', user.bio || '');
            setValue('theme_preference', user.theme_preference || 'dark');
        }
    }, [user, setValue]);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error(t('settings.invalidImage'));
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error(t('settings.imageTooLarge'));
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setValue('avatar_url', reader.result, { shouldDirty: true });
        };
        reader.readAsDataURL(file);
    };

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            await updateUserSettings(data);
            updateUser(data);
            toast.success(t('settings.successMessage'));
        } catch (error) {
            toast.error(t('settings.errorMessage'));
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-foreground">{t('settings.loading')}</div>;

    return (
        <div className="container mx-auto py-10 max-w-2xl px-4">
            <h1 className="text-3xl font-bold mb-8 text-foreground">{t('settings.title')}</h1>

            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.profileInfo')}</CardTitle>
                    <CardDescription>{t('settings.updateInfo')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        {/* Avatar Preview */}
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <img
                                    src={avatarUrl || 'https://via.placeholder.com/80/1DB954/FFFFFF?text=U'}
                                    alt="Avatar preview"
                                    className="w-20 h-20 rounded-full object-cover border-2 border-border"
                                />
                            </div>
                            <div className="flex-1 space-y-3">
                                {/* URL Input */}
                                <div className="space-y-1">
                                    <Label htmlFor="avatar_url" className="flex items-center gap-1.5">
                                        <LinkIcon size={14} />
                                        {t('settings.imageUrl')}
                                    </Label>
                                    <Input
                                        id="avatar_url"
                                        placeholder={t('settings.imageUrlPlaceholder')}
                                        {...register('avatar_url')}
                                    />
                                </div>

                                {/* File Upload */}
                                <div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="gap-2"
                                    >
                                        <Upload size={14} />
                                        {t('settings.chooseFromGallery')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-2">
                            {t('settings.imageHelp')}
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="bio">{t('settings.bio')}</Label>
                            <Textarea
                                id="bio"
                                placeholder={t('settings.bioPlaceholder')}
                                className="resize-none h-32"
                                {...register('bio')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="theme_preference">{t('settings.themePreference')}</Label>
                            <Controller
                                control={control}
                                name="theme_preference"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder={t('settings.selectTheme')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">{t('settings.lightTheme')}</SelectItem>
                                            <SelectItem value="dark">{t('settings.darkTheme')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        {/* Language Section */}
                        <div className="space-y-2">
                            <Label>{t('settings.language')}</Label>
                            <p className="text-xs text-muted-foreground mb-2">{t('settings.languageDescription')}</p>
                            <LanguageSwitcher />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading || !isDirty}>
                                {isLoading ? t('settings.saving') : t('settings.saveChanges')}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
