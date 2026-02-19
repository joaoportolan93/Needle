import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';

const RegisterPage = () => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [serverError, setServerError] = useState('');

    const onSubmit = async (data) => {
        setIsLoading(true);
        setServerError('');
        try {
            await registerUser({
                username: data.username,
                email: data.email,
                password: data.password
            });
            // Auto login or redirect to login? Requirement says redirect to login.
            navigate('/login');
        } catch (error) {
            setServerError('Registration failed. Username or email might be taken.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Create an Account</CardTitle>
                    <CardDescription>Join the community to review albums.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Choose a username"
                                    {...register('username', { required: true, minLength: 3 })}
                                />
                                {errors.username && <span className="text-red-500 text-xs">Username must be at least 3 chars</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="your@email.com"
                                    {...register('email', { required: true })}
                                />
                                {errors.email && <span className="text-red-500 text-xs">Valid email is required</span>}
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password"
                                    {...register('password', { required: true, minLength: 6 })}
                                />
                                {errors.password && <span className="text-red-500 text-xs">Password must be at least 6 chars</span>}
                            </div>
                            {serverError && <p className="text-red-500 text-sm text-center">{serverError}</p>}
                        </div>
                        <Button className="w-full mt-6" type="submit" disabled={isLoading}>
                            {isLoading ? 'Creating account...' : 'Register'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default RegisterPage;
