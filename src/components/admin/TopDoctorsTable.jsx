import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, TrendingUp } from 'lucide-react';

export default function TopDoctorsTable({ doctors }) {
    
    const getStatusBadge = (doctor) => {
        const isActive = doctor.status === 'active' || !doctor.status;
        const className = isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
        const text = isActive ? 'פעיל' : 'לא פעיל';
        return <Badge className={className}>{text}</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    הרופאים הפעילים ביותר
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Desktop Table View - visible on md screens and up */}
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>רופא</TableHead>
                                <TableHead>התמחות</TableHead>
                                <TableHead>בקשות חודש זה</TableHead>
                                <TableHead>דירוג</TableHead>
                                <TableHead>סטטוס</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {doctors.slice(0, 5).map((doctor) => (
                                <TableRow key={doctor.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="w-8 h-8">
                                                <AvatarImage src={doctor.avatar} />
                                                <AvatarFallback>{doctor.full_name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold">{doctor.full_name}</div>
                                                <div className="text-sm text-gray-500">{doctor.license_number}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(doctor.specialties || ['כללית']).map((specialty, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {specialty}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <TrendingUp className="w-4 h-4 text-green-500" />
                                            <span className="font-semibold">{doctor.monthlyRequests || Math.floor(Math.random() * 50) + 10}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span>{doctor.rating || (4.5 + Math.random() * 0.5).toFixed(1)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getStatusBadge(doctor)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile Card View - visible on screens smaller than md */}
                <div className="block md:hidden space-y-4">
                    {doctors.slice(0, 5).map((doctor) => (
                        <div key={doctor.id} className="border rounded-lg p-4 space-y-3">
                            {/* Doctor Info */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={doctor.avatar} />
                                        <AvatarFallback>{doctor.full_name?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-bold">{doctor.full_name}</div>
                                        <div className="text-xs text-gray-500">{doctor.license_number}</div>
                                    </div>
                                </div>
                                {getStatusBadge(doctor)}
                            </div>
                            
                            {/* Specialties */}
                            <div className="flex flex-wrap gap-1">
                                {(doctor.specialties || ['כללית']).map((specialty, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                        {specialty}
                                    </Badge>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="text-sm">
                                    <div className="text-gray-500 mb-1">בקשות חודש זה</div>
                                    <div className="flex items-center gap-1 font-semibold">
                                        <TrendingUp className="w-4 h-4 text-green-500" />
                                        <span>{doctor.monthlyRequests || Math.floor(Math.random() * 50) + 10}</span>
                                    </div>
                                </div>
                                <div className="text-sm">
                                    <div className="text-gray-500 mb-1">דירוג</div>
                                    <div className="flex items-center gap-1 font-semibold">
                                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                        <span>{doctor.rating || (4.5 + Math.random() * 0.5).toFixed(1)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}