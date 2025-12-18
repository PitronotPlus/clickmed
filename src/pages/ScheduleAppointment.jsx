
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/entities/User';
import { Specialty } from '@/entities/Specialty';
import { DoctorAvailability } from '@/entities/DoctorAvailability';
import { DoctorException } from '@/entities/DoctorException';
import { Appointment } from '@/entities/Appointment';
import { SystemNotification } from '@/entities/SystemNotification';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, Calendar as CalendarIcon, User as UserIcon, FileText, Loader2, Search, X, Users } from 'lucide-react';
import { format, getDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { getDoctorsBySpecialty } from "@/functions/getDoctorsBySpecialty";
import { createPageUrl } from '@/utils';

const steps = [
    { id: 1, title: 'בחירת תחום', icon: UserIcon },
    { id: 2, title: 'בחירת רופא', icon: UserIcon },
    { id: 3, title: 'בחירת תאריך', icon: CalendarIcon },
    { id: 4, title: 'פרטי התור', icon: FileText },
    { id: 5, title: 'אישור וסיום', icon: CheckCircle }
];

const AppointmentDetails = React.memo(({ formData, onNotesChange }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">פרטי התור</h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="notes">הערות נוספות (אופציונלי)</Label>
                    <Textarea
                        id="notes"
                        placeholder="הוסף הערות או פרטים נוספים לגבי התור..."
                        value={formData.notes}
                        onChange={onNotesChange}
                        className="mt-2"
                        rows={4}
                        dir="rtl"
                    />
                </div>
            </div>
        </div>
    );
});

// Helper function to generate common time slots for auto-assign
const generateCommonTimes = (selectedDate) => {
    const times = [];
    const now = new Date();
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

    for (let h = 9; h <= 17; h++) { // From 9:00 to 17:00
        for (let m = 0; m < 60; m += 30) { // Every 30 minutes
            const slotDate = new Date(selectedDate);
            slotDate.setHours(h, m, 0, 0);

            if (!isToday || slotDate > now) {
                const hour = String(h).padStart(2, '0');
                const minute = String(m).padStart(2, '0');
                times.push(`${hour}:${minute}`);
            }
        }
    }
    return times;
};

