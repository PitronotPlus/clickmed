import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const statusColors = {
    'טופל': 'bg-green-100 text-green-700',
    'בבדיקה': 'bg-yellow-100 text-yellow-700',
    'בקשה בבדיקה': 'bg-yellow-100 text-yellow-700',
    'ממתין לתשלום': 'bg-orange-100 text-orange-700',
    'מאושר': 'bg-green-100 text-green-700',
    'מאושר עבור עליה': 'bg-green-100 text-green-700',
    'נדחה': 'bg-red-100 text-red-700',
    'בקשה נדחתה': 'bg-red-100 text-red-700',
    'מחפש רופא': 'bg-indigo-100 text-indigo-700',
    'מחפש רופא - עדיפות פרמיום': 'bg-purple-100 text-purple-700',
    'ממתין לאישור': 'bg-yellow-100 text-yellow-700',
    'בוטל': 'bg-gray-100 text-gray-500'
};

export default function ActivityHistory({ activities }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>היסטוריית פעילות</CardTitle>
                <Link 
                    to={createPageUrl('MyRequests')}
                    className="text-[#5932EA] text-sm font-semibold hover:underline"
                >
                    צפה בכל הבקשות
                </Link>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-500 mb-2">אין פעילות עדיין</h3>
                        <p className="text-gray-400 mb-4">כשתגיש בקשות, הן יופיעו כאן</p>
                        <Link to={createPageUrl('ScheduleAppointment')}>
                            <Badge className="bg-[#5932EA] text-white cursor-pointer">
                                <Plus className="w-4 h-4 mr-1" />
                                הגש בקשה ראשונה
                            </Badge>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activities.map((activity, index) => (
                            <div key={activity.id || index} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 rounded-lg gap-3">
                                <div className="flex items-start md:items-center gap-4">
                                    <FileText className="w-5 h-5 text-gray-400 mt-1 md:mt-0" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-sm md:text-base">{activity.description || activity.type}</h4>
                                        <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600 mt-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>{format(new Date(activity.date), 'dd/MM/yyyy HH:mm', { locale: he })}</span>
                                            {activity.user_name && (
                                                <>
                                                    <span>|</span>
                                                    <span>{activity.user_name}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Badge className={`${statusColors[activity.status] || 'bg-gray-100 text-gray-700'} self-start md:self-center`}>
                                    {activity.status === 'מאושר עבור עליה' ? 'מאושר' : activity.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}