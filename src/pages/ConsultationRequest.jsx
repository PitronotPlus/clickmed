import React, { useState, useEffect, useCallback } from 'react';
import { User } from '@/entities/User';
import { Specialty } from '@/entities/Specialty';
import { Request } from '@/entities/Request';
import { SystemNotification } from '@/entities/SystemNotification';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CheckCircle, User as UserIcon, FileText, Users, Search, X } from 'lucide-react';
import { getDoctorsBySpecialty } from "@/functions/getDoctorsBySpecialty";
import { createPageUrl } from '@/utils';

const steps = [
    { id: 1, title: 'בחירת תחום', icon: UserIcon },
    { id: 2, title: 'בחירת רופא', icon: UserIcon },
    { id: 3, title: 'פרטי הבקשה', icon: FileText },
    { id: 4, title: 'אישור וסיום', icon: CheckCircle }
];

const RequestDetails = React.memo(({ formData, onDescriptionChange, onUrgencyChange }) => {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">פרטי הבקשה לייעוץ</h2>
            <div className="space-y-4">
                <div>
                    <Label htmlFor="description">תאר את הבעיה או הסיבה לפנייה</Label>
                    <Textarea
                        id="description"
                        placeholder="נא תאר בקצרה את הסיבה לפנייה ופרטים רלוונטיים..."
                        value={formData.description}
                        onChange={onDescriptionChange}
                        className="mt-2"
                        rows={4}
                        dir="rtl"
                    />
                </div>
                <div>
                    <Label>רמת דחיפות</Label>
                    <Select value={formData.urgency} onValueChange={onUrgencyChange}>
                        <SelectTrigger className="mt-2">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="רגיל">רגיל</SelectItem>
                            <SelectItem value="דחוף">דחוף</SelectItem>
                            <SelectItem value="נמוך">נמוך</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
});

