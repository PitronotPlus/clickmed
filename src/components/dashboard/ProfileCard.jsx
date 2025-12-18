
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User as UserIcon, Phone, Calendar as CalendarIcon, Mail, MapPin, Edit } from 'lucide-react';
import { User } from '@/entities/User';
import { format } from "date-fns";
import EditProfileModal from '@/components/profile/EditProfileModal';

// מיפוי לוגואים של קופות חולים
const insuranceLogos = {
    'כללית': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b0418f046_cdb68a33e6cd9a426e2c179b7f8531be47d4a87e.png',
    'מכבי': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/a28c5aa5e_Maccabi_Health_Care_Services_2011_logosvg.png',
    'מאוחדת': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/702b6f392_MeuhedetLogosvg.png',
    'לאומית': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f6a9948c1_Leumit-Logo.png'
};

export default function ProfileCard() {
    const [user, setUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchUser = async () => {
        try {
            const impersonatedUserId = sessionStorage.getItem('impersonatedUserId');
            let currentUser;
            if (impersonatedUserId) {
                currentUser = await User.get(impersonatedUserId);
            } else {
                currentUser = await User.me();
            }
            setUser(currentUser);
        } catch (error) {
            console.error("Failed to fetch user:", error);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleProfileUpdate = () => {
        fetchUser(); // Re-fetch user data after update
        setIsEditModalOpen(false);
    };

    if (!user) {
        return (
            <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] rounded-[10px] border-none min-h-[357px]">
                <CardContent className="p-5 flex items-center justify-center h-full">
                    <p>טוען פרטי משתמש...</p>
                </CardContent>
            </Card>
        );
    }
    
    const birthDate = user.birth_date ? new Date(user.birth_date) : null;
    const age = birthDate ? new Date().getFullYear() - birthDate.getFullYear() : 'לא ידוע';

    const insuranceLogo = insuranceLogos[user.insurance_provider] || insuranceLogos['כללית'];

    const roleMapping = {
        'patient': 'מטופל',
        'doctor': 'רופא',
        'clinic': 'מרפאה',
        'admin': 'מנהל',
        'office': 'משרד'
    };

    const info = [
        { icon: UserIcon, label: "תעודת זהות:", value: user.id_number || 'לא הוזן', id: "ID" },
        { icon: Phone, label: "נייד:", value: user.phone || 'לא הוזן' },
        { icon: CalendarIcon, label: "תאריך לידה:", value: birthDate ? format(birthDate, 'dd/MM/yyyy') : 'לא הוזן' },
        { icon: MapPin, label: "כתובת:", value: user.address || 'לא הוזן', letter: "f" },
        { icon: Mail, label: "אימייל:", value: user.email },
    ];

    return (
        <>
            <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] rounded-[10px] border-none flex flex-col min-h-[357px]">
                <CardContent className="p-4 md:p-5 flex flex-col h-full">
                    <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-6 gap-4">
                        <div
                            className={`text-white h-8 px-4 text-sm font-bold rounded-lg flex items-center justify-center order-3 md:order-1 ${
                                user?.subscription_type === 'premium' && user?.subscription_status === 'active' 
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                                    : 'bg-[#5932EA]'
                            }`}
                        >
                            {user?.subscription_type === 'premium' && user?.subscription_status === 'active' 
                                ? 'מנוי פרמיום' 
                                : roleMapping[user.user_type] || 'לא ידוע'}
                        </div>
                        
                        <div className="flex flex-col items-center order-1 md:order-2">
                            <div className="relative">
                                <img 
                                    src={user.avatar || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/03e9ff525_6d1f028bc30367a84e0b1efd8a8742d7e99fd62a.png"} 
                                    alt="מטופל" 
                                    className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover shadow-[0px_0px_22px_rgba(89,50,234,0.19)]" 
                                />
                                <button onClick={() => setIsEditModalOpen(true)} className="absolute -top-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full flex items-center justify-center shadow-sm cursor-pointer hover:bg-gray-100">
                                    <Edit className="w-2 h-2 md:w-3 md:h-3 text-gray-600" />
                                </button>
                            </div>
                            <h3 className="text-sm font-bold mt-2 text-center">{user.display_name || user.full_name}</h3>
                            <p className="text-xs text-gray-500">גיל {age}</p>
                        </div>

                        <img 
                            src={insuranceLogo} 
                            alt={user.insurance_provider || 'קופת חולים'} 
                            className="h-6 md:h-8 object-contain order-2 md:order-3" 
                        />
                    </div>

                    <div className="pt-4 border-t space-y-3 md:space-y-4 flex-grow">
                        {info.map((item, index) => (
                           <div key={index} className="flex items-center justify-between text-sm overflow-hidden">
                               <div className="flex items-center gap-2 shrink-0">
                                   <div className="w-4 h-4 md:w-5 md:h-5 border border-[#5932EA] rounded-full flex items-center justify-center shrink-0">
                                       {item.id ? (
                                           <span className="text-xs font-bold text-[#5932EA]">{item.id}</span>
                                       ) : item.letter ? (
                                           <span className="text-xs font-bold text-[#5932EA]">{item.letter}</span>
                                       ) : (
                                           <item.icon className="w-2 h-2 md:w-3 md:h-3 text-[#5932EA]" />
                                       )}
                                   </div>
                                   <span className="font-bold text-[#5932EA] text-xs md:text-sm">{item.label}</span>
                               </div>
                               <span className="text-gray-500 font-medium text-xs md:text-sm text-left truncate" title={item.value}>{item.value}</span>
                           </div>
                        ))}
                    </div>
                    
                    {/* WhatsApp Support for Premium Users */}
                    {user?.subscription_type === 'premium' && user?.subscription_status === 'active' && (
                        <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg border border-green-200 shrink-0">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-xs font-bold text-white">W</span>
                                </div>
                                <span className="text-xs font-bold text-green-700">תמיכה פרמיום</span>
                            </div>
                            <button
                                onClick={() => window.open('https://wa.me/972505555555?text=שלום, אני מנוי פרמיום וזקוק לעזרה', '_blank')}
                                className="w-full bg-green-500 hover:bg-green-600 text-white text-xs font-semibold py-2 px-3 rounded-md transition-colors"
                            >
                                צור קשר בוואטסאפ
                            </button>
                        </div>
                    )}
                </CardContent>
            </Card>
            {isEditModalOpen && (
                <EditProfileModal 
                    user={user}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onProfileUpdate={handleProfileUpdate}
                />
            )}
        </>
    );
}
