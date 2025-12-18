import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Calendar, DollarSign } from 'lucide-react';

const StatCard = ({ icon: Icon, title, value, description }) => (
    <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] border-none rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
            <Icon className="h-5 w-5 text-gray-400" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold text-gray-800">{value}</div>
            <p className="text-xs text-gray-500">{description}</p>
        </CardContent>
    </Card>
);

export default function DoctorSummaryCards({ stats }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} title="כלל המטופלים" value={stats.patients} description="מטופלים רשומים תחתיך" />
            <StatCard icon={FileText} title="בקשות ממתינות" value={stats.pendingRequests} description="ממתין לאישור או דחייה" />
            <StatCard icon={Calendar} title="תורים השבוע" value={stats.appointmentsThisWeek} description="פגישות מתוכננות לשבוע הקרוב" />
            <StatCard icon={DollarSign} title="יתרה לתשלום" value={stats.pendingPayout} description="צפי הכנסות מתורים שהושלמו" />
        </div>
    );
}