import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from '@/entities/User';
import { Star, Calendar, Clock } from 'lucide-react';

export default function DoctorSelection({ specialty, selectedDoctor, onSelectDoctor, settings }) {
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDoctors = async () => {
            if (!specialty) return;
            
            setIsLoading(true);
            try {
                // Load doctors for this specialty
                const allDoctors = await User.filter({ 
                    permissions: { $in: ['doctor'] },
                    specialty: specialty.name,
                    status: 'active'
                });
                setDoctors(allDoctors);
            } catch (error) {
                console.error('Error loading doctors:', error);
                // Demo data for development
                setDoctors([
                    {
                        id: '1',
                        full_name: 'ד"ר סאמר מחאגנה',
                        specialty: specialty.name,
                        years_experience: 15,
                        bio: 'מומחה לפסיכיאטריה ילדים ונוער',
                        rating: 4.8,
                        total_reviews: 127,
                        languages: ['עברית', 'ערבית', 'אנגלית'],
                        avatar: 'https://i.pravatar.cc/150?img=1'
                    },
                    {
                        id: '2',
                        full_name: 'ד"ר ירדן שדה',
                        specialty: specialty.name,
                        years_experience: 12,
                        bio: 'התמחות בהפרעות קשב וריכוז אצל ילדים',
                        rating: 4.6,
                        total_reviews: 89,
                        languages: ['עברית', 'אנגלית'],
                        avatar: 'https://i.pravatar.cc/150?img=2'
                    }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        loadDoctors();
    }, [specialty]);

    if (isLoading) {
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">טוען רופאים...</h3>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">בחר רופא ב{specialty?.name}</h3>
            <div className="grid grid-cols-1 gap-4">
                {doctors.map((doctor) => (
                    <Card 
                        key={doctor.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedDoctor?.id === doctor.id ? 'ring-2 ring-[#5932EA] bg-blue-50' : ''
                        }`}
                        onClick={() => onSelectDoctor(doctor)}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-start space-x-4 space-x-reverse">
                                <img
                                    src={doctor.avatar || 'https://i.pravatar.cc/150?img=1'}
                                    alt={doctor.full_name}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-semibold">{doctor.full_name}</h4>
                                            <p className="text-gray-600">{doctor.specialty}</p>
                                            {doctor.bio && (
                                                <p className="text-sm text-gray-500 mt-1">{doctor.bio}</p>
                                            )}
                                        </div>
                                        
                                        {settings['show_doctor_rating'] === 'true' && doctor.rating && (
                                            <div className="text-left">
                                                <div className="flex items-center">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                                    <span className="mr-1 font-semibold">{doctor.rating}</span>
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    {doctor.total_reviews} ביקורות
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {doctor.years_experience && (
                                            <Badge variant="outline">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {doctor.years_experience} שנות ניסיון
                                            </Badge>
                                        )}
                                        
                                        {doctor.languages && (
                                            <Badge variant="outline">
                                                {doctor.languages.join(', ')}
                                            </Badge>
                                        )}
                                        
                                        <Badge variant="outline" className="text-green-600">
                                            <Clock className="w-3 h-3 mr-1" />
                                            זמין השבוע
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {doctors.length === 0 && (
                <div className="text-center py-8">
                    <p className="text-gray-500">לא נמצאו רופאים זמינים בתחום זה כרגע</p>
                </div>
            )}
        </div>
    );
}