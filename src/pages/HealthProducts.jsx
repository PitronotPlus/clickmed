import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FlaskConical } from 'lucide-react';

export default function HealthProducts() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <FlaskConical className="w-6 h-6" />
                    מוצרים בריאותיים
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12 text-gray-500">
                    <p>אזור המוצרים הבריאותיים בבנייה.</p>
                </div>
            </CardContent>
        </Card>
    );
}