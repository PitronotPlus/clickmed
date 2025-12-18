
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { Loader2, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProtectedRoute({ children, requiredRoles }) {
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthorization = async () => {
            try {
                const currentUser = await User.me();
                if (!currentUser) {
                    setIsAuthorized(false);
                } else {
                    // Check if user is an admin (via role or permissions array)
                    if (currentUser.role === 'admin' || currentUser.permissions?.includes('admin')) {
                        setIsAuthorized(true);
                    } else {
                        // Check if user has at least one of the required roles
                        const userPermissions = currentUser.permissions || [];
                        const userRoles = [currentUser.user_type, ...userPermissions];
                        const hasPermission = requiredRoles.some(role => userRoles.includes(role));
                        setIsAuthorized(hasPermission);
                    }
                }
            } catch (error) {
                // User not logged in
                setIsAuthorized(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthorization();
    }, [requiredRoles]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#FBFAFF]">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-[#5932EA] mx-auto mb-4" />
                    <p className="text-lg text-gray-600">מאמת הרשאות...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        // You can redirect or show an access denied message
        // Redirecting is often better UX
        if (typeof window !== 'undefined') {
            window.location.href = createPageUrl('Dashboard');
        }
        
        return (
             <div className="flex items-center justify-center h-screen bg-gray-100 p-4">
                <Card className="w-full max-w-md text-center shadow-lg border-red-500">
                    <CardHeader>
                        <ShieldX className="h-16 w-16 text-red-500 mx-auto" />
                        <CardTitle className="text-2xl text-red-600 mt-4">גישה נדחתה</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-gray-700">אין לך את ההרשאות הנדרשות לצפייה בדף זה.</p>
                        <p className="text-sm text-gray-500 mt-2">מעביר אותך לדף הבית...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return children;
}
