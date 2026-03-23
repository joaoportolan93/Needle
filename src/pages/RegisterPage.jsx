import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');
    const { t } = useTranslation();

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerError('');
        try {
            await registerUser({
                username: data.username,
                email: data.email,
                password: data.password
            });
            navigate('/login');
        } catch (error) {
            setServerError(t('register.registrationFailed'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>{t('register.title')}</CardTitle>
                    <CardDescription>{t('register.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">{t('register.username')}</Label>
                                <Input
                                    id="username"
                                    placeholder={t('register.usernamePlaceholder')}
                                    {...register('username', { required: true, minLength: 3 })}
                                />
                                {errors.username && <span className="text-red-500 text-xs">{t('register.usernameError')}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">{t('register.email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={t('register.emailPlaceholder')}
                                    {...register('email', { required: true })}
                                />
                                {errors.email && <span className="text-red-500 text-xs">{t('register.emailError')}</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">{t('register.password')}</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder={t('register.passwordPlaceholder')}
                                    {...register('password', { required: true, minLength: 6 })}
                                />
                                {errors.password && <span className="text-red-500 text-xs">{t('register.passwordError')}</span>}
                            </div>
                            {serverError && <p className="text-red-500 text-sm text-center">{serverError}</p>}
                        </div>
                        <Button className="w-full mt-6" type="submit" disabled={isLoading}>
                            {isLoading ? t('register.creating') : t('register.registerButton')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        {t('register.hasAccount')} <Link to="/login" className="text-primary hover:underline">{t('register.login')}</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RegisterPage;
