import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Stethoscope } from 'lucide-react';
import { format } from 'date-fns';

const statusStyles = {
    'ממתין לאישור': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    'ממתין לתשלום': { bg: 'bg-orange-100', text: 'text-orange-700' },
    'מאושר': { bg: 'bg-green-100', text: 'text-green-700' },
    'טופל': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'בוטל': { bg: 'bg-gray-100', text: 'text-gray-500' }
};

export default function AppointmentDetailsModal({ appointment, isOpen, onClose }) {
    if (!appointment) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="sm:max-w-lg" dir="rtl">
                <DialogHeader dir="rtl">
                    <DialogTitle className="text-right text-2xl font-bold" dir="rtl">פרטי התור</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4" dir="rtl">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg" dir="rtl">
                        <div className="p-3 bg-blue-100 rounded-full">
                           <Stethoscope className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="text-right flex-1" dir="rtl">
                            <h3 className="font-bold text-lg text-right" dir="rtl">{appointment.specialty}</h3>
                            <p className="text-gray-600 text-right" dir="rtl">עם ד"ר {appointment.doctor}</p>
                        </div>
                    </div>
                    <div className="space-y-3" dir="rtl">
                       <div className="flex items-center justify-between" dir="rtl">
                           <Badge className={`${statusStyles[appointment.status]?.bg} ${statusStyles[appointment.status]?.text} px-3 py-1`}>
                               {appointment.status}
                           </Badge>
                           <span className="font-semibold text-right" dir="rtl">:סטטוס</span>
                       </div>
                       <div className="flex items-center justify-between" dir="rtl">
                           <div className="flex items-center gap-2" dir="rtl">
                               <span>{format(new Date(appointment.date), 'dd/MM/yyyy')}</span>
                               <Calendar className="w-4 h-4 text-gray-500" />
                           </div>
                           <span className="font-semibold text-right" dir="rtl">:תאריך</span>
                       </div>
                       <div className="flex items-center justify-between" dir="rtl">
                           <div className="flex items-center gap-2" dir="rtl">
                               <span>{format(new Date(appointment.date), 'HH:mm')}</span>
                               <Clock className="w-4 h-4 text-gray-500" />
                           </div>
                           <span className="font-semibold text-right" dir="rtl">:שעה</span>
                       </div>
                        {appointment.notes && (
                            <div className="pt-2" dir="rtl">
                                <span className="font-semibold text-right" dir="rtl">:הערות</span>
                                <p className="text-gray-700 bg-gray-100 p-2 rounded-md mt-1 text-right" dir="rtl">{appointment.notes}</p>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="flex-row-reverse" dir="rtl">
                    <Button onClick={onClose} variant="outline">סגור</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}