import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Users, CreditCard, Gift, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BenefitsCard() {

    const benefits = [
        {
            icon: Star,
            title: 'תורים מועדפים',
            description: 'עדיפות בקביעת תורים',
            available: false
        },
        {
            icon: Clock,
            title: 'זמינות 24/7',
            description: 'גישה לייעוץ רפואי בכל שעה',
            available: false
        },
        {
            icon: Users,
            title: 'רופאים מומחים',
            description: 'גישה לרופאים מובילים',
            available: false
        },
        {
            icon: CreditCard,
            title: 'הנחות מיוחדות',
            description: 'הנחה על בדיקות ויעוצים',
            available: false
        }
    ];

    return (
        <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-none shadow-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Gift className="w-6 h-6 text-purple-600" />
                        הטבות מנויים
                    </CardTitle>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        מנוי בסיסי
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
                            <benefit.icon className={`w-5 h-5 ${benefit.available ? 'text-green-600' : 'text-gray-400'}`} />
                            <div>
                                <p className={`text-sm font-semibold ${benefit.available ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {benefit.title}
                                </p>
                                <p className="text-xs text-gray-500">{benefit.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button asChild className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                        <Link to={createPageUrl('PricingPlans')}>
                            <Shield className="w-4 h-4 mr-2" />
                            שדרג למנוי פרימיום
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                         <Link to={createPageUrl('PricingPlans')}>
                            צפה בכל התוכניות
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}