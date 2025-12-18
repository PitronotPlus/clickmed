
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Phone, CreditCard } from 'lucide-react'; // Removed Calendar and Building as they are not used in the final code

export default function RegisterForm() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        idNumber: '',
        phone: '',
        insuranceProvider: '',
        birthDate: { day: '', month: '', year: '' },
        agreeToTerms: false,
        agreeToMarketing: false
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Attempting to register...", formData);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleBirthDateChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            birthDate: { ...prev.birthDate, [field]: value }
        }));
    };

    return (
        <Card className="w-full max-w-5xl mx-auto mt-12 p-8 bg-white rounded-xl shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
            <div className="flex items-center justify-center">
                <div className="w-full max-w-2xl">
                    <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">דף הרשמה למטופל חדש</h2>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {/* שם פרטי */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="שם פרטי"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                        className="pl-12 text-right h-12 rounded-md border-gray-300"
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-xs text-red-500 mt-1">שדה חובה</span>
                            </div>
                            
                            {/* שם משפחה */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="שם משפחה"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                        className="pl-12 text-right h-12 rounded-md border-gray-300"
                                    />
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-xs text-red-500 mt-1">שדה חובה</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* אימייל */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="email"
                                        placeholder="אימייל"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="pl-12 text-right h-12 rounded-md border-gray-300"
                                    />
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-xs text-red-500 mt-1">שדה חובה</span>
                            </div>
                            
                            {/* תעודת זהות */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        placeholder="תעודת זהות"
                                        value={formData.idNumber}
                                        onChange={(e) => handleInputChange('idNumber', e.target.value)}
                                        className="pl-12 text-right h-12 rounded-md border-gray-300"
                                    />
                                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-xs text-red-500 mt-1">שדה חובה</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* מספר נייד */}
                            <div>
                                <div className="relative">
                                    <Input
                                        type="tel"
                                        placeholder="מספר נייד"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className="pl-12 text-right h-12 rounded-md border-gray-300"
                                    />
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                </div>
                                <span className="text-xs text-red-500 mt-1">שדה חובה</span>
                            </div>
                            
                            {/* מוסד מבטח */}
                            <div>
                                <div className="relative">
                                    <Select onValueChange={(value) => handleInputChange('insuranceProvider', value)}>
                                        <SelectTrigger className="h-12 text-right">
                                            <SelectValue placeholder="מוסד מבטח" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="clalit">כללית</SelectItem>
                                            <SelectItem value="maccabi">מכבי</SelectItem>
                                            <SelectItem value="meuhedet">מאוחדת</SelectItem>
                                            <SelectItem value="leumit">לאומית</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <span className="text-xs text-red-500 mt-1">שדה חובה</span>
                            </div>
                        </div>

                        {/* תאריך לידה */}
                        <div>
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="יום"
                                    value={formData.birthDate.day}
                                    onChange={(e) => handleBirthDateChange('day', e.target.value)}
                                    className="text-center h-12 rounded-md border-gray-300 flex-1"
                                    maxLength={2}
                                />
                                <Input
                                    type="text"
                                    placeholder="חודש"
                                    value={formData.birthDate.month}
                                    onChange={(e) => handleBirthDateChange('month', e.target.value)}
                                    className="text-center h-12 rounded-md border-gray-300 flex-1"
                                    maxLength={2}
                                />
                                <Input
                                    type="text"
                                    placeholder="שנה"
                                    value={formData.birthDate.year}
                                    onChange={(e) => handleBirthDateChange('year', e.target.value)}
                                    className="text-center h-12 rounded-md border-gray-300 flex-1"
                                    maxLength={4}
                                />
                            </div>
                            <span className="text-xs text-red-500 mt-1">יש לבחור תאריך מלידה</span>
                        </div>

                        {/* תיבות סימון */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Checkbox 
                                    id="terms"
                                    checked={formData.agreeToTerms}
                                    onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                                />
                                <label htmlFor="terms" className="text-sm text-gray-700 leading-relaxed">
                                    קראתי ואני מאשר/ת את תנאי השימוש ואת מדיניות הפרטיות במערכת
                                </label>
                            </div>
                            <div className="text-xs text-red-500 mr-6">
                                חובה לאשר את תנאי השימוש ומדיניות הפרטיות כדי להמשיך
                            </div>
                            
                            <div className="flex items-start gap-3">
                                <Checkbox 
                                    id="marketing"
                                    checked={formData.agreeToMarketing}
                                    onCheckedChange={(checked) => handleInputChange('agreeToMarketing', checked)}
                                />
                                <label htmlFor="marketing" className="text-sm text-gray-700 leading-relaxed">
                                    אני רוצה לקבל מידע שיווקי, ונותן/ת את הסכמתי לקבל דיוור
                                </label>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-14 bg-[#1ABC9C] hover:bg-[#16a085] text-white text-lg font-bold rounded-lg mt-8"
                        >
                            צור חשבון
                        </Button>
                    </form>
                </div>
            </div>
        </Card>
    );
}
