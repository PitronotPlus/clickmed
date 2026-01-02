import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { User } from '@/entities/User';
import { ReferralClick } from '@/entities/ReferralClick';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";


// פונקציית עזר להצבת קוקי
function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

// פונקציית עזר לקריאת קוקי
function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

export default function RegisterPage() {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('login');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // נתוני התחברות
    const [loginData, setLoginData] = useState({
        email: '',
        password: ''
    });
    
    // נתוני הרשמה
    const [registerData, setRegisterData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // If accessed directly (not from a button click), redirect to Home
        const urlParams = new URLSearchParams(window.location.search);
        const fromPage = urlParams.get('from');
        
        // Only show Register if explicitly requested
        if (!fromPage) {
            window.location.href = createPageUrl('Home');
            return;
        }

        const refCode = urlParams.get('ref');
        if (refCode) {
            // שמירת קוד הפניה בקוקי ל-30 יום
            setCookie('referral_code', refCode, 30);
            
            // רישום קליק על הקישור
            ReferralClick.create({
                clinic_id: refCode,
                ip_address: 'not-collected', // בפרודקשן נאסוף IP אמיתי
                user_agent: navigator.userAgent
            }).catch(error => console.error("Could not log referral click:", error));
        }
    }, []);

    const handleGoogleLogin = () => {
        try {
            // בדיקה אם יש קוד הפניה שמור
            const referralCode = getCookie('referral_code');
            
            if (referralCode) {
                // שמירת הקוד לאחר ההתחברות
                setCookie('pending_referral', referralCode, 1); // יום אחד
            }
            
            // Base44 built-in login redirect with Google
            base44.auth.redirectToLogin(createPageUrl('Dashboard') + '?is_new_user=true&provider=google');
        } catch (error) {
            console.error("Google login failed:", error);
            alert("אירעה שגיאה בתהליך ההתחברות עם Google. נסה שוב.");
        }
    };

    const validateLoginForm = () => {
        const newErrors = {};
        
        if (!loginData.email) {
            newErrors.email = 'נדרש כתובת אימייל';
        } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
            newErrors.email = 'כתובת אימייל לא תקינה';
        }
        
        if (!loginData.password) {
            newErrors.password = 'נדרשת סיסמה';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateRegisterForm = () => {
        const newErrors = {};
        
        if (!registerData.full_name) {
            newErrors.full_name = 'נדרש שם מלא';
        }
        
        if (!registerData.email) {
            newErrors.email = 'נדרש כתובת אימייל';
        } else if (!/\S+@\S+\.\S+/.test(registerData.email)) {
            newErrors.email = 'כתובת אימייל לא תקינה';
        }
        
        if (!registerData.password) {
            newErrors.password = 'נדרשת סיסמה';
        } else if (registerData.password.length < 6) {
            newErrors.password = 'סיסמה חייבת להכיל לפחות 6 תווים';
        }
        
        if (!registerData.confirmPassword) {
            newErrors.confirmPassword = 'נדרש אימות סיסמה';
        } else if (registerData.password !== registerData.confirmPassword) {
            newErrors.confirmPassword = 'הסיסמאות אינן תואמות';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validateLoginForm()) return;
        
        setLoading(true);
        setErrors({});
        try {
            await User.login({ 
                email: loginData.email, 
                password: loginData.password 
            });
            // The layout component should handle redirection after successful login.
            window.location.href = createPageUrl('Dashboard');
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 'שם משתמש או סיסמה שגויים. נסה שוב.';
            setErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!validateRegisterForm()) return;
        
        setLoading(true);
        setErrors({});
        try {
            const referralCode = getCookie('referral_code');
            const registrationPayload = {
                full_name: registerData.full_name,
                email: registerData.email,
                password: registerData.password,
                user_type: '', // נתחיל בלי user_type כדי לאלץ בחירת תפקיד
                status: 'pending'
            };

            if (referralCode) {
                registrationPayload.referred_by_clinic_id = referralCode;
                // שמירת הקוד לאחר ההתחברות
                setCookie('pending_referral', referralCode, 1); // יום אחד
            }

            // יצירת המשתמש
            await User.create(registrationPayload);
            
            // התחברות אוטומטית אחרי הרשמה מצליחה
            await User.login({ 
                email: registerData.email, 
                password: registerData.password 
            });
            
            // הפניה לדשבורד עם סימון שזה משתמש חדש
            window.location.href = createPageUrl('Dashboard') + '?is_new_user=true';
            
        } catch (error) {
            console.error('Registration error:', error);
            const errorMessage = error.response?.data?.message || 'אירעה שגיאה בהרשמה. ייתכן שהאימייל כבר קיים.';
            setErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    const onTabChange = (tab) => {
        setActiveTab(tab);
        setErrors({}); // Clear errors when switching tabs
    }

    return (
        <div dir="rtl" className="min-h-screen bg-[#FBFAFF]">
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap');
              body, html, * {
                font-family: 'Open Sans', sans-serif !important;
              }
            `}</style>

            <div className="absolute top-0 left-0 w-full h-[130px] bg-white flex items-center justify-start px-8" style={{ boxShadow: '0px 10px 60px rgba(226, 236, 249, 0.5)' }}>
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8bfb54141_CLICKMEDLOGO.png" alt="Clickmed 360" className="h-[75px]" />
            </div>

            <div className="pt-[130px] py-12 px-8 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 130px)' }}>
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            <span className="inline-block">👋</span> ברוכים הבאים
                        </h1>
                        <p className="text-xl text-gray-600 font-medium">
                            הגעתם למערכת <span className="font-bold">Clickmed 360</span>
                        </p>
                        <p className="text-lg text-gray-500 mt-2">
                            שירותי רפואה פרטית בקליק
                        </p>
                    </div>

                    <Card className="bg-white/90 rounded-xl shadow-lg border-0">
                        <CardHeader className="text-center pb-4">
                            <CardTitle className="text-2xl font-bold text-gray-800">
                                כניסה למערכת
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="login">התחברות</TabsTrigger>
                                    <TabsTrigger value="register">הרשמה</TabsTrigger>
                                </TabsList>

                                <TabsContent value="login" className="space-y-4">
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div>
                                            <Label htmlFor="login-email" className="text-right">אימייל</Label>
                                            <div className="relative">
                                                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="login-email"
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData(prev => ({...prev, email: e.target.value}))}
                                                    className="pr-10 text-right"
                                                    dir="rtl"
                                                />
                                            </div>
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="login-password" className="text-right">סיסמה</Label>
                                            <div className="relative">
                                                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="login-password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="סיסמה"
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData(prev => ({...prev, password: e.target.value}))}
                                                    className="pr-10 pl-10 text-right"
                                                    dir="rtl"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                        </div>

                                        <div className="text-left">
                                            <button
                                                type="button"
                                                onClick={() => alert('נא לפנות לתמיכה במייל: support@clickmed360.com')}
                                                className="text-sm text-[#5932EA] hover:underline"
                                            >
                                                שכחתי את הסיסמה
                                            </button>
                                        </div>
                                        
                                        {errors.submit && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{errors.submit}</AlertDescription>
                                            </Alert>
                                        )}

                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-[#5932EA] hover:bg-[#4a29c1] text-white font-semibold py-3"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    מתחבר...
                                                </>
                                            ) : (
                                                'התחבר'
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>

                                <TabsContent value="register" className="space-y-4">
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        <div>
                                            <Label htmlFor="register-name" className="text-right">שם מלא</Label>
                                            <div className="relative">
                                                <UserIcon className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="register-name"
                                                    type="text"
                                                    placeholder="שם מלא"
                                                    value={registerData.full_name}
                                                    onChange={(e) => setRegisterData(prev => ({...prev, full_name: e.target.value}))}
                                                    className="pr-10 text-right"
                                                    dir="rtl"
                                                />
                                            </div>
                                            {errors.full_name && <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="register-email" className="text-right">אימייל</Label>
                                            <div className="relative">
                                                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="register-email"
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    value={registerData.email}
                                                    onChange={(e) => setRegisterData(prev => ({...prev, email: e.target.value}))}
                                                    className="pr-10 text-right"
                                                    dir="rtl"
                                                />
                                            </div>
                                            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="register-password" className="text-right">סיסמה</Label>
                                            <div className="relative">
                                                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="register-password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="סיסמה (לפחות 6 תווים)"
                                                    value={registerData.password}
                                                    onChange={(e) => setRegisterData(prev => ({...prev, password: e.target.value}))}
                                                    className="pr-10 pl-10 text-right"
                                                    dir="rtl"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="register-confirm-password" className="text-right">אימות סיסמה</Label>
                                            <div className="relative">
                                                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                                                <Input
                                                    id="register-confirm-password"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="אמת את הסיסמה"
                                                    value={registerData.confirmPassword}
                                                    onChange={(e) => setRegisterData(prev => ({...prev, confirmPassword: e.target.value}))}
                                                    className="pr-10 pl-10 text-right"
                                                    dir="rtl"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                                        </div>

                                        {errors.submit && (
                                            <Alert variant="destructive">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{errors.submit}</AlertDescription>
                                            </Alert>
                                        )}

                                        <Button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full bg-[#5932EA] hover:bg-[#4a29c1] text-white font-semibold py-3"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    נרשם...
                                                </>
                                            ) : (
                                                'הרשם'
                                            )}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </Tabs>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">או</span>
                                </div>
                            </div>

                            <Button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                variant="outline"
                                className="w-full py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        מעביר להתחברות...
                                    </>
                                ) : (
                                    <>
                                        <svg className="ml-2 h-4 w-4" viewBox="0 0 24 24">
                                            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                        </svg>
                                        התחבר עם Google
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}