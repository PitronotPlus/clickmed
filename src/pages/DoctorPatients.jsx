import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Search, Calendar, FileText, FilePen, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';
import { User as UserEntity } from '@/entities/User';
import { Appointment } from '@/entities/Appointment';
import { Request } from '@/entities/Request';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import DoctorScheduleAppointmentModal from '@/components/doctors/DoctorScheduleAppointmentModal';
import AddVisitSummaryModal from '@/components/doctors/AddVisitSummaryModal';
import SendQuestionnaireModal from '@/components/patients/SendQuestionnaireModal';

export default function DoctorPatients() {
    const [patients, setPatients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [isScheduling, setIsScheduling] = useState(false);
    const [selectedPatientForScheduling, setSelectedPatientForScheduling] = useState(null);
    const [isAddingSummary, setIsAddingSummary] = useState(false);
    const [selectedPatientForSummary, setSelectedPatientForSummary] = useState(null);
    const [isSendingQuestionnaire, setIsSendingQuestionnaire] = useState(false);
    const [selectedPatientForQuestionnaire, setSelectedPatientForQuestionnaire] = useState(null);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            // Handle impersonation
            const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
            let currentUser;
            if (impersonatedUserId) {
                currentUser = await UserEntity.get(impersonatedUserId);
            } else {
                currentUser = await UserEntity.me();
            }
            
            setUser(currentUser);
            
            if (currentUser.user_type === 'doctor') {
                // Get both appointments AND requests for this doctor
                const [doctorAppointments, doctorRequests] = await Promise.all([
                    Appointment.filter({ doctor_id: currentUser.id }),
                    Request.filter({ doctor_id: currentUser.id })
                ]);

                console.log('🔍 Doctor appointments:', doctorAppointments.length);
                console.log('🔍 Doctor requests:', doctorRequests.length);
                
                // Get unique patient IDs from BOTH appointments and requests
                const appointmentPatientIds = doctorAppointments.map(a => a.user_id).filter(Boolean);
                const requestPatientIds = doctorRequests.map(r => r.user_id).filter(Boolean);
                const allPatientIds = [...appointmentPatientIds, ...requestPatientIds];
                const uniquePatientIds = [...new Set(allPatientIds)];

                console.log('👥 Unique patient IDs:', uniquePatientIds);
                
                if (uniquePatientIds.length > 0) {
                    // Try to fetch patient data - if some users don't exist, continue with the ones that do
                    const patientsWithInfo = [];
                    
                    for (const patientId of uniquePatientIds) {
                        try {
                            // Try to get user data
                            const patient = await UserEntity.get(patientId);
                            
                            // Calculate patient info from both appointments and requests
                            const patientAppointments = doctorAppointments.filter(a => a.user_id === patientId);
                            const patientRequests = doctorRequests.filter(r => r.user_id === patientId);
                            
                            // Get the most recent interaction (appointment or request)
                            const allInteractions = [
                                ...patientAppointments.map(a => ({ date: a.date || a.created_date, type: 'appointment' })),
                                ...patientRequests.map(r => ({ date: r.created_date, type: 'request' }))
                            ].filter(interaction => interaction.date);

                            allInteractions.sort((a, b) => new Date(b.date) - new Date(a.date));
                            const lastInteraction = allInteractions[0];
                            
                            const upcomingAppointments = patientAppointments.filter(a => new Date(a.date) > new Date()).length;
                            
                            patientsWithInfo.push({
                                ...patient,
                                lastVisit: lastInteraction ? new Date(lastInteraction.date) : null,
                                totalAppointments: patientAppointments.length,
                                totalRequests: patientRequests.length,
                                totalInteractions: patientAppointments.length + patientRequests.length,
                                upcomingAppointments: upcomingAppointments
                            });
                        } catch (userError) {
                            console.log(`Could not fetch data for patient ${patientId}:`, userError);
                            // Patient might not exist anymore, but we'll include basic info from requests/appointments
                            const patientName = doctorRequests.find(r => r.user_id === patientId)?.user_name ||
                                              doctorAppointments.find(a => a.user_id === patientId)?.patient_name ||
                                              'מטופל לא זמין';
                                              
                            patientsWithInfo.push({
                                id: patientId,
                                full_name: patientName,
                                lastVisit: new Date(),
                                totalAppointments: doctorAppointments.filter(a => a.user_id === patientId).length,
                                totalRequests: doctorRequests.filter(r => r.user_id === patientId).length,
                                totalInteractions: doctorAppointments.filter(a => a.user_id === patientId).length + doctorRequests.filter(r => r.user_id === patientId).length,
                                upcomingAppointments: 0,
                                unavailable: true
                            });
                        }
                    }
                    
                    console.log('📋 Final patients with info:', patientsWithInfo);
                    setPatients(patientsWithInfo);
                } else {
                    console.log('👥 No patients found for this doctor');
                }
            }
        } catch (error) {
            console.error('Error loading patients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScheduleClick = (patient) => {
        setSelectedPatientForScheduling(patient);
        setIsScheduling(true);
    };

    const handleAddSummaryClick = (patient) => {
        setSelectedPatientForSummary(patient);
        setIsAddingSummary(true);
    };

    const handleSendQuestionnaireClick = (patient) => {
        setSelectedPatientForQuestionnaire(patient);
        setIsSendingQuestionnaire(true);
    };

    const filteredPatients = patients.filter(patient =>
        patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return <div className="text-center p-8">טוען מטופלים...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold">המטופלים שלי</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>חיפוש מטופלים</CardTitle>
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="חפש מטופל לפי שם..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pr-10"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient, index) => (
                                <Card key={index} className={`hover:shadow-md transition-shadow ${patient.unavailable ? 'opacity-60' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={patient.avatar || `https://i.pravatar.cc/150?u=${patient.id}`} />
                                                    <AvatarFallback>{patient.full_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <h3 className="font-semibold text-lg">
                                                        {patient.full_name}
                                                        {patient.unavailable && <span className="text-red-500 text-sm ml-2">(לא זמין)</span>}
                                                    </h3>
                                                    <div className="flex gap-4 text-sm text-gray-600">
                                                        <span>סה"כ תורים: {patient.totalAppointments || 0}</span>
                                                        <span>סה"כ בקשות: {patient.totalRequests || 0}</span>
                                                        <span>תורים קרובים: {patient.upcomingAppointments || 0}</span>
                                                        {patient.lastVisit && (
                                                            <span>אינטראקציה אחרונה: {formatDistanceToNow(patient.lastVisit, { addSuffix: true, locale: he })}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                {!patient.unavailable && (
                                                    <>
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link to={createPageUrl(`PatientMedicalRecord?patientId=${patient.id}`)}>
                                                                <FileText className="w-4 h-4 mr-2" />
                                                                תיק רפואי
                                                            </Link>
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => handleAddSummaryClick(patient)} className="bg-green-50 hover:bg-green-100 border-green-200">
                                                                    <FilePen className="w-4 h-4 mr-2" />
                                                                    סיכום ביקור
                                                                </Button>
                                                                <Button variant="outline" size="sm" onClick={() => handleSendQuestionnaireClick(patient)} className="bg-purple-50 hover:bg-purple-100 border-purple-200">
                                                                    <Send className="w-4 h-4 mr-2" />
                                                                    שאלון
                                                                </Button>
                                                            </>
                                                        )}
                                                        <Button variant="default" size="sm" onClick={() => handleScheduleClick(patient)} disabled={patient.unavailable}>
                                                            <Calendar className="w-4 h-4 mr-2" />
                                                            קבע תור
                                                        </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {searchQuery ? 'לא נמצאו מטופלים התואמים לחיפוש' : 'אין מטופלים רשומים'}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
            {isScheduling && selectedPatientForScheduling && (
                <DoctorScheduleAppointmentModal
                    patient={selectedPatientForScheduling}
                    doctor={user}
                    isOpen={isScheduling}
                    onClose={() => setIsScheduling(false)}
                    onAppointmentScheduled={() => {
                        setIsScheduling(false);
                        loadPatients();
                    }}
                />
            )}
            
            {isAddingSummary && selectedPatientForSummary && (
                <AddVisitSummaryModal
                    isOpen={isAddingSummary}
                    onClose={() => setIsAddingSummary(false)}
                    patient={selectedPatientForSummary}
                    onSuccess={() => {
                        setIsAddingSummary(false);
                        loadPatients();
                    }}
                />
            )}

            {isSendingQuestionnaire && selectedPatientForQuestionnaire && (
                <SendQuestionnaireModal
                    isOpen={isSendingQuestionnaire}
                    onClose={() => setIsSendingQuestionnaire(false)}
                    patient={selectedPatientForQuestionnaire}
                />
            )}
            </div>
            );
            }