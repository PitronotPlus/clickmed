import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Calendar, 
    FileText, 
    TrendingUp,
    AlertTriangle,
    DollarSign
} from 'lucide-react';

// רכיב שמציג סטטיסטיקות אמיתיות ומעודכנות
export default function AdminSummaryCards({ stats = {} }) {
    console.log('📋 AdminSummaryCards: Displaying stats:', stats);
    
    // הגדרת ערכי ברירת מחדל
    const safeStats = {
        totalUsers: stats.totalUsers || 0,
        totalDoctors: stats.totalDoctors || 0,
        totalClinics: stats.totalClinics || 0,
        totalRequests: stats.totalRequests || 0,
        pendingRequests: stats.pendingRequests || 0,
        totalAppointments: stats.totalAppointments || 0,
        pendingApprovals: stats.pendingApprovals || 0,
        totalRevenue: stats.totalRevenue || 0,
    };

    const cards = [
        {
            title: 'בקשות פתוחות',
            value: safeStats.pendingRequests,
            change: `מתוך ${safeStats.totalRequests} סה"כ`,
            trend: safeStats.pendingRequests > 0 ? 'up' : 'neutral',
            icon: FileText,
            color: 'orange'
        },
        {
            title: 'תורים במערכת',
            value: safeStats.totalAppointments,
            change: 'סה"כ תורים',
            trend: 'up',
            icon: Calendar,
            color: 'green'
        },
        {
            title: 'ממתינים לאישור',
            value: safeStats.pendingApprovals,
            change: 'משתמשים חדשים',
            trend: safeStats.pendingApprovals > 0 ? 'up' : 'neutral',
            icon: AlertTriangle,
            color: 'red'
        },
        {
            title: 'סה"כ הכנסות',
            value: `₪${safeStats.totalRevenue.toLocaleString()}`,
            change: 'מתורים ובקשות שטופלו',
            trend: 'up',
            icon: DollarSign,
            color: 'blue'
        }
    ];

    // Helper function to get the icon based on trend and color
    const getTrendIcon = (trend, color, value) => {
        if (trend === 'up' && (typeof value === 'number' ? value > 0 : true)) {
            if (color === 'green' || color === 'blue') {
                return <TrendingUp className="w-4 h-4 text-green-600" />;
            }
            if (color === 'orange' || color === 'red') {
                return <AlertTriangle className="w-4 h-4 text-red-600" />;
            }
        }
        return null;
    };

    // Helper function to get the text color based on card color
    const getTrendColor = (color) => {
        switch (color) {
            case 'blue': return 'text-blue-600';
            case 'green': return 'text-green-600';
            case 'orange': return 'text-orange-600';
            case 'red': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => (
                <Card key={index} className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] border-none rounded-lg overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            {card.title}
                        </CardTitle>
                        <card.icon className={`h-5 w-5 ${getTrendColor(card.color)}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                            {card.value}
                        </div>
                        <div className={`flex items-center text-xs ${getTrendColor(card.color)}`}>
                            {getTrendIcon(card.trend, card.color, card.value)}
                            <span className="ml-1">{card.change}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}