import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DoctorAvailability } from '@/entities/DoctorAvailability';
import { Loader2, Clock } from 'lucide-react';

const daysOfWeek = [
    { id: 0, name: 'ראשון' },
    { id: 1, name: 'שני' },
    { id: 2, name: 'שלישי' },
    { id: 3, name: 'רביעי' },
    { id: 4, name: 'חמישי' },
    { id: 5, name: 'שישי' },
    { id: 6, name: 'שבת' }
];

export default function EditAvailabilityModal({ user, isOpen, onClose, onAvailabilityUpdate }) {
    const [availability, setAvailability] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && user?.id) {
            const loadAvailability = async () => {
                setLoadingData(true);
                try {
                    const existingAvailability = await DoctorAvailability.filter({ doctor_id: user.id });
                    const availabilityMap = {};
                    
                    // Initialize all days with default values
                    daysOfWeek.forEach(day => {
                        availabilityMap[day.id] = {
                            is_available: false,
                            start_time: '09:00',
                            end_time: '17:00',
                            appointment_duration: 30,
                            break_start: '12:00',
                            break_end: '13:00',
                            location: ''
                        };
                    });
                    
                    // Override with existing data
                    existingAvailability.forEach(avail => {
                        availabilityMap[avail.day_of_week] = avail;
                    });
                    
                    setAvailability(availabilityMap);
                } catch (err) {
                    console.error('Error loading availability:', err);
                    setError('שגיאה בטעינת נתוני הזמינות');
                } finally {
                    setLoadingData(false);
                }
            };
            loadAvailability();
        }
    }, [isOpen, user?.id]);

    const handleDayChange = (dayId, field, value) => {
        setAvailability(prev => ({
            ...prev,
            [dayId]: {
                ...prev[dayId],
                [field]: value
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            // Delete existing availability records for this doctor
            const existingRecords = await DoctorAvailability.filter({ doctor_id: user.id });
            for (const record of existingRecords) {
                await DoctorAvailability.delete(record.id);
            }
            
            // Create new availability records
            for (const [dayId, dayData] of Object.entries(availability)) {
                if (dayData.is_available) {
                    await DoctorAvailability.create({
                        doctor_id: user.id,
                        day_of_week: parseInt(dayId),
                        start_time: dayData.start_time,
                        end_time: dayData.end_time,
                        is_available: dayData.is_available,
                        appointment_duration: dayData.appointment_duration || 30,
                        break_start: dayData.break_start || null,
                        break_end: dayData.break_end || null,
                        location: dayData.location || ''
                    });
                }
            }
            
            onAvailabilityUpdate();
        } catch (err) {
            console.error('Error updating availability:', err);
            setError('שגיאה בעדכון הזמינות');
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingData) {
        return (
            <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
                <DialogContent className="sm:max-w-4xl">
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="mr-2">טוען נתוני זמינות...</span>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose} dir="rtl">
            <DialogContent className="sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        ניהול זמינות שבועית
                    </DialogTitle>
                    <DialogDescription>
                        קבע את ימי העבודה ושעות הזמינות שלך לקבלת תורים
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6 max-h-[60vh] overflow-y-auto pl-2" dir="rtl">
                    {daysOfWeek.map(day => (
                        <div key={day.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">{day.name}</h3>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor={`available-${day.id}`}>זמין</Label>
                                    <Switch
                                        id={`available-${day.id}`}
                                        checked={availability[day.id]?.is_available || false}
                                        onCheckedChange={(checked) => handleDayChange(day.id, 'is_available', checked)}
                                    />
                                </div>
                            </div>
                            
                            {availability[day.id]?.is_available && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" dir="rtl">
                                    <div>
                                        <Label>שעת התחלה</Label>
                                        <Input
                                            type="time"
                                            value={availability[day.id]?.start_time || '09:00'}
                                            onChange={(e) => handleDayChange(day.id, 'start_time', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>שעת סיום</Label>
                                        <Input
                                            type="time"
                                            value={availability[day.id]?.end_time || '17:00'}
                                            onChange={(e) => handleDayChange(day.id, 'end_time', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>משך תור (דקות)</Label>
                                        <Input
                                            type="number"
                                            min="15"
                                            max="120"
                                            step="15"
                                            value={availability[day.id]?.appointment_duration || 30}
                                            onChange={(e) => handleDayChange(day.id, 'appointment_duration', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <Label>הפסקת צהריים - התחלה</Label>
                                        <Input
                                            type="time"
                                            value={availability[day.id]?.break_start || '12:00'}
                                            onChange={(e) => handleDayChange(day.id, 'break_start', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>הפסקת צהריים - סיום</Label>
                                        <Input
                                            type="time"
                                            value={availability[day.id]?.break_end || '13:00'}
                                            onChange={(e) => handleDayChange(day.id, 'break_end', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label>מיקום</Label>
                                        <Input
                                            placeholder="מרפאה פרטית, בית חולים וכו'"
                                            value={availability[day.id]?.location || ''}
                                            onChange={(e) => handleDayChange(day.id, 'location', e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800">
                            {error}
                        </div>
                    )}
                </form>
                
                <DialogFooter dir="rtl">
                    <Button variant="outline" onClick={onClose}>
                        ביטול
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={isLoading}
                        className="bg-[#5932EA] hover:bg-[#4d2ac7]"
                    >
                        {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                        שמור זמינות
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}