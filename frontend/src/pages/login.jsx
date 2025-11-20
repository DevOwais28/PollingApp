import { Button } from "@/components/ui/button"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Link } from "react-router-dom"
import * as Yup from "yup";
import { useFormik } from "formik";
import { toast } from "sonner";
import { apiRequest } from "../api";
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import useAppStore from "@/store"
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { BarChart3, Sparkles } from 'lucide-react';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate()
    const { setToken, token ,setUser ,user} = useAppStore()
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };
    const initialValues = {
        email: "",
        password: "",
    };
    const loginSchema = Yup.object().shape({
        email: Yup.string().email("Invalid email").required("Email is required"),
        password: Yup.string()
            .min(6, "Password Cannot be less than 6 characters")
            .required("Password is required")
    });

    const formik = useFormik({
        initialValues: initialValues,
        validationSchema: loginSchema,
        onSubmit: async (values) => {
            setLoading(true);
            try {
                const data = {
                    email: values?.email,
                    password: values?.password,
                }
                const response = await apiRequest('POST', 'users/login', data);
                if (response?.data) {
                    setToken(response?.data.token);
                    setUser(response?.data.userobj);
                    localStorage.setItem('token', response?.data.token);
                    localStorage.setItem('user', JSON.stringify(response?.data.userobj));
                    toast.success('Successfully logged in');
                    navigate('/feed');
                    formik.resetForm();
                }
            } catch (error) {
                toast(error.message);
            } finally {
                setLoading(false);
            }
        },
    });

    async function continueWithGoogle() {
        // This will be handled by the AuthCallback component
        window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/google`;
    }

    // Google OAuth handling is now in AuthCallback component
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <BarChart3 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                WePollin
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/signup" className="text-gray-700 hover:text-blue-600">
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Login Section */}
            <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto">
                    <div className="text-center mb-8">
                        <div className="mb-4">
                            <span className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
                                <Sparkles className="w-4 h-4 mr-2" />
                                Welcome Back
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Sign in to your account
                        </h1>
                        <p className="text-gray-600">
                            Continue creating amazing polls and engaging your audience
                        </p>
                    </div>

                    <Card className="w-full bg-white/90 backdrop-blur-sm border-gray-200 shadow-xl">
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">Welcome back</CardTitle>
                            <CardDescription>
                                Log in to access your polls and join the WePollin community
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form>
                                <div className="flex flex-col gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            placeholder="m@example.com"
                                            value={formik.values.email}
                                            onChange={formik.handleChange}
                                            required
                                            className="bg-white/50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                        {formik.errors.email && formik.touched.email && (
                                            <span className="text-red-500 text-sm">
                                                {formik.errors.email}
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid gap-2 relative">
                                        <Label htmlFor="password">Password</Label>
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            placeholder="Enter your password"
                                            value={formik.values.password}
                                            onChange={formik.handleChange}
                                            required
                                            className="bg-white/50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                        />
                                        <span
                                            onClick={togglePasswordVisibility}
                                            className="absolute right-3 top-9 -translate-y-1/2 cursor-pointer text-gray-500 hover:text-blue-600"
                                        >
                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                        </span>
                                        {formik.errors.password && formik.touched.password && (
                                            <span className="text-red-500 text-sm">
                                                {formik.errors.password}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <Link to="/signup" className="text-sm text-blue-600 hover:text-blue-700">
                                            Don't have an account?
                                        </Link>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex-col gap-3">
                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" 
                                onClick={() => formik.submitForm()}
                                disabled={loading}
                            >
                                {loading ? "Signing in..." : "Sign in"}
                            </Button>
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-gray-300" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                className="w-full border-gray-300 hover:border-blue-600 hover:text-blue-600" 
                                onClick={() => continueWithGoogle()}
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continue with Google
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </section>
        </div>
    )
}
