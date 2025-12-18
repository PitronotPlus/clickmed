import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Appointment } from '@/entities/Appointment';
import { SystemNotification } from '@/entities/SystemNotification';
import { Loader2 } from 'lucide-react';

export default function DoctorScheduleAppointmentModal({ patient, doctor, isOpen, onClose, onAppointmentScheduled }) {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [specialty, setSpecialty] = useState(doctor?.specialties?.[0] || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!date || !time || !specialty) {
            setError('יש למלא את כל השדות.');
            return;
        }

        setIsLoading(true);

        try {
            const appointmentDateTime = new Date(`${date}T${time}`);

            const newAppointment = {
                user_id: patient.id,
                patient_name: patient.full_name,
                doctor_id: doctor.id,
                doctor: doctor.full_name,
                specialty: specialty,
                clinic: doctor.clinic_name || 'מרפאה פרטית',
                date: appointmentDateTime.toISOString(),
                status: 'מאושר', // Doctor-scheduled appointments are auto-approved
                is_premium: patient.subscription_type === 'premium',
            };

            await Appointment.create(newAppointment);

            await SystemNotification.create({
                user_id: patient.id,
                title: 'נקבע לך תור חדש',
                message: `ד"ר ${doctor.full_name} קבע לך תור בתחום ${specialty} בתאריך ${appointmentDateTime.toLocaleDateString('he-IL')} בשעה ${time}.`,
                type: 'appointment',
                priority: 'high',
            });

            alert('התור נקבע בהצלחה והמטופל קיבל הודעה.');
            onAppointmentScheduled();

        } catch (err) {
            console.error('Error scheduling appointment:', err);
            setError('אירעה שגיאה בקביעת התור.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>קביעת תור עבור {patient.full_name}</DialogTitle>
                    <DialogDescription>
                        מלא את פרטי התור. המטופל יקבל הודעה על התור שנקבע.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="specialty">תחום התמחות</Label>
                        <Input
                            id="specialty"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            placeholder="לדוגמה: רפואת ילדים"
                            required
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="date">תאריך</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="time">שעה</Label>
                            <Input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                            ביטול
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            קבע תור
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}