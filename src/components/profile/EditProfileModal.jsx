
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/entities/User';
import { Upload } from 'lucide-react';
import { UploadFile } from '@/integrations/Core';

export default function EditProfileModal({ user, isOpen, onClose, onProfileUpdate }) {
    const [formData, setFormData] = useState({
        display_name: '', // Changed from full_name to display_name
        phone: '',
        address: '',
        birth_date: '',
        insurance_provider: 'כללית',
        avatar: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                display_name: user.display_name || user.full_name || '', // Prioritize display_name, fallback to full_name
                phone: user.phone || '',
                address: user.address || '',
                birth_date: user.birth_date || '',
                insurance_provider: user.insurance_provider || 'כללית',
                avatar: user.avatar || ''
            });
        }
    }, [user, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            // Update with display_name instead of full_name
            await User.updateMyUserData({
                display_name: formData.display_name, // Update display_name
                phone: formData.phone,
                address: formData.address,
                birth_date: formData.birth_date,
                insurance_provider: formData.insurance_provider,
                avatar: formData.avatar
            });
            onProfileUpdate();
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('אירעה שגיאה בעדכון הפרטים');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const { file_url } = await UploadFile({ file });
            setFormData(prev => ({ ...prev, avatar: file_url }));
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('אירעה שגיאה בהעלאת התמונה');
        } finally {
            setUploadingAvatar(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="max-w-md mx-auto">
                <DialogHeader>
                    {/* תיקון: הסרת כפתור הסגירה הנוסף וישור הכותרת ימינה */}
                    <DialogTitle className="text-right pr-4">עריכת פרטים אישיים</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 text-right" dir="rtl">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <img
                                src={formData.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/03e9ff525_6d1f028bc30367a84e0b1efd8a8742d7e99fd62a.png"}
                                alt="תמונת פרופיל"
                                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                            />
                            <label className="absolute bottom-0 right-0 bg-[#5932EA] text-white p-1 rounded-full cursor-pointer hover:bg-[#4a29c1]">
                                <Upload className="w-3 h-3" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                    disabled={uploadingAvatar}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="text-right">
                        <Label htmlFor="display_name" className="text-right">שם מלא</Label>
                        <Input
                            id="display_name"
                            value={formData.display_name}
                            onChange={(e) => setFormData(prev => ({...prev, display_name: e.target.value}))}
                            className="mt-1 text-right"
                            dir="rtl"
                            placeholder="השם שיוצג במערכת"
                        />
                    </div>

                    <div className="text-right">
                        <Label htmlFor="phone" className="text-right">מספר טלפון</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                            className="mt-1 text-right"
                            dir="rtl"
                        />
                    </div>

                    <div className="text-right">
                        <Label htmlFor="address" className="text-right">כתובת</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                            className="mt-1 text-right"
                            dir="rtl"
                        />
                    </div>

                    <div className="text-right">
                        <Label htmlFor="birth_date" className="text-right">תאריך לידה</Label>
                        <Input
                            id="birth_date"
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => setFormData(prev => ({...prev, birth_date: e.target.value}))}
                            className="mt-1 text-right"
                            dir="rtl"
                        />
                    </div>

                    <div className="text-right">
                        <Label className="text-right">קופת חולים</Label>
                        <Select 
                            value={formData.insurance_provider} 
                            onValueChange={(value) => setFormData(prev => ({...prev, insurance_provider: value}))}
                            dir="rtl"
                        >
                            <SelectTrigger className="mt-1 text-right" dir="rtl">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent dir="rtl">
                                <SelectItem value="כללית">כללית</SelectItem>
                                <SelectItem value="מכבי">מכבי</SelectItem>
                                <SelectItem value="מאוחדת">מאוחדת</SelectItem>
                                <SelectItem value="לאומית">לאומית</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex gap-3 pt-4 justify-end">
                        <Button type="button" variant="outline" onClick={onClose}>
                            ביטול
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading || uploadingAvatar}
                            className="bg-[#5932EA] hover:bg-[#4a29c1]"
                        >
                            {isLoading ? 'שומר...' : 'שמור שינויים'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
