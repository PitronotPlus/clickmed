import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, Send, Youtube, Globe, MessageSquare, Phone } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { User } from '@/entities/User';
import SocialLinksEditModal from './SocialLinksEditModal';

const COLORS = ['#22C55E', '#E5E7EB'];

export default function CompletionChart() {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [userLinks, setUserLinks] = useState({
        website: '',
        youtube: '',
        whatsapp: '',
        telegram: '',
        phone: ''
    });
    const [user, setUser] = useState(null);
    const [completionPercentage, setCompletionPercentage] = useState(0);

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            const currentUser = await User.me();
            setUser(currentUser);
            
            setUserLinks({
                website: currentUser.website || '',
                youtube: currentUser.youtube || '',
                whatsapp: currentUser.whatsapp || '',
                telegram: currentUser.telegram || '',
                phone: currentUser.phone || ''
            });

            // Calculate completion percentage
            const percentage = calculateCompletionPercentage(currentUser);
            setCompletionPercentage(percentage);
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const calculateCompletionPercentage = (userData) => {
        const basicFields = [
            'full_name',
            'email', 
            'phone',
            'address',
            'birth_date',
            'insurance_provider'
        ];

        const socialFields = [
            'website',
            'youtube', 
            'whatsapp',
            'telegram'
        ];

        // Count completed basic fields (90% of total)
        let completedBasicFields = 0;
        basicFields.forEach(field => {
            if (userData[field] && userData[field].toString().trim() !== '') {
                completedBasicFields++;
            }
        });

        // Basic completion is worth 90%
        const basicCompletionPercent = (completedBasicFields / basicFields.length) * 90;

        // Count social links (10% of total)
        let completedSocialFields = 0;
        socialFields.forEach(field => {
            if (userData[field] && userData[field].toString().trim() !== '') {
                completedSocialFields++;
            }
        });

        // Social completion is worth 10%
        const socialCompletionPercent = completedSocialFields > 0 ? 10 : 0;

        return Math.round(basicCompletionPercent + socialCompletionPercent);
    };

    const loadUserLinks = async () => {
        await loadUserData(); // This will recalculate everything
    };

    const handleSocialLinkClick = (platform) => {
        const link = userLinks[platform];
        if (link) {
            if (platform === 'phone') {
                window.open(`tel:${link}`, '_self');
            } else {
                window.open(link, '_blank');
            }
        }
    };

    const renderSocialIcons = () => {
        const icons = [];

        if (userLinks.website) {
            icons.push(
                <Globe 
                    key="website"
                    className="w-6 h-6 text-gray-600 cursor-pointer hover:text-[#5932EA]" 
                    onClick={() => handleSocialLinkClick('website')}
                />
            );
        }

        if (userLinks.youtube) {
            icons.push(
                <Youtube 
                    key="youtube"
                    className="w-6 h-6 text-gray-600 cursor-pointer hover:text-red-500" 
                    onClick={() => handleSocialLinkClick('youtube')}
                />
            );
        }

        if (userLinks.whatsapp) {
            icons.push(
                <MessageSquare 
                    key="whatsapp"
                    className="w-6 h-6 text-gray-600 cursor-pointer hover:text-green-500" 
                    onClick={() => handleSocialLinkClick('whatsapp')}
                />
            );
        }

        if (userLinks.telegram) {
            icons.push(
                <Send 
                    key="telegram"
                    className="w-6 h-6 text-gray-600 cursor-pointer hover:text-blue-500" 
                    onClick={() => handleSocialLinkClick('telegram')}
                />
            );
        }

        if (userLinks.phone) {
            icons.push(
                <Phone 
                    key="phone"
                    className="w-6 h-6 text-gray-600 cursor-pointer hover:text-[#5932EA]" 
                    onClick={() => handleSocialLinkClick('phone')}
                />
            );
        }

        return icons;
    };

    const chartData = [
        { name: 'Completed', value: completionPercentage },
        { name: 'Remaining', value: 100 - completionPercentage },
    ];

    return (
        <>
            <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] rounded-[10px] border-none">
                <CardHeader className="flex flex-row items-center justify-end p-4 border-b">
                    <Button 
                        size="icon" 
                        className="bg-[#5932EA] hover:bg-[#4a29c1] w-7 h-7 rounded-full shrink-0"
                        onClick={() => setIsEditModalOpen(true)}
                    >
                        <Edit className="w-4 h-4 text-white"/>
                    </Button>
                </CardHeader>
                <CardContent className="p-6 flex flex-col items-center justify-center">
                    <div className="w-48 h-48 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={85}
                                    startAngle={90}
                                    endAngle={450}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-gray-800">
                            {completionPercentage}%
                        </div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">פרטי פרופיל שהושלמו</p>
                    <div className="flex gap-4 mt-6">
                        {renderSocialIcons()}
                    </div>
                </CardContent>
            </Card>

            <SocialLinksEditModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={() => {
                    loadUserLinks();
                    setIsEditModalOpen(false);
                }}
            />
        </>
    );
}