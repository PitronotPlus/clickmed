import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

const plans = [
    {
        name: 'בסיסי',
        price: 'חינם',
        features: [
            'זימון תורים',
            'ניהול תיק רפואי אישי',
            'קבלת התראות ועדכונים',
            'גישה למאגר רופאים',
        ],
        isCurrent: true,
    },
    {
        name: 'פרימיום',
        price: '49 ₪',
        priceSuffix: '/ חודש',
        features: [
            'כל מה שבחבילה הבסיסית',
            'עדיפות בקביעת תורים',
            'זמינות 24/7 לייעוץ רפואי',
            'גישה לרופאים מומחים מובילים',
            'הנחות על בדיקות ויעוצים',
            'תמיכה אישית ב-WhatsApp',
        ],
        isCurrent: false,
        isPopular: true,
    },
    {
        name: 'עסקי',
        price: 'צרו קשר',
        features: [
            'כל מה שבחבילת פרימיום',
            'ניהול עובדים ומשפחות',
            'דוחות וניתוחים מתקדמים',
            'מנהל לקוח אישי',
            'התאמה אישית של המערכת',
        ],
        isCurrent: false,
    }
];

export default function PricingPlansPage() {
    return (
        <div className="p-4 md:p-8" dir="rtl">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">תוכניות המנויים שלנו</h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    בחרו את התוכנית המתאימה ביותר לצרכים שלכם ושדרגו את חווית שירותי הרפואה שלכם.
                </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {plans.map(plan => (
                    <Card 
                        key={plan.name}
                        className={`rounded-xl shadow-lg transition-all duration-300 ${plan.isPopular ? 'border-2 border-[#5932EA] transform scale-105' : 'border'}`}
                    >
                        <CardHeader className="text-center pb-4">
                            {plan.isPopular && (
                                <div className="absolute -top-4 right-1/2 translate-x-1/2">
                                    <span className="bg-[#5932EA] text-white px-4 py-1 rounded-full text-sm font-semibold">הפופולרי ביותר</span>
                                </div>
                            )}
                            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <div className="mb-6">
                                <span className="text-4xl font-extrabold">{plan.price}</span>
                                {plan.priceSuffix && <span className="text-gray-500">{plan.priceSuffix}</span>}
                            </div>
                            <ul className="space-y-4 text-right">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-start">
                                        <Check className="w-5 h-5 text-green-500 ml-3 mt-1 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className={`w-full ${plan.isCurrent ? 'bg-gray-300' : 'bg-[#5932EA] hover:bg-[#4a29c1]'}`}
                                disabled={plan.isCurrent}
                            >
                                {plan.isCurrent ? 'התוכנית הנוכחית שלך' : 'בחר תוכנית'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}