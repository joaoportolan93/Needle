import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';

const LoginPage = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerError('');
        try {
            await login(data.email, data.password);
            navigate('/');
        } catch (error) {
            setServerError(error.message || 'Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Enter your credentials to access your account.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    {...register('email', { required: true })}
                                />
                                {errors.email && <span className="text-red-500 text-xs text-left">Email is required</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Your password"
                                    {...register('password', { required: true })}
                                />
                                {errors.password && <span className="text-red-500 text-xs text-left">Password is required</span>}
                            </div>
                            {serverError && <p className="text-red-500 text-sm text-center">{serverError}</p>}
                        </div>
                        <Button className="w-full mt-6" type="submit" disabled={isLoading}>
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default LoginPage;
