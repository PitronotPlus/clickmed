import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { User } from '@/entities/User';
import { Specialty } from '@/entities/Specialty';
import { AlertCircle, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function EditDoctorProfileModal({ user, isOpen, onClose, onProfileUpdate }) {
    const [formData, setFormData] = useState({
        display_name: '',
        phone: '',
        license_number: '',
        specialties: [],
    });

    const [availableSpecialties, setAvailableSpecialties] = useState([]);
    const [loadingSpecialties, setLoadingSpecialties] = useState(true);
    const [openSpecialtyPopover, setOpenSpecialtyPopover] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                display_name: user.display_name || '',
                phone: user.phone || '',
                license_number: user.license_number || '',
                specialties: user.specialties || [],
            });
        }

        const fetchSpecialties = async () => {
            if (isOpen) {
                setLoadingSpecialties(true);
                try {
                    const activeSpecialties = await Specialty.filter({ is_active: true });
                    setAvailableSpecialties(activeSpecialties.map(s => ({ value: s.name, label: s.name })));
                } catch (error) {
                    console.error("Failed to load specialties:", error);
                    setErrors(prev => ({ ...prev, specialties: 'שגיאה בטעינת תחומי התמחות' }));
                } finally {
                    setLoadingSpecialties(false);
                }
            }
        };

        fetchSpecialties();
    }, [user, isOpen]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.display_name) newErrors.display_name = 'נדרש שם תצוגה';
        if (!formData.phone || formData.phone.length < 9) newErrors.phone = 'נדרש מספר טלפון תקין';
        if (!formData.license_number) newErrors.license_number = 'נדרש מספר רישיון';
        if (formData.specialties.length === 0) newErrors.specialties = 'יש לבחור לפחות תחום התמחות אחד';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        setErrors({});
        try {
            await User.updateMyUserData(formData);
            onProfileUpdate();
        } catch (error) {
            console.error('Error updating doctor profile:', error);
            setErrors({ submit: 'אירעה שגיאה בעדכון הפרופיל. אנא נסה שוב.' });
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
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>עריכת פרופיל ראשי</DialogTitle>
                    <DialogDescription>עדכן כאן את פרטי הליבה של הפרופיל שלך.</DialogDescription>
                </DialogHeader>
                <form id="edit-main-profile-form" onSubmit={handleSubmit} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <Label htmlFor="display_name">שם תצוגה *</Label>
                        <Input id="display_name" type="text" value={formData.display_name} onChange={(e) => handleInputChange('display_name', e.target.value)} className={`${errors.display_name ? 'border-red-500' : ''}`} />
                        {errors.display_name && <p className="text-red-500 text-sm flex items-center gap-1 mt-1"><AlertCircle className="w-4 h-4" />{errors.display_name}</p>}
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="phone">מספר טלפון *</Label>
                        <Input id="phone" type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={`${errors.phone ? 'border-red-500' : ''}`} />
                        {errors.phone && <p className="text-red-500 text-sm flex items-center gap-1 mt-1"><AlertCircle className="w-4 h-4" />{errors.phone}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="license_number">מספר רישיון *</Label>
                        <Input id="license_number" type="text" value={formData.license_number} onChange={(e) => handleInputChange('license_number', e.target.value)} className={`${errors.license_number ? 'border-red-500' : ''}`} />
                        {errors.license_number && <p className="text-red-500 text-sm flex items-center gap-1 mt-1"><AlertCircle className="w-4 h-4" />{errors.license_number}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>תחומי התמחות *</Label>
                        <Popover open={openSpecialtyPopover} onOpenChange={setOpenSpecialtyPopover}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={openSpecialtyPopover} className={`w-full justify-between font-normal ${errors.specialties ? 'border-red-500' : ''}`}>
                                    <span className="truncate">
                                        {formData.specialties.length > 0 ? formData.specialties.join(', ') : 'בחר התמחויות...'}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="חיפוש התמחות..." />
                                    <CommandList>
                                        {loadingSpecialties ? (
                                            <div className="p-2 text-center text-sm flex items-center justify-center">
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> טוען...
                                            </div>
                                        ) : (
                                            <>
                                                <CommandEmpty>לא נמצאה התמחות.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableSpecialties.map((specialty) => (
                                                        <CommandItem key={specialty.value} value={specialty.value} onSelect={() => {
                                                            const selected = formData.specialties.includes(specialty.label);
                                                            const newSpecialties = selected
                                                                ? formData.specialties.filter(s => s !== specialty.label)
                                                                : [...formData.specialties, specialty.label];
                                                            handleInputChange('specialties', newSpecialties);
                                                        }}>
                                                            <Check className={`ml-2 h-4 w-4 ${formData.specialties.includes(specialty.label) ? 'opacity-100' : 'opacity-0'}`} />
                                                            {specialty.label}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </>
                                        )}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {errors.specialties && <p className="text-red-500 text-sm flex items-center gap-1 mt-1"><AlertCircle className="w-4 h-4" />{errors.specialties}</p>}
                    </div>

                    {errors.submit && (
                        <p className="text-red-500 text-sm text-center">{errors.submit}</p>
                    )}
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
                    <Button type="submit" form="edit-main-profile-form" disabled={isLoading}>
                        {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                        שמור שינויים
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}