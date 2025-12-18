import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { AlertCircle, User as UserIcon } from 'lucide-react';

export default function ProfileCompletionForm({ user, onComplete }) {
    const [formData, setFormData] = useState({
        id_number: '',
        phone: '',
        address: '',
        birth_date: '',
        insurance_provider: 'כללית'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.id_number || formData.id_number.length !== 9) {
            newErrors.id_number = 'נדרש מספר תעודת זהות תקין (9 ספרות)';
        }
        
        if (!formData.phone || formData.phone.length < 9) {
            newErrors.phone = 'נדרש מספר טלפון תקין';
        }
        
        if (!formData.address) {
            newErrors.address = 'נדרשת כתובת';
        }
        
        if (!formData.birth_date) {
            newErrors.birth_date = 'נדרש תאריך לידה';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        setIsLoading(true);
        try {
            await User.updateMyUserData({
                ...formData,
                tags: ['חדש'], // תגית למשתמש חדש
                status: 'active'
            });
            
            onComplete();
            window.location.href = createPageUrl('Dashboard');
        } catch (error) {
            console.error('Error completing profile:', error);
            setErrors({ submit: 'אירעה שגיאה בשמירת הפרטים. אנא נסה שוב.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <div className="min-h-screen bg-[#FBFAFF] flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl bg-white rounded-xl shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-[#5932EA] rounded-full flex items-center justify-center mb-4">
                        <UserIcon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        שלום {user?.full_name}! 👋
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                        כדי להשלים את הרשמתך למערכת, אנא מלא את הפרטים הנדרשים
                    </p>
                </CardHeader>
                
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* תעודת זהות */}
                        <div className="space-y-2">
                            <Label htmlFor="id_number" className="text-right block font-medium">
                                תעודת זהות *
                            </Label>
                            <Input
                                id="id_number"
                                type="text"
                                placeholder="123456789"
                                value={formData.id_number}
                                onChange={(e) => handleInputChange('id_number', e.target.value)}
                                className={`text-right ${errors.id_number ? 'border-red-500' : ''}`}
                                maxLength="9"
                                dir="rtl"
                            />
                            {errors.id_number && (
                                <p className="text-red-500 text-sm text-right flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.id_number}
                                </p>
                            )}
                        </div>

                        {/* טלפון */}
                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-right block font-medium">
                                מספר טלפון *
                            </Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="050-1234567"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className={`text-right ${errors.phone ? 'border-red-500' : ''}`}
                                dir="rtl"
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-sm text-right flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.phone}
                                </p>
                            )}
                        </div>

                        {/* כתובת */}
                        <div className="space-y-2">
                            <Label htmlFor="address" className="text-right block font-medium">
                                כתובת מגורים *
                            </Label>
                            <Input
                                id="address"
                                type="text"
                                placeholder="רחוב דוגמה 123, תל אביב"
                                value={formData.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                className={`text-right ${errors.address ? 'border-red-500' : ''}`}
                                dir="rtl"
                            />
                            {errors.address && (
                                <p className="text-red-500 text-sm text-right flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.address}
                                </p>
                            )}
                        </div>

                        {/* תאריך לידה */}
                        <div className="space-y-2">
                            <Label htmlFor="birth_date" className="text-right block font-medium">
                                תאריך לידה *
                            </Label>
                            <Input
                                id="birth_date"
                                type="date"
                                value={formData.birth_date}
                                onChange={(e) => handleInputChange('birth_date', e.target.value)}
                                className={`text-right ${errors.birth_date ? 'border-red-500' : ''}`}
                            />
                            {errors.birth_date && (
                                <p className="text-red-500 text-sm text-right flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.birth_date}
                                </p>
                            )}
                        </div>

                        {/* קופת חולים */}
                        <div className="space-y-2">
                            <Label className="text-right block font-medium">
                                קופת חולים *
                            </Label>
                            <Select value={formData.insurance_provider} onValueChange={(value) => handleInputChange('insurance_provider', value)}>
                                <SelectTrigger className="text-right">
                                    <SelectValue placeholder="בחר קופת חולים" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="כללית">כללית</SelectItem>
                                    <SelectItem value="מכבי">מכבי</SelectItem>
                                    <SelectItem value="מאוחדת">מאוחדת</SelectItem>
                                    <SelectItem value="לאומית">לאומית</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* שגיאת שליחה */}
                        {errors.submit && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-600 text-sm text-right flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.submit}
                                </p>
                            </div>
                        )}

                        {/* כפתור שליחה */}
                        <Button 
                            type="submit" 
                            className="w-full bg-[#5932EA] hover:bg-[#4a29c1] text-white font-bold py-3 text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? 'שומר פרטים...' : 'השלם הרשמה והיכנס למערכת'}
                        </Button>
                    </form>
                    
                    <div className="mt-6 text-center text-sm text-gray-500">
                        הפרטים שלך מוגנים ומאובטחים לפי תקנות הפרטיות
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}