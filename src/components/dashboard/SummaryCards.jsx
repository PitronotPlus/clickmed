import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Plus } from 'lucide-react';

const StatCard = ({ title, count, description, gradientStyle, href }) => (
    <Card className="border-none shadow-[0px_10px_60px_rgba(226,236,249,0.5)] rounded-[10px] bg-white flex-grow w-full">
        <CardContent className="p-4 md:p-5 flex flex-col md:flex-row items-center gap-3 md:gap-4">
            <div className="flex items-center justify-center">
                <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full" style={{ background: gradientStyle }}>
                    <span className="text-xl md:text-3xl font-semibold text-white">{count}</span>
                </div>
            </div>
            <div className="flex flex-col text-center md:text-right flex-1">
                <h3 className="text-base md:text-lg font-bold text-black">{title}</h3>
                <p className="text-xs md:text-sm text-[#828282] mt-1">{description}</p>
                {href && (
                    <Link 
                        to={href}
                        className="text-[#5932EA] text-xs md:text-sm font-semibold mt-2 hover:underline flex items-center justify-center md:justify-start gap-1"
                    >
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
                        קבע תור חדש
                    </Link>
                )}
            </div>
        </CardContent>
    </Card>
);

export default function SummaryCards({ stats }) {
    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <StatCard 
                title="בקשות שטופלו" 
                count={stats.treatment} 
                description="בקשות שהושלמו בהצלחה"
                gradientStyle="linear-gradient(201.18deg, #90E2FF 3.14%, #CDF4FF 86.04%)" 
            />
            <StatCard 
                title="סה״כ בקשות" 
                count={stats.submitted} 
                description="כל הבקשות שהוגשו עד עכשיו"
                gradientStyle="linear-gradient(201.18deg, #FFA3CF 3.14%, #FFD5F3 86.04%)"
                href={createPageUrl('ScheduleAppointment')}
            />
            <StatCard 
                title="ממתינות לתשלום" 
                count={stats.payment} 
                description="בקשות הממתינות לתשלום" 
                gradientStyle="linear-gradient(201.18deg, #FFBEBF 3.14%, #FFE1E2 86.04%)"
            />
        </div>
    );
}