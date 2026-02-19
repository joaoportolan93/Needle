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

const SettingsPage = () => {
    const { user, updateUser } = useAuth();
    const { register, handleSubmit, control, setValue, watch, formState: { isDirty } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const avatarUrl = watch('avatar_url');

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
            toast.error("Por favor, selecione um arquivo de imagem.");
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error("A imagem deve ter no máximo 2MB.");
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
            toast.success("Perfil atualizado com sucesso!");
        } catch (error) {
            toast.error("Falha ao atualizar perfil.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center text-foreground">Carregando configurações...</div>;

    return (
        <div className="container mx-auto py-10 max-w-2xl px-4">
            <h1 className="text-3xl font-bold mb-8 text-foreground">Configurações da Conta</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Informações do Perfil</CardTitle>
                    <CardDescription>Atualize suas informações e preferências.</CardDescription>
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
                                        URL da Imagem
                                    </Label>
                                    <Input
                                        id="avatar_url"
                                        placeholder="https://exemplo.com/avatar.jpg"
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
                                        Escolher da galeria
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground -mt-2">
                            Cole o link de uma imagem ou GIF da internet, ou se preferir, envie uma foto personalizada do seu computador.
                        </p>

                        <div className="space-y-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                placeholder="Conte-nos sobre seus gostos musicais..."
                                className="resize-none h-32"
                                {...register('bio')}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="theme_preference">Preferência de Tema</Label>
                            <Controller
                                control={control}
                                name="theme_preference"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Selecione um tema" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="light">☀️ Claro</SelectItem>
                                            <SelectItem value="dark">🌙 Escuro</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isLoading || !isDirty}>
                                {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