export default function ScheduleAppointmentPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        specialty: null,
        doctor: null, // Can be null, a doctor ID, or 'auto_assign'
        date: null,
        time: null,
        notes: ''
    });
    const [specialtySearchQuery, setSpecialtySearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    
    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [loadingTimes, setLoadingTimes] = useState(false);
    const [doctorSchedule, setDoctorSchedule] = useState(null); // This will remain null if 'auto_assign' is selected
    const [loadingSchedule, setLoadingSchedule] = useState(false);

    // Debounce for search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(specialtySearchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [specialtySearchQuery]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                
                const activeSpecialties = await Specialty.filter({ is_active: true });
                setSpecialties(activeSpecialties);
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                setSpecialties([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    const fetchDoctorsBySpecialty = async (specialtyId) => {
        const selectedSpecialty = specialties.find(s => s.id === specialtyId);
        if (!selectedSpecialty) return;
    
        try {
            const response = await getDoctorsBySpecialty({ 
                specialty: selectedSpecialty.name 
            });
            
            if (response.status === 200) {
                setDoctors(response.data.doctors);
            } else {
                setDoctors([]);
            }
        } catch (error) {
            console.error('Error fetching doctors:', error);
            setDoctors([]);
        }
    };
    
    const fetchDoctorSchedule = async (doctorId) => {
        if (!doctorId || doctorId === 'auto_assign') { // Added check for 'auto_assign'
            setDoctorSchedule(null);
            return;
        }
        setLoadingSchedule(true);
        try {
            const [weekly, exceptions] = await Promise.all([
                DoctorAvailability.filter({ doctor_id: doctorId, is_available: true }),
                DoctorException.filter({ doctor_id: doctorId, is_active: true })
            ]);
            setDoctorSchedule({ weekly, exceptions });
        } catch (error) {
            console.error("Failed to fetch doctor schedule:", error);
            setDoctorSchedule(null);
        } finally {
            setLoadingSchedule(false);
        }
    };

    const fetchAvailableTimes = async (doctorId, date) => {
        if (!doctorId || doctorId === 'auto_assign') { // Added check for 'auto_assign'
            setAvailableTimes([]); // Times will be handled by handleDateSelect for auto_assign
            setLoadingTimes(false);
            return;
        }

        setLoadingTimes(true);
        setAvailableTimes([]);
        setFormData(prev => ({ ...prev, time: null }));
        
        try {
            const dayOfWeek = getDay(date);
            const dateString = format(date, 'yyyy-MM-dd');

            let currentSchedule = doctorSchedule;
            // Only re-fetch if the doctor schedule is null or for a different doctor
            if (!currentSchedule || currentSchedule.weekly.some(w => w.doctor_id !== doctorId)) {
                const [weekly, exceptions] = await Promise.all([
                    DoctorAvailability.filter({ doctor_id: doctorId, is_available: true }),
                    DoctorException.filter({ doctor_id: doctorId, is_active: true })
                ]);
                currentSchedule = { weekly, exceptions };
                setDoctorSchedule(currentSchedule); // Update doctorSchedule state
            }

            // Check for exceptions
            const exceptions = currentSchedule.exceptions;
            const exception = exceptions.find(e => e.date === dateString);
            if (exception) {
                if (exception.exception_type === 'unavailable' || exception.exception_type === 'vacation') {
                    setAvailableTimes([]);
                    return;
                }
            }
            
            // Get weekly availability
            const weeklyAvailabilities = currentSchedule.weekly;
            const availability = weeklyAvailabilities.find(d => d.day_of_week === dayOfWeek);

            if (!availability) {
                setAvailableTimes([]);
                return;
            }

            // Get booked appointments - now filtering out cancelled appointments
            const startOfDay = new Date(date).setHours(0, 0, 0, 0);
            const endOfDay = new Date(date).setHours(23, 59, 59, 999);
            const bookedAppointments = await Appointment.filter({
                doctor_id: doctorId,
                date: {
                    $gte: new Date(startOfDay).toISOString(),
                    $lte: new Date(endOfDay).toISOString()
                },
                status: { $ne: 'בוטל' } // Only count appointments that are not cancelled
            });
            const bookedTimes = bookedAppointments.map(app => format(new Date(app.date), 'HH:mm'));

            // Generate available time slots
            const { start_time, end_time, appointment_duration } = availability;
            const slots = [];
            let currentTime = new Date(`${dateString}T${start_time}`);
            const endTime = new Date(`${dateString}T${end_time}`);
            
            const now = new Date();
            const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');

            while (currentTime < endTime) {
                const timeSlot = format(currentTime, 'HH:mm');
                const isFutureSlot = !isToday || currentTime > now;

                if (!bookedTimes.includes(timeSlot) && isFutureSlot) {
                    slots.push(timeSlot);
                }
                currentTime.setMinutes(currentTime.getMinutes() + appointment_duration);
            }
            setAvailableTimes(slots);

        } catch (error) {
            console.error('Error fetching available times:', error);
            setAvailableTimes([]);
        } finally {
            setLoadingTimes(false);
        }
    };

    const handleSpecialtySelect = (specialtyId) => {
        setFormData({ ...formData, specialty: specialtyId, doctor: null, date: null, time: null });
        fetchDoctorsBySpecialty(specialtyId);
    };

    const handleDoctorSelect = (doctorId) => {
        setFormData({ ...formData, doctor: doctorId, date: null, time: null });
        fetchDoctorSchedule(doctorId);
    };

    const handleDateSelect = (date) => {
        setFormData({ ...formData, date, time: null }); // Reset time when date changes
        if (formData.doctor === 'auto_assign') {
            // For 'auto_assign', show general common times, filtering for today
            setAvailableTimes(generateCommonTimes(date));
            setLoadingTimes(false);
        } else if (formData.doctor) {
            fetchAvailableTimes(formData.doctor, date);
        } else {
            setAvailableTimes([]);
            setLoadingTimes(false);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (formData.doctor === 'auto_assign') {
            alert("קביעת תור בשיטת 'תבחרו בשבילי' אינה זמינה כרגע. אנא בחר/י רופא/ה ספציפי/ת.");
            setIsSubmitting(false);
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedSpecialty = specialties.find(s => s.id === formData.specialty);
            const selectedDoctor = doctors.find(d => d.id === formData.doctor);

            if (!selectedDoctor) {
                console.error("Selected doctor is undefined. Cannot submit appointment.");
                alert("שגיאה: רופא לא נבחר או לא נמצא. אנא נסה שוב.");
                setIsSubmitting(false);
                return;
            }

            if (!selectedDoctor.consultation_fee || selectedDoctor.consultation_fee < 10) {
                alert("לא ניתן לקבוע תור לרופא זה מכיוון שמחיר הייעוץ אינו מוגדר או אינו תקין.");
                setIsSubmitting(false);
                return;
            }

            const appointmentDateTime = new Date(`${format(formData.date, 'yyyy-MM-dd')}T${formData.time}`);
            
            // CRITICAL FIX: Determine the correct user for the appointment at submission time.
            let effectiveUser;
            const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');

            if (impersonatedUserId) {
                console.log(`Impersonation mode active. Creating appointment for user ID: ${impersonatedUserId}`);
                effectiveUser = await User.get(impersonatedUserId);
            } else {
                console.log('Normal mode. Creating appointment for currently logged-in user.');
                effectiveUser = await User.me();
            }

            if (!effectiveUser) {
                throw new Error("Could not determine the correct user for appointment creation.");
            }
            
            const isPremiumUser = effectiveUser.subscription_type === 'premium' && effectiveUser.subscription_status === 'active';

            const basePrice = selectedDoctor.consultation_fee || 300;
            let finalPrice = basePrice;
            let discountApplied = 0;

            if (isPremiumUser) {
                discountApplied = 20;
                finalPrice = Math.round(basePrice * 0.8);
            }

            const newAppointment = await Appointment.create({
                user_id: effectiveUser.id,
                patient_name: effectiveUser.display_name || effectiveUser.full_name,
                doctor_id: selectedDoctor.id,
                doctor: selectedDoctor.display_name || selectedDoctor.full_name,
                specialty: selectedSpecialty.name,
                clinic: selectedDoctor.working_locations?.[0] || 'מרפאה פרטית',
                date: appointmentDateTime.toISOString(),
                status: 'ממתין לאישור',
                is_premium: isPremiumUser,
                original_price: basePrice,
                final_price: finalPrice,
                discount_applied: discountApplied,
                notes: formData.notes || '',
                payment_status: 'pending'
            });

            console.log('✅ Appointment created successfully for user:', effectiveUser.id, 'with appointment ID:', newAppointment.id);

            // Send notification to doctor
            await SystemNotification.create({
                user_id: selectedDoctor.id,
                title: `בקשת תור ${isPremiumUser ? 'פרמיום ' : ''}חדשה`,
                message: `${effectiveUser.display_name || effectiveUser.full_name} ביקש תור בתאריך ${format(formData.date, 'dd/MM/yyyy')} בשעה ${formData.time} בתחום ${selectedSpecialty.name}.`,
                type: 'appointment',
                priority: isPremiumUser ? 'high' : 'medium'
            });

            // Send notification to patient
            await SystemNotification.create({
                user_id: effectiveUser.id,
                title: 'בקשת התור הוגשה בהצלחה',
                message: `בקשתך לתור עם ד"ר ${selectedDoctor.display_name || selectedDoctor.full_name} הוגשה והועברה לאישור. תקבל עדכון ברגע שהתור יאושר.`,
                type: 'appointment',
                priority: 'medium'
            });

            setCurrentStep(steps.length + 1);
        } catch (error) {
            console.error("Failed to schedule appointment:", error);
            alert("אירעה שגיאה בהגשת הבקשה. אנא נסה שוב.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const StepIndicator = () => (
        <div className="flex items-center justify-between mb-6 md:mb-8 overflow-x-auto pb-2">
            {steps.map((step, index) => (
                <div key={step.id} className="flex items-center min-w-0">
                    <div className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0 ${
                        currentStep >= step.id ? 'bg-[#5932EA] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                        {currentStep > step.id ? (
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                        ) : (
                            <step.icon className="w-4 h-4 md:w-5 h-5" />
                        )}
                    </div>
                    <span className={`mr-2 text-xs md:text-sm whitespace-nowrap ${currentStep >= step.id ? 'text-[#5932EA] font-semibold' : 'text-gray-500'} hidden sm:block`}>
                        {step.title}
                    </span>
                    {index < steps.length - 1 && (
                        <div className={`w-4 md:w-16 h-0.5 mx-1 md:mx-4 ${currentStep > step.id ? 'bg-[#5932EA]' : 'bg-gray-300'}`} />
                    )}
                </div>
            ))}
        </div>
    );

    const SpecialtySelection = () => {
        const filteredSpecialties = specialties.filter(specialty =>
            specialty.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );

        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-6">בחר את תחום ההתמחות</h2>
                
                <div className="mb-6 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="חפש תחום..."
                            value={specialtySearchQuery}
                            onChange={(e) => setSpecialtySearchQuery(e.target.value)}
                            className="w-full bg-gray-50 pr-10"
                            dir="rtl"
                        />
                    </div>
                    {specialtySearchQuery && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => setSpecialtySearchQuery('')}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSpecialties.map(specialty => (
                        <Card 
                            key={specialty.id}
                            className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                                formData.specialty === specialty.id ? 'border-[#5932EA] bg-purple-50' : 'border-gray-200'
                            }`}
                            onClick={() => handleSpecialtySelect(specialty.id)}
                        >
                            <CardContent className="p-4">
                                <h3 className="font-bold text-lg">{specialty.name}</h3>
                                <p className="text-gray-600 mt-1 text-sm">{specialty.description || 'קביעת תור'}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    const DoctorSelection = () => {
        return (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold mb-6">בחר רופא</h2>
                
                <Card
                    className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                        formData.doctor === 'auto_assign' ? 'border-[#5932EA] bg-purple-50' : 'border-gray-200'
                    }`}
                    onClick={() => handleDoctorSelect('auto_assign')}
                >
                    <CardContent className="p-4 flex items-center gap-4">
                         <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#5932EA] to-purple-400 flex items-center justify-center">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-[#5932EA]">תבחרו בשבילי</h3>
                            <p className="text-gray-600">נמצא לך רופא זמין בתאריך ובשעה שתבחר.</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">או בחרו רופא/ה ספציפי/ת</span>
                    </div>
                </div>

                {doctors.length > 0 ? (
                    <div className="grid gap-4">
                        {doctors.map(doctor => {
                            const hasValidPrice = doctor.consultation_fee && doctor.consultation_fee >= 10;
                            return (
                                <Card 
                                    key={doctor.id}
                                    className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                                        formData.doctor === doctor.id ? 'border-[#5932EA] bg-purple-50' : 
                                        hasValidPrice ? 'border-gray-200' : 'border-red-200 bg-red-50'
                                    } ${!hasValidPrice ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    onClick={() => hasValidPrice ? handleDoctorSelect(doctor.id) : null}
                                >
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <img src={doctor.avatar || 'https://i.pravatar.cc/150'} alt={doctor.full_name} className="w-16 h-16 rounded-full object-cover"/>
                                            <div>
                                                <h3 className="font-bold text-lg">{doctor.display_name || doctor.full_name}</h3>
                                                <p className="text-gray-600">{doctor.years_of_experience ? `${doctor.years_of_experience} שנות ניסיון` : 'רופא מומחה'}</p>
                                                {hasValidPrice ? (
                                                    <p className="text-green-600 font-semibold">₪{doctor.consultation_fee}</p>
                                                ) : (
                                                    <p className="text-red-600 text-sm font-semibold">⚠️ מחיר לא הוגדר</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <Badge className="bg-yellow-100 text-yellow-800">
                                                ⭐ 4.8
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">לא נמצאו רופאים בתחום זה.</p>
                )}
            </div>
        );
    };

    const DateTimeSelection = () => {
        const isDayDisabled = (date) => {
            // Always disable past dates
            if (date < new Date(new Date().setDate(new Date().getDate() - 1))) {
                return true;
            }
            
            // If auto_assign is selected, only past dates are disabled, as specific doctor schedule is unknown
            if (formData.doctor === 'auto_assign') {
                return false; 
            }

            // If schedule is loading or no doctor selected (and not auto_assign), don't disable dates based on schedule
            if (loadingSchedule || !doctorSchedule) {
                return false;
            }

            const dayOfWeek = getDay(date);
            const dateString = format(date, 'yyyy-MM-dd');

            // Check for exceptions
            const exception = doctorSchedule.exceptions.find(e => e.date === dateString);
            if (exception) {
                return exception.exception_type === 'unavailable' || exception.exception_type === 'vacation';
            }

            // Check weekly availability
            const weeklyDay = doctorSchedule.weekly.find(d => d.day_of_week === dayOfWeek);
            return !weeklyDay;
        };

        return (
            <div className="space-y-6">
                <h2 className="text-xl md:text-2xl font-bold mb-6">בחר תאריך ושעה לתור</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                    <div>
                        <Label className="text-base md:text-lg font-semibold mb-4 block">תאריך</Label>
                        <div className="flex justify-center items-center flex-col">
                            {loadingSchedule && formData.doctor !== 'auto_assign' && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                                    <Loader2 className="w-4 h-4 animate-spin"/>
                                    <span>טוען זמינות של הרופא...</span>
                                </div>
                            )}
                            <Calendar
                                mode="single"
                                selected={formData.date}
                                onSelect={handleDateSelect}
                                disabled={isDayDisabled}
                                className="rounded-md border"
                                locale={he}
                            />
                        </div>
                    </div>
                    <div>
                        <Label className="text-base md:text-lg font-semibold mb-4 block">שעה זמינה</Label>
                        {loadingTimes && formData.doctor !== 'auto_assign' ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-[#5932EA]" />
                            </div>
                        ) : availableTimes.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {availableTimes.map(time => (
                                    <Button
                                        key={time}
                                        variant={formData.time === time ? "default" : "outline"}
                                        onClick={() => setFormData({...formData, time})}
                                        className={`text-sm ${formData.time === time ? 'bg-[#5932EA]' : ''}`}
                                    >
                                        {time}
                                    </Button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center mt-4">
                                {formData.doctor === 'auto_assign' ? 
                                    (formData.date ? 'אנא בחר שעה מועדפת מהרשימה.' : 'אנא בחר תאריך כדי לבחור שעה מועדפת.') :
                                    (formData.date ? 'אין שעות פנויות בתאריך שנבחר. אנא בחר תאריך אחר.' : 'אנא בחר תאריך כדי לראות שעות זמינות.')
                                }
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    };
    
    const handleNotesChange = useCallback((e) => {
        const newNotes = e.target.value;
        setFormData(prev => ({...prev, notes: newNotes}));
    }, []);

    const Summary = () => {
        const selectedSpecialty = specialties.find(s => s.id === formData.specialty);
        const selectedDoctor = doctors.find(d => d.id === formData.doctor);
        
        // Calculate price details for display in summary
        // Note: For display purposes here, we use the 'user' state. 
        // The actual effectiveUser is determined at submission time in handleSubmit.
        const currentUser = user; 
        const isPremiumUser = currentUser?.subscription_type === 'premium' && currentUser?.subscription_status === 'active';
        const basePrice = selectedDoctor?.consultation_fee || 300;
        let finalPrice = basePrice;
        let discountApplied = 0;

        if (isPremiumUser) {
            discountApplied = 20;
            finalPrice = Math.round(basePrice * 0.8);
        }

        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">סיכום התור</h2>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between">
                            <span className="font-semibold">תחום:</span>
                            <span>{selectedSpecialty?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">רופא:</span>
                            <span>
                                {formData.doctor === 'auto_assign' ? 
                                    'ייבחר אוטומטית על ידי המערכת' : 
                                    (selectedDoctor?.display_name || selectedDoctor?.full_name)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">תאריך:</span>
                            <span>{formData.date ? format(formData.date, 'dd/MM/yyyy', { locale: he }) : ''}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">שעה:</span>
                            <span>{formData.time}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">מחיר בסיסי:</span>
                            <span>{basePrice} ₪</span>
                        </div>
                        {isPremiumUser && (
                            <div className="flex justify-between text-green-600">
                                <span className="font-semibold">הנחת פרימיום:</span>
                                <span>{discountApplied}%-</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t pt-4 mt-4">
                            <span>סה"כ לתשלום:</span>
                            <span>{finalPrice} ₪</span>
                        </div>
                        {formData.notes && (
                            <div>
                                <span className="font-semibold">הערות:</span>
                                <p className="mt-2 text-gray-600">{formData.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    };

    const SuccessScreen = () => (
        <div className="text-center py-12">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">הבקשה הוגשה בהצלחה!</h2>
            <p className="text-lg text-gray-600 mb-8">
                בקשתך לתור הועברה לרופא לאישור. תקבל הודעה ברגע שהתור יאושר.
            </p>
            <div className="flex gap-4 justify-center">
                <Button onClick={() => window.location.href = createPageUrl('Dashboard')} className="bg-[#5932EA]">
                    חזור לדף הבית
                </Button>
                <Button onClick={() => window.location.href = createPageUrl('MyRequests')} variant="outline">
                    צפה בבקשות שלי
                </Button>
            </div>
        </div>
    );
    
    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5932EA] mx-auto mb-4"></div>
                    <p className="text-gray-600">טוען...</p>
                </div>
            </div>
        );
    }

    if (currentStep > steps.length) {
        return <SuccessScreen />;
    }

    const isStepValid = () => {
        switch (currentStep) {
            case 1: return !!formData.specialty;
            case 2: 
                // For doctor selection, validate if a doctor is selected, and if it's a specific doctor, ensure they have a valid price
                if (formData.doctor === 'auto_assign') return true; // auto_assign is always valid for selection
                const selectedDoctor = doctors.find(d => d.id === formData.doctor);
                return !!selectedDoctor && !!selectedDoctor.consultation_fee && selectedDoctor.consultation_fee >= 10;
            case 3: return !!formData.date && !!formData.time;
            case 4: return true; // Notes are optional
            case 5: 
                // For 'auto_assign', submission logic is not implemented in this version.
                // Disabling submit button for this case to prevent errors.
                return formData.doctor !== 'auto_assign';
            default: return false;
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-0">
            <h1 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-8">קביעת תור</h1>
            
            <StepIndicator />
            
            <Card className="p-4 md:p-8">
                {currentStep === 1 && <SpecialtySelection />}
                {currentStep === 2 && <DoctorSelection />}
                {currentStep === 3 && <DateTimeSelection />}
                {currentStep === 4 && (
                    <AppointmentDetails
                        formData={formData}
                        onNotesChange={handleNotesChange}
                    />
                )}
                {currentStep === 5 && <Summary />}
                
                <div className="flex flex-col sm:flex-row justify-between mt-6 md:mt-8 gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentStep === 1}
                        className="w-full sm:w-auto order-2 sm:order-1"
                    >
                        הקודם
                    </Button>
                    
                    {currentStep < steps.length ? (
                        <Button
                            onClick={handleNext}
                            disabled={!isStepValid()}
                            className="bg-[#5932EA] w-full sm:w-auto order-1 sm:order-2"
                        >
                            הבא
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !isStepValid()}
                            className="bg-[#5932EA] w-full sm:w-auto order-1 sm:order-2"
                        >
                            {isSubmitting ? 'שולח בקשה...' : 'שלח בקשה'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}
