import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Calendar, MessageSquare, Phone, User as UserIcon } from 'lucide-react';
import { User } from '@/entities/User';
import { Appointment } from '@/entities/Appointment';
import { Request } from '@/entities/Request';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function MyTherapists() {
    const [therapists, setTherapists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        loadMyTherapists();
    }, []);

    const loadMyTherapists = async () => {
        setLoading(true);
        try {
            const currentUser = await User.me();
            setUser(currentUser);

            // טעינת כל התורים והבקשות של המטופל
            const [userAppointments, userRequests] = await Promise.all([
                Appointment.filter({ user_id: currentUser.id }),
                Request.filter({ user_id: currentUser.id })
            ]);

            // איסוף מזהי רופאים ייחודיים מתורים ובקשות
            const doctorIds = new Set();
            
            // מתורים
            userAppointments.forEach(appointment => {
                if (appointment.doctor_id) {
                    doctorIds.add(appointment.doctor_id);
                }
            });

            // מבקשות שאושרו
            userRequests.forEach(request => {
                if (request.doctor_id && ['בקשה בבדיקה', 'מאושר עבור עליה', 'טופל'].includes(request.status)) {
                    doctorIds.add(request.doctor_id);
                }
            });

            if (doctorIds.size > 0) {
                // טעינת פרטי הרופאים
                const doctorsList = Array.from(doctorIds);
                const doctors = await Promise.all(
                    doctorsList.map(async (doctorId) => {
                        try {
                            const doctor = await User.filter({ id: doctorId });
                            return doctor.length > 0 ? doctor[0] : null;
                        } catch (error) {
                            console.error(`Error loading doctor ${doctorId}:`, error);
                            return null;
                        }
                    })
                );

                // סינון רופאים שנטענו בהצלחה ועיצוב הנתונים
                const validDoctors = doctors
                    .filter(doctor => doctor && doctor.user_type === 'doctor')
                    .map(doctor => {
                        // חישוב מספר התורים עם הרופא
                        const appointmentsWithDoctor = userAppointments.filter(apt => apt.doctor_id === doctor.id);
                        const lastAppointment = appointmentsWithDoctor.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                        
                        return {
                            ...doctor,
                            totalAppointments: appointmentsWithDoctor.length,
                            lastVisit: lastAppointment ? lastAppointment.date : null,
                            specialties: doctor.specialties || [],
                            mainSpecialty: doctor.specialties?.[0] || 'רופא כללי'
                        };
                    });

                setTherapists(validDoctors);
            } else {
                setTherapists([]);
            }
        } catch (error) {
            console.error('Error loading therapists:', error);
            setTherapists([]);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'ר';
        const names = name.split(' ');
        return names.map(n => n.charAt(0)).join('').substring(0, 2);
    };

    const formatLastVisit = (date) => {
        if (!date) return null;
        const visitDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - visitDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'אתמול';
        if (diffDays < 7) return `לפני ${diffDays} ימים`;
        if (diffDays < 30) return `לפני ${Math.ceil(diffDays / 7)} שבועות`;
        return `לפני ${Math.ceil(diffDays / 30)} חודשים`;
    };

    if (loading) {
        return (
            <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] rounded-[10px] border-none">
                <CardHeader>
                    <CardTitle className="font-bold text-gray-900">הרופאים והמטפלים שלי</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5932EA]"></div>
                        <span className="mr-3">טוען רופאים...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] rounded-[10px] border-none">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="font-bold text-gray-900">הרופאים והמטפלים שלי</CardTitle>
                    {therapists.length > 0 && (
                        <Button asChild variant="outline" size="sm">
                            <Link to={createPageUrl('ScheduleAppointment')}>
                                <Calendar className="w-4 h-4 mr-2" />
                                קבע תור חדש
                            </Link>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {therapists.length === 0 ? (
                    <div className="text-center py-8">
                        <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">עדיין לא יש לך רופאים</h3>
                        <p className="text-gray-500 mb-4">התחל על ידי קביעת תור עם רופא או מטפל</p>
                        <Button asChild className="bg-[#5932EA] hover:bg-[#4a29c1]">
                            <Link to={createPageUrl('ScheduleAppointment')}>
                                <Calendar className="w-4 h-4 mr-2" />
                                קבע תור ראשון
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {therapists.map((doctor) => (
                            <div key={doctor.id} className="border border-gray-200 p-4 rounded-lg flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                <Avatar className="w-20 h-20 mb-4">
                                    <AvatarImage src={doctor.avatar} />
                                    <AvatarFallback className="bg-[#5932EA] text-white text-lg font-bold">
                                        {getInitials(doctor.display_name || doctor.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <h4 className="font-bold text-gray-900 mb-1">
                                    {doctor.display_name || doctor.full_name}
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">{doctor.mainSpecialty}</p>
                                
                                <div className="flex flex-col gap-1 mb-3 w-full">
                                    <Badge variant="outline" className="text-xs">
                                        {doctor.totalAppointments} תורים
                                    </Badge>
                                    {doctor.lastVisit && (
                                        <Badge variant="outline" className="text-xs text-gray-500">
                                            ביקור אחרון: {formatLastVisit(doctor.lastVisit)}
                                        </Badge>
                                    )}
                                </div>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="mt-2">
                                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="center">
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('ScheduleAppointment')}>
                                                <Calendar className="w-4 h-4 mr-2" />
                                                קבע תור חדש
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link to={createPageUrl('Messages')}>
                                                <MessageSquare className="w-4 h-4 mr-2" />
                                                שלח הודעה
                                            </Link>
                                        </DropdownMenuItem>
                                        {doctor.phone && (
                                            <DropdownMenuItem>
                                                <a href={`tel:${doctor.phone}`} className="flex items-center">
                                                    <Phone className="w-4 h-4 mr-2" />
                                                    התקשר
                                                </a>
                                            </DropdownMenuItem>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}