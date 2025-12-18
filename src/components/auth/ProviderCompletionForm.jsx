
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/entities/User';
import { Specialty } from '@/entities/Specialty'; // Import Specialty entity
import { SystemNotification } from '@/entities/SystemNotification'; // Import SystemNotification entity
import { AlertCircle, User as UserIcon, Building2, Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export default function ProviderCompletionForm({ user, onComplete }) {
    const [formData, setFormData] = useState(() => {
        // Different initial state based on user type
        if (user.user_type === 'clinic') {
            return {
                clinic_name: '',
                contact_person: '',
                phone: '',
                address: '',
                clinic_type: 'פרטית',
                specialties: '',
                description: ''
            };
        } else {
            // Doctor form
            return {
                phone: '',
                license_number: '',
                specialties: [], // Changed to array for multi-select
                bio: ''
            };
        }
    });

    const [availableSpecialties, setAvailableSpecialties] = useState([]);
    const [loadingSpecialties, setLoadingSpecialties] = useState(true);
    const [openSpecialtyPopover, setOpenSpecialtyPopover] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        const fetchSpecialties = async () => {
            try {
                // Assuming Specialty.filter returns an array of objects with a 'name' property
                const activeSpecialties = await Specialty.filter({ is_active: true });
                setAvailableSpecialties(activeSpecialties.map(s => ({ value: s.name, label: s.name })));
            } catch (error) {
                console.error("Failed to load specialties:", error);
                setErrors(prev => ({ ...prev, specialties: 'שגיאה בטעינת תחומי התמחות' }));
            } finally {
                setLoadingSpecialties(false);
            }
        };

        if (user.user_type === 'doctor') {
            fetchSpecialties();
        }
    }, [user.user_type]);


    const validateForm = () => {
        const newErrors = {};

        if (user.user_type === 'clinic') {
            if (!formData.clinic_name) newErrors.clinic_name = 'נדרש שם מרפאה';
            if (!formData.contact_person) newErrors.contact_person = 'נדרש שם איש קשר';
            if (!formData.phone || formData.phone.length < 9) newErrors.phone = 'נדרש מספר טלפון תקין';
            if (!formData.address) newErrors.address = 'נדרשת כתובת המרפאה';
            if (!formData.specialties) newErrors.specialties = 'נדרש לפחות תחום טיפול אחד';
        } else {
            // Doctor validation
            if (!formData.phone || formData.phone.length < 9) newErrors.phone = 'נדרש מספר טלפון תקין';
            if (!formData.license_number) newErrors.license_number = 'נדרש מספר רישיון';
            if (formData.specialties.length === 0) newErrors.specialties = 'יש לבחור לפחות תחום התמחות אחד';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const updateData = {
                ...formData,
                user_type: user.user_type, // Keep the original user_type
                status: 'pending' // Account waits for admin approval
            };

            // For clinics, specialties are still a string, need to be split
            if (user.user_type === 'clinic') {
                updateData.specialties = formData.specialties.split(',').map(s => s.trim());
            }
            // For doctors, specialties is already an array, no need to modify

            await User.updateMyUserData(updateData);
            
            // Send notification to all admins about new provider request
            try {
                const allUsers = await User.list();
                const admins = allUsers.filter(u => u.role === 'admin' || u.permissions?.includes('admin'));
                
                const notificationPromises = admins.map(admin => {
                    return SystemNotification.create({
                        user_id: admin.id,
                        title: `בקשת ${user.user_type === 'clinic' ? 'מרפאה' : 'רופא'} חדש לאישור`,
                        message: `${user.full_name} הגיש בקשה להצטרפות כ${user.user_type === 'clinic' ? 'מרפאה שותפה' : 'רופא'}. יש לבדוק ולאשר את הבקשה.`,
                        type: 'admin',
                        priority: 'high'
                    });
                });
                
                await Promise.all(notificationPromises);
            } catch (notificationError) {
                console.error('Failed to send admin notifications:', notificationError);
                // Don't fail the whole process if notifications fail
            }
            
            setIsSubmitted(true);
        } catch (error) {
            console.error('Error submitting provider profile:', error);
            setErrors({ submit: 'אירעה שגיאה בשליחת הפרטים. אנא נסה שוב.' });
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

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-[#FBFAFF] flex items-center justify-center p-6" dir="rtl">
                <Card className="w-full max-w-2xl bg-white rounded-xl shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                    <CardHeader className="text-center">
                         <CardTitle className="text-2xl font-bold text-gray-800">הפרטים נשלחו בהצלחה!</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Alert dir="rtl" className="text-right">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>תודה רבה, {user?.full_name}</AlertTitle>
                            <AlertDescription>
                                {user.user_type === 'clinic' ?
                                    'בקשתך להצטרפות כמרפאה שותפה התקבלה וממתינה לאישור המערכת.' :
                                    'בקשתך להצטרפות כרופא/ה התקבלה וממתינה לאישור המערכת.'
                                }
                                <br />
                                אנו ניצור עמך קשר לאחר אימות הפרטים.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isClinic = user.user_type === 'clinic';

    return (
        <div className="min-h-screen bg-[#FBFAFF] flex items-center justify-center p-6">
            <Card className="w-full max-w-2xl bg-white rounded-xl shadow-[0px_10px_60px_rgba(226,236,249,0.5)]">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-[#5932EA] rounded-full flex items-center justify-center mb-4">
                        {isClinic ? <Building2 className="w-8 h-8 text-white" /> : <UserIcon className="w-8 h-8 text-white" />}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        שלום {user?.full_name}! 👋
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                        {isClinic ?
                            'נא השלם את פרטי המרפאה כדי להגיש בקשת שותפות.' :
                            'נא השלם את פרטיך המקצועיים כדי להגיש בקשת הצטרפות.'
                        }
                    </p>
                </CardHeader>

                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isClinic ? (
                            // Clinic Form Fields
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="clinic_name" className="text-right block font-medium">שם המרפאה *</Label>
                                    <Input
                                        id="clinic_name"
                                        type="text"
                                        placeholder="מרפאת בריאות הצפון"
                                        value={formData.clinic_name}
                                        onChange={(e) => handleInputChange('clinic_name', e.target.value)}
                                        className={`text-right ${errors.clinic_name ? 'border-red-500' : ''}`}
                                        dir="rtl"
                                    />
                                    {errors.clinic_name && <p className="text-red-500 text-sm text-right flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.clinic_name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="contact_person" className="text-right block font-medium">איש קשר *</Label>
                                    <Input
                                        id="contact_person"
                                        type="text"
                                        placeholder="שם מלא של איש הקשר"
                                        value={formData.contact_person}
                                        onChange={(e) => handleInputChange('contact_person', e.target.value)}
                                        className={`text-right ${errors.contact_person ? 'border-red-500' : ''}`}
                                        dir="rtl"
                                    />
                                    {errors.contact_person && <p className="text-red-500 text-sm text-right flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.contact_person}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-right block font-medium">מספר טלפון *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="050-1234567"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={`text-right ${errors.phone ? 'border-red-500' : ''}`}
                                        dir="rtl"
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm text-right flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="address" className="text-right block font-medium">כתובת המרפאה *</Label>
                                    <Input
                                        id="address"
                                        type="text"
                                        placeholder="רחוב הרצל 123, תל אביב"
                                        value={formData.address}
                                        onChange={(e) => handleInputChange('address', e.target.value)}
                                        className={`text-right ${errors.address ? 'border-red-500' : ''}`}
                                        dir="rtl"
                                    />
                                    {errors.address && <p className="text-red-500 text-sm text-right flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.address}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-right block font-medium">סוג מרפאה</Label>
                                    <Select value={formData.clinic_type} onValueChange={(value) => handleInputChange('clinic_type', value)}>
                                        <SelectTrigger className="text-right">
                                            <SelectValue placeholder="בחר סוג מרפאה" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="פרטית">פרטית</SelectItem>
                                            <SelectItem value="ציבורית">ציבורית</SelectItem>
                                            <SelectItem value="קופת חולים">קופת חולים</SelectItem>
                                            <SelectItem value="מרפאת התמחות">מרפאת התמחות</SelectItem>
                                            <SelectItem value="מרכז רפואי">מרכז רפואי</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="specialties" className="text-right block font-medium">תחומי טיפול (מופרדים בפסיק) *</Label>
                                    <Input
                                        id="specialties"
                                        type="text"
                                        placeholder="לדוגמה: רפואת משפחה, פנימית, ילדים"
                                        value={formData.specialties}
                                        onChange={(e) => handleInputChange('specialties', e.target.value)}
                                        className={`text-right ${errors.specialties ? 'border-red-500' : ''}`}
                                        dir="rtl"
                                    />
                                    {errors.specialties && <p className="text-red-500 text-sm text-right flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.specialties}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-right block font-medium">תיאור המרפאה (אופציונלי)</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="ספר/י קצת על המרפאה, הצוות והשירותים..."
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        className="text-right"
                                        dir="rtl"
                                    />
                                </div>
                            </>
                        ) : (
                            // Doctor Form Fields
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-right block font-medium">מספר טלפון *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        className={`text-right ${errors.phone ? 'border-red-500' : ''}`}
                                        dir="rtl"
                                    />
                                    {errors.phone && <p className="text-red-500 text-sm text-right flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.phone}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="license_number" className="text-right block font-medium">מספר רישיון *</Label>
                                    <Input
                                        id="license_number"
                                        type="text"
                                        value={formData.license_number}
                                        onChange={(e) => handleInputChange('license_number', e.target.value)}
                                        className={`text-right ${errors.license_number ? 'border-red-500' : ''}`}
                                        dir="rtl"
                                    />
                                    {errors.license_number && <p className="text-red-500 text-sm text-right flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.license_number}</p>}
                                </div>

                                 <div className="space-y-2">
                                    <Label className="text-right block font-medium">תחומי התמחות *</Label>
                                    <Popover open={openSpecialtyPopover} onOpenChange={setOpenSpecialtyPopover}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openSpecialtyPopover}
                                                className={`w-full justify-between font-normal ${errors.specialties ? 'border-red-500' : ''}`}
                                            >
                                                <span className="truncate">
                                                    {formData.specialties.length > 0
                                                        ? formData.specialties.join(', ')
                                                        : 'בחר התמחויות...'}
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
                                                                    <CommandItem
                                                                        key={specialty.value}
                                                                        value={specialty.value}
                                                                        onSelect={(currentValue) => {
                                                                            const selected = formData.specialties.includes(specialty.label);
                                                                            const newSpecialties = selected
                                                                                ? formData.specialties.filter(s => s !== specialty.label)
                                                                                : [...formData.specialties, specialty.label];
                                                                            handleInputChange('specialties', newSpecialties);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={`mr-2 h-4 w-4 ${formData.specialties.includes(specialty.label) ? 'opacity-100' : 'opacity-0'}`}
                                                                        />
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
                                    {errors.specialties && <p className="text-red-500 text-sm text-right flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.specialties}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio" className="text-right block font-medium">אודות (אופציונלי)</Label>
                                    <Textarea
                                        id="bio"
                                        placeholder="ספר/י קצת על הרקע המקצועי שלך..."
                                        value={formData.bio}
                                        onChange={(e) => handleInputChange('bio', e.target.value)}
                                        className="text-right"
                                        dir="rtl"
                                    />
                                </div>
                            </>
                        )}

                        {errors.submit && (
                            <p className="text-red-500 text-sm text-center">{errors.submit}</p>
                        )}

                        <Button type="submit" className="w-full bg-[#5932EA] hover:bg-[#4a29c1] text-white font-bold py-3 text-lg" disabled={isLoading}>
                            {isLoading ? 'שולח פרטים...' : `הגש בקשת ${isClinic ? 'שותפות' : 'הצטרפות'}`}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
