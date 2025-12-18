
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { User } from '@/entities/User';
import { Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

const availableLanguages = [
    { value: 'עברית', label: 'עברית' },
    { value: 'אנגלית', label: 'אנגלית' },
    { value: 'רוסית', label: 'רוסית' },
    { value: 'ערבית', label: 'ערבית' },
    { value: 'צרפתית', label: 'צרפתית' },
    { value: 'ספרדית', label: 'ספרדית' },
    { value: 'אמהרית', label: 'אמהרית' },
];

export default function EditProfessionalInfoModal({ user, isOpen, onClose, onProfileUpdate }) {
    const [formData, setFormData] = useState({
        years_of_experience: '',
        education: '',
        bio: '',
        languages: [],
        consultation_fee: '',
        accepts_insurance: true
    });
    
    const [openLanguagePopover, setOpenLanguagePopover] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                years_of_experience: user.years_of_experience || '',
                education: user.education || '',
                bio: user.bio || '',
                languages: user.languages || [],
                consultation_fee: user.consultation_fee || '',
                accepts_insurance: user.accepts_insurance !== undefined ? user.accepts_insurance : true
            });
        }
    }, [user, isOpen]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const fee = parseInt(formData.consultation_fee);
        if (isNaN(fee) || fee < 10) {
            setError('⚠️ עלות הייעוץ חייבת להיות לפחות 10 ש"ח.');
            setIsLoading(false);
            return;
        }

        try {
            const dataToUpdate = {
                education: formData.education,
                bio: formData.bio,
                languages: formData.languages,
                years_of_experience: formData.years_of_experience !== '' ? parseInt(formData.years_of_experience) : null,
                consultation_fee: fee,
                accepts_insurance: formData.accepts_insurance,
            };

            if (dataToUpdate.years_of_experience === null) delete dataToUpdate.years_of_experience;

            console.log('Updating user data:', dataToUpdate);

            // Check if we're in impersonation mode
            const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
            if (impersonatedUserId) {
                // If impersonating, update the impersonated user directly
                await User.update(impersonatedUserId, dataToUpdate);
            } else {
                // If not impersonating, use updateMyUserData
                await User.updateMyUserData(dataToUpdate);
            }

            console.log('Update successful');
            
            // This will trigger the page reload defined in DoctorProfile.js
            onProfileUpdate();

        } catch (err) {
            console.error('Error updating professional info:', err);
            setError('אירעה שגיאה בעדכון המידע המקצועי.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
                <DialogHeader>
                    <DialogTitle className="text-right">עריכת מידע מקצועי</DialogTitle>
                </DialogHeader>

                <form id="professional-info-form" onSubmit={handleSave} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                        <div className="text-right">
                            <Label htmlFor="years_of_experience" className="text-right">שנות ניסיון</Label>
                            <Input 
                                id="years_of_experience" 
                                type="number" 
                                value={formData.years_of_experience} 
                                onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value })} 
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                        <div className="text-right">
                            <Label htmlFor="consultation_fee" className="text-right">עלות ייעוץ (₪) *</Label>
                            <Input 
                                id="consultation_fee" 
                                type="number" 
                                min="10" 
                                value={formData.consultation_fee} 
                                onChange={(e) => setFormData({...formData, consultation_fee: parseInt(e.target.value) || ''})} 
                                placeholder="מינימום 10 ש״ח" 
                                required 
                                className="text-right"
                                dir="rtl"
                            />
                        </div>
                    </div>
                    <div className="space-y-2 text-right">
                        <Label htmlFor="education" className="text-right">השכלה</Label>
                        <Textarea 
                            id="education" 
                            placeholder="טכניון - הפקולטה לרפואה..." 
                            value={formData.education} 
                            onChange={(e) => setFormData({ ...formData, education: e.target.value })} 
                            className="text-right"
                            dir="rtl"
                        />
                    </div>
                    <div className="space-y-2 text-right">
                         <Label className="text-right">שפות</Label>
                        <Popover open={openLanguagePopover} onOpenChange={setOpenLanguagePopover}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" className="w-full justify-between font-normal text-right" dir="rtl">
                                    <span className="truncate text-right">
                                        {formData.languages.length > 0 ? formData.languages.join(', ') : "בחר שפות..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="חיפוש שפה..." />
                                    <CommandList>
                                        <CommandEmpty>לא נמצאה שפה.</CommandEmpty>
                                        <CommandGroup>
                                            {availableLanguages.map((lang) => (
                                                <CommandItem key={lang.value} value={lang.value} onSelect={() => {
                                                    const selected = formData.languages.includes(lang.label);
                                                    const newLanguages = selected
                                                        ? formData.languages.filter(l => l !== lang.label)
                                                        : [...formData.languages, lang.label];
                                                    setFormData(prev => ({...prev, languages: newLanguages}));
                                                }}>
                                                    <Check className={`ml-2 h-4 w-4 ${formData.languages.includes(lang.label) ? "opacity-100" : "opacity-0"}`} />
                                                    {lang.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2 text-right">
                        <Label htmlFor="bio" className="text-right">אודות (קצר)</Label>
                        <Textarea 
                            id="bio" 
                            placeholder="ספר/י קצת על עצמך ועל המומחיות שלך..." 
                            value={formData.bio} 
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                            className="text-right"
                            dir="rtl"
                        />
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse justify-end">
                        <Label htmlFor="accepts_insurance" className="text-right">מקבל ביטוח</Label>
                        <Checkbox 
                            id="accepts_insurance" 
                            checked={formData.accepts_insurance} 
                            onCheckedChange={(checked) => setFormData({ ...formData, accepts_insurance: checked })} 
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm text-right">{error}</p>}
                    <DialogFooter dir="rtl">
                        <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
                        <Button type="submit" form="professional-info-form" disabled={isLoading}>
                            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            שמור שינויים
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
