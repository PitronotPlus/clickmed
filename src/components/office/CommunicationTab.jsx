
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User } from '@/entities/User';
import { SystemNotification } from '@/entities/SystemNotification';

export default function CommunicationTab() {
    const [target, setTarget] = useState('all_patients');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!subject || !message) {
            alert('נא למלא נושא ותוכן הודעה.');
            return;
        }

        setLoading(true);
        try {
            let targetUsers = [];
            if (target === 'all_patients') {
                targetUsers = await User.filter({ user_type: 'patient' });
            } else if (target === 'all_doctors') {
                targetUsers = await User.filter({ user_type: 'doctor' });
            } else {
                // Logic for specific user would be here
            }

            if (targetUsers.length > 0) {
                // Create notifications in batches
                const notificationPromises = targetUsers.map(user => 
                    SystemNotification.create({
                        title: subject,
                        message: message,
                        user_id: user.id,
                        type: 'admin',
                        priority: 'medium'
                    })
                );
                await Promise.all(notificationPromises);
                alert(`ההודעה נשלחה בהצלחה אל ${targetUsers.length} משתמשים.`);
                setSubject('');
                setMessage('');
            } else {
                alert('לא נמצאו משתמשים התואמים לקריטריון.');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('אירעה שגיאה בשליחת ההודעה.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-right">שליחת הודעות למשתמשים</h2>
            <form onSubmit={handleSend} className="space-y-4 max-w-2xl mx-auto">
                <div className="text-right">
                    <Label htmlFor="target">שלח אל</Label>
                    <Select value={target} onValueChange={setTarget}>
                        <SelectTrigger id="target">
                            <SelectValue placeholder="בחר נמענים" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all_patients">כל המטופלים</SelectItem>
                            <SelectItem value="all_doctors">כל הרופאים</SelectItem>
                            {/* <SelectItem value="specific_user" disabled>משתמש ספציפי (בקרוב)</SelectItem> */}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-right">
                    <Label htmlFor="subject">נושא</Label>
                    <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required className="text-right" />
                </div>
                <div className="text-right">
                    <Label htmlFor="message">תוכן ההודעה</Label>
                    <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} className="text-right" />
                </div>
                <div className="text-center">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'שולח...' : 'שלח הודעה'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
