import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { User as UserSDK } from '@/entities/User';
import { createPageUrl } from '@/utils';

export default function SocialLoginButtons({ role }) {
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isFacebookLoading, setIsFacebookLoading] = useState(false);
    const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);

    const handleSocialLogin = async (provider) => {
        const setLoading = provider === 'google' ? setIsGoogleLoading : 
                         provider === 'facebook' ? setIsFacebookLoading : 
                         setIsMicrosoftLoading;
        
        setLoading(true);
        try {
            // We can store the selected role in localStorage to be retrieved after redirect
            localStorage.setItem('signup_role', role);
            await UserSDK.loginWithRedirect(window.location.origin + createPageUrl('Dashboard'));
        } catch (error) {
            console.error(`${provider} login failed`, error);
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-5xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
            <div className="flex items-center justify-between gap-16">
                {/* Right side - Login Options */}
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800 text-right mb-2">
                        {role === 'patient' ? 'התחברות מטופל/ת' : 'התחברות רופא/ה או מרפאה'}
                    </h2>
                    <p className="text-gray-600 text-right mb-8">השלב הבא הוא התחברות מהירה דרך אחת מהרשתות החברתיות.</p>
                    
                    <div className="space-y-4">
                        {/* Google Login */}
                        <Button 
                            variant="outline" 
                            className="w-full h-14 text-lg font-bold rounded-lg border-gray-300 text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50"
                            onClick={() => handleSocialLogin('google')}
                            disabled={isGoogleLoading}
                        >
                            <svg className="w-6 h-6" viewBox="0 0 48 48">{/* ... google icon svg ... */}</svg>
                            {isGoogleLoading ? 'מתחבר...' : 'התחבר עם Google'}
                        </Button>

                        {/* Microsoft Login */}
                        <Button 
                            variant="outline" 
                            className="w-full h-14 text-lg font-bold rounded-lg border-gray-300 text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50"
                            onClick={() => handleSocialLogin('microsoft')}
                            disabled={isMicrosoftLoading}
                        >
                            <svg className="w-6 h-6" viewBox="0 0 48 48">{/* ... microsoft icon svg ... */}</svg>
                            {isMicrosoftLoading ? 'מתחבר...' : 'התחבר עם Microsoft'}
                        </Button>

                        {/* Facebook Login */}
                        <Button 
                            variant="outline" 
                            className="w-full h-14 text-lg font-bold rounded-lg border-gray-300 text-gray-700 flex items-center justify-center gap-3 hover:bg-gray-50"
                            onClick={() => handleSocialLogin('facebook')}
                            disabled={isFacebookLoading}
                        >
                            <svg className="w-6 h-6" viewBox="0 0 48 48">{/* ... facebook icon svg ... */}</svg>
                            {isFacebookLoading ? 'מתחבר...' : 'התחבר עם Facebook'}
                        </Button>
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            התחברות לראשונה? המערכת תיצור עבורך חשבון אוטומטית ותעביר אותך להשלמת פרטים.
                        </p>
                    </div>
                </div>
                
                {/* Left side - Image */}
                <div className="flex-shrink-0">
                    <img
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/8f5223e66_Screenshot2025-07-14184921.png"
                        alt="Medical checkup"
                        className="w-[400px] object-contain"
                    />
                </div>
            </div>
        </Card>
    );
}