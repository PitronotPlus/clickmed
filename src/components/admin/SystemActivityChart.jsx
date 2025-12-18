import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SystemActivityChart({ data }) {
    // Mock data for demonstration - in real app this would come from props
    const activityData = data || [
        { day: 'א׳', requests: 12, appointments: 8, users: 3 },
        { day: 'ב׳', requests: 18, appointments: 14, users: 5 },
        { day: 'ג׳', requests: 15, appointments: 11, users: 2 },
        { day: 'ד׳', requests: 22, appointments: 18, users: 7 },
        { day: 'ה׳', requests: 19, appointments: 15, users: 4 },
        { day: 'ו׳', requests: 8, appointments: 6, users: 1 },
        { day: 'ש׳', requests: 3, appointments: 2, users: 0 }
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>פעילות שבועית במערכת</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activityData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip 
                                labelFormatter={(label) => `יום ${label}`}
                                formatter={(value, name) => [
                                    value, 
                                    name === 'requests' ? 'בקשות' : 
                                    name === 'appointments' ? 'תורים' : 'משתמשים חדשים'
                                ]}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="requests" 
                                stroke="#5932EA" 
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="appointments" 
                                stroke="#10B981" 
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="users" 
                                stroke="#F59E0B" 
                                strokeWidth={3}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}