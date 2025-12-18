
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserIcon, Stethoscope, Building2 } from 'lucide-react';

export default function RoleSelectionForm({ user, onRoleSelect }) {
    const [selectedRole, setSelectedRole] = useState(null);

    const handleSubmit = () => {
        if (selectedRole) {
            onRoleSelect(selectedRole);
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFAFF] flex items-center justify-center p-6" dir="rtl">
            <Card className="w-full max-w-2xl bg-white rounded-xl shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-[#5932EA] rounded-full flex items-center justify-center mb-4">
                        <UserIcon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        שלום {user?.full_name}! 👋
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                        כדי להמשיך, אנא בחר את התפקיד שלך במערכת
                    </p>
                </CardHeader>
                
                <CardContent className="pt-4">
                    <div className="space-y-4 mb-8">
                        {/* מטופל */}
                        <div 
                            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedRole === 'patient' 
                                    ? 'border-[#5932EA] bg-purple-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedRole('patient')}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    selectedRole === 'patient' ? 'bg-[#5932EA] text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <UserIcon className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-bold text-gray-800">אני מטופל/ת</h3>
                                    <p className="text-sm text-gray-600">אני מחפש/ת שירותי רפואה ויעוץ רפואי</p>
                                </div>
                            </div>
                        </div>

                        {/* רופא */}
                        <div 
                            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedRole === 'doctor' 
                                    ? 'border-[#5932EA] bg-purple-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedRole('doctor')}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    selectedRole === 'doctor' ? 'bg-[#5932EA] text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <Stethoscope className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-bold text-gray-800">אני רופא/ה</h3>
                                    <p className="text-sm text-gray-600">אני רופא/ה רשוי/ה ומעוניין/ת להצטרף למערכת</p>
                                </div>
                            </div>
                        </div>

                        {/* מרפאה */}
                        <div 
                            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedRole === 'clinic' 
                                    ? 'border-[#5932EA] bg-purple-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedRole('clinic')}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    selectedRole === 'clinic' ? 'bg-[#5932EA] text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-bold text-gray-800">אני מנהל/ת מרפאה</h3>
                                    <p className="text-sm text-gray-600">אני מייצג/ת מרפאה ומעוניין/ת בשותפות</p>
                                </div>
                            </div>
                        </div>

                        {/* משרד - אפשרות חדשה */}
                        <div 
                            className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedRole === 'office' 
                                    ? 'border-[#5932EA] bg-purple-50' 
                                    : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setSelectedRole('office')}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                                    selectedRole === 'office' ? 'bg-[#5932EA] text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-lg font-bold text-gray-800">אני עובד/ת משרד</h3>
                                    <p className="text-sm text-gray-600">אני חלק מצוות המשרד ומטפל/ת בתהליכים תפעוליים</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Button 
                        onClick={handleSubmit}
                        disabled={!selectedRole}
                        className="w-full bg-[#5932EA] hover:bg-[#4a29c1] text-white font-bold py-3 text-lg"
                    >
                        המשך
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