export default function ConsultationRequestPage() {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({
        specialty: null,
        doctor: null, // Can be a doctor ID or 'auto_assign'
        description: '',
        urgency: 'רגיל'
    });
    const [specialtySearchQuery, setSpecialtySearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    
    const [user, setUser] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [specialties, setSpecialties] = useState([]);
    const [doctors, setDoctors] = useState([]);

    // דיבאונס לחיפוש
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

    const handleSpecialtySelect = (specialtyId) => {
        setFormData({ ...formData, specialty: specialtyId, doctor: null });
        fetchDoctorsBySpecialty(specialtyId);
    };

    const handleDoctorSelect = (doctorId) => {
        setFormData({ ...formData, doctor: doctorId });
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
        setIsSubmitting(true);
        try {
            const selectedSpecialty = specialties.find(s => s.id === formData.specialty);
            let selectedDoctor = null;
            let doctorId = null;
            let doctorName = null;
            let status = 'בקשה בבדיקה';

            if (formData.doctor !== 'auto_assign') {
                selectedDoctor = doctors.find(d => d.id === formData.doctor);
                doctorId = selectedDoctor?.id;
                doctorName = selectedDoctor?.display_name || selectedDoctor?.full_name;
            } else {
                status = 'מחפש רופא';
            }

            const isPremiumUser = user.subscription_type === 'premium' && user.subscription_status === 'active';
            
            if (isPremiumUser && status === 'מחפש רופא') {
                status = 'מחפש רופא - עדיפות פרמיום';
            }

            // Create Request WITHOUT date/time (this is just a consultation request)
            await Request.create({
                user_id: user.id,
                user_name: user.display_name || user.full_name,
                doctor_id: doctorId,
                doctor_name: doctorName,
                type: selectedSpecialty?.name || 'בקשה כללית',
                description: formData.description,
                status: status,
                date: new Date().toISOString().split('T')[0], // Today's date as request date
                time: '00:00', // Placeholder time since it's required
                day_name: new Date().toLocaleDateString('he-IL', { weekday: 'long' }),
                is_premium: isPremiumUser
            });

            // Send notification to doctor if specific doctor selected
            if (selectedDoctor) {
                await SystemNotification.create({
                    user_id: selectedDoctor.id,
                    title: `בקשת ייעוץ ${isPremiumUser ? 'פרמיום ' : ''}חדשה התקבלה`,
                    message: `מטופל ${isPremiumUser ? 'פרמיום ' : ''}${user.display_name || user.full_name}, הגיש בקשת ייעוץ בתחום ${selectedSpecialty.name}.`,
                    type: 'appointment',
                    priority: isPremiumUser ? 'high' : 'medium'
                });
            }

            setCurrentStep(steps.length + 1);
        } catch (error) {
            console.error("Failed to submit consultation request:", error);
            alert("אירעה שגיאה בשליחת הבקשה. אנא נסה שוב.");
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
                            className="shrink-0"
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
                                <p className="text-gray-600 mt-1 text-sm">{specialty.description || 'ייעוץ מקצועי'}</p>
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
                <h2 className="text-2xl font-bold mb-6">בחר רופא לייעוץ</h2>
                
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
                            <p className="text-gray-600">נציג את בקשת הייעוץ שלך לכל הרופאים הזמינים בתחום.</p>
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
                        {doctors.map(doctor => (
                            <Card 
                                key={doctor.id}
                                className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                                    formData.doctor === doctor.id ? 'border-[#5932EA] bg-purple-50' : 'border-gray-200'
                                }`}
                                onClick={() => handleDoctorSelect(doctor.id)}
                            >
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <img src={doctor.avatar || 'https://i.pravatar.cc/150'} alt={doctor.full_name} className="w-16 h-16 rounded-full object-cover"/>
                                        <div>
                                            <h3 className="font-bold text-lg">{doctor.display_name || doctor.full_name}</h3>
                                            <p className="text-gray-600">{doctor.years_of_experience ? `${doctor.years_of_experience} שנות ניסיון` : 'ייעוץ מקצועי'}</p>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <Badge className="bg-yellow-100 text-yellow-800">
                                            ⭐ 4.8
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">לא נמצאו רופאים בתחום זה.</p>
                )}
            </div>
        );
    };

    const handleDescriptionChange = useCallback((e) => {
        const newDescription = e.target.value;
        setFormData(prev => ({...prev, description: newDescription}));
    }, []);

    const handleUrgencyChange = useCallback((value) => {
        setFormData(prev => ({...prev, urgency: value}));
    }, []);

    const Summary = () => {
        const selectedSpecialty = specialties.find(s => s.id === formData.specialty);
        const selectedDoctor = doctors.find(d => d.id === formData.doctor);
        
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-6">סיכום בקשת הייעוץ</h2>
                <Card>
                    <CardContent className="p-6 space-y-4">
                        <div className="flex justify-between">
                            <span className="font-semibold">תחום:</span>
                            <span>{selectedSpecialty?.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">רופא:</span>
                            <span>{formData.doctor === 'auto_assign' ? 'בחירה אוטומטית' : selectedDoctor?.display_name || selectedDoctor?.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="font-semibold">דחיפות:</span>
                            <span>{formData.urgency}</span>
                        </div>
                        {formData.description && (
                            <div>
                                <span className="font-semibold">פרטי הבקשה:</span>
                                <p className="mt-2 text-gray-600">{formData.description}</p>
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
            <h2 className="text-3xl font-bold text-gray-800 mb-4">בקשת הייעוץ נשלחה בהצלחה!</h2>
            <p className="text-lg text-gray-600 mb-8">
                בקשת הייעוץ שלך נשלחה לרופא והוא יחזור אליך בהקדם.
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
            case 2: return !!formData.doctor;
            case 3: return formData.description.length > 0;
            case 4: return true;
            default: return false;
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-4 md:py-8 px-4 md:px-0">
            <h1 className="text-2xl md:text-4xl font-bold text-center mb-6 md:mb-8">בקשת ייעוץ רפואי</h1>
            
            <StepIndicator />
            
            <Card className="p-4 md:p-8">
                {currentStep === 1 && <SpecialtySelection />}
                {currentStep === 2 && <DoctorSelection />}
                {currentStep === 3 && (
                    <RequestDetails
                        formData={formData}
                        onDescriptionChange={handleDescriptionChange}
                        onUrgencyChange={handleUrgencyChange}
                    />
                )}
                {currentStep === 4 && <Summary />}
                
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
                            {isSubmitting ? 'שולח...' : 'שלח בקשת ייעוץ'}
                        </Button>
                    )}
                </div>
            </Card>
        </div>
    );
}