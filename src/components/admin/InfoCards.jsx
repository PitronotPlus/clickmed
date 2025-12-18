import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Banknote, MoreHorizontal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const satisfactionData = [
    { name: 'Satisfied', value: 65 },
    { name: 'Not Satisfied', value: 35 },
];
const COLORS = ['#22C55E', '#EF4444'];

const NewAlertsCard = ({ count = 0 }) => (
    <Card className="shadow-none border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">התראות חדשות</CardTitle>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <AlertTriangle className="w-12 h-12 text-yellow-400" />
            <div className="text-right">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-gray-500">התראות שחובה לטפל</p>
            </div>
        </CardContent>
    </Card>
);

const TotalRevenueCard = ({ amount = 0 }) => (
    <Card className="shadow-none border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">סה"כ לפני מיסוי</CardTitle>
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <Banknote className="w-12 h-12 text-green-500" />
            <div className="text-right">
                <p className="text-2xl font-bold">₪ {amount.toLocaleString()}</p>
                <p className="text-xs text-gray-500">לאחר קיזוז הוצאות רופאים</p>
            </div>
        </CardContent>
    </Card>
);

const StatisticsCard = () => (
    <Card className="shadow-none border-gray-200">
        <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#5932EA] text-center">סטטיסטיקות</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 pt-2">
            <div className="flex justify-between border-b pb-1">
                <span>תורים שנקבעו השבוע</span>
                <span className="font-bold">128</span>
            </div>
            <div className="flex justify-between border-b pb-1">
                <span>תורים שבוטלו ע"י המשרד</span>
                <span className="font-bold">2</span>
            </div>
            <div className="flex justify-between">
                <span>אחוז תורים מאושרים ידנית</span>
                <span className="font-bold">64%</span>
            </div>
        </CardContent>
    </Card>
);

const SatisfactionSurveyCard = () => (
    <Card className="shadow-none border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold">סקר שביעות רצון</CardTitle>
             <MoreHorizontal className="w-4 h-4 text-gray-400" />
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <div className="w-24 h-24">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={satisfactionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={40}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {satisfactionData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="text-right">
                <p className="text-2xl font-bold">258</p>
                <p className="text-xs text-gray-500">דירוגים</p>
            </div>
        </CardContent>
    </Card>
);

export default function InfoCards({ stats = {} }) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <NewAlertsCard count={stats.newAlerts || 0} />
            <TotalRevenueCard amount={stats.totalRevenue || 0} />
            <StatisticsCard />
            <SatisfactionSurveyCard />
        </div>
    );
}