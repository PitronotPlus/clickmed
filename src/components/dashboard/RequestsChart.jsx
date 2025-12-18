import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FileQuestion } from 'lucide-react';

const COLORS = ['#4623E9', '#8A4FFF', '#FF4D8A', '#FF85AF', '#FFBEBF', '#90E2FF', '#A5D6A7', '#FFCC80'];

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border rounded shadow-lg text-sm">
                <p className="font-bold">{`${payload[0].name}: ${payload[0].value}`}</p>
            </div>
        );
    }
    return null;
};

export default function RequestsChart({ data = [] }) {
    return (
        <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] rounded-[10px] border-none h-[484px] lg:h-[357px] flex flex-col">
            <CardContent className="p-4 flex-1 relative flex items-center justify-center">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip content={<CustomTooltip />} />
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius="65%"
                                outerRadius="85%"
                                fill="#8884d8"
                                paddingAngle={3}
                                labelLine={false}
                                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);

                                    return (
                                        <text x={x} y={y} fill="#333" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-semibold">
                                            {`${data[index].name}`}
                                        </text>
                                    );
                                }}
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <defs>
                                {COLORS.map((color, index) => (
                                    <linearGradient key={`grad-${index}`} id={`grad${index}`} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                                        <stop offset="100%" stopColor={color} stopOpacity={1} />
                                    </linearGradient>
                                ))}
                            </defs>
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="text-center text-gray-500">
                        <FileQuestion className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="font-bold text-lg">אין נתוני בקשות</h3>
                        <p className="text-sm">כאשר תגישו בקשות, הניתוח שלהן יופיע כאן.</p>
                    </div>
                )}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-center font-bold text-lg text-gray-800">סוגי</span>
                    <span className="text-center font-bold text-lg text-gray-800">בקשות</span>
                </div>
            </CardContent>
        </Card>
    );
}