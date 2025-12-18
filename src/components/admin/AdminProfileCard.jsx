import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { User, Phone, Calendar as CalendarIcon, Mail, MapPin, Edit } from 'lucide-react';
import { format } from "date-fns";
import EditProfileModal from '@/components/profile/EditProfileModal';
import { User as UserEntity } from '@/entities/User';

export default function AdminProfileCard() {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [user, setUser] = useState(null);
    
    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await UserEntity.me();
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to fetch admin user:", error);
            }
        };
        fetchUser();
    }, []);

    const displayUser = user || {
        full_name: 'אבי אביאלי',
        id_number: '300145146',
        phone: '050-5005000',
        birth_date: '1985-04-08',
        address: 'האר"י 5, רמת גן',
        email: 'israelisraeli@gmail.com',
        avatar: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/e2b629951_FlipSlothFavIcon.png"
    };

    const info = [
        { icon: User, label: "תעודת זהות:", value: displayUser.id_number, id: "ID" },
        { icon: Phone, label: "נייד:", value: displayUser.phone },
        { icon: CalendarIcon, label: "תאריך לידה:", value: displayUser.birth_date ? format(new Date(displayUser.birth_date), 'dd/MM/yyyy') : '08/04/1985' },
        { icon: MapPin, label: "כתובת:", value: displayUser.address, letter: "f" },
        { icon: Mail, label: "אימייל:", value: displayUser.email },
    ];

    const handleProfileUpdate = async () => {
        try {
            const updatedUser = await UserEntity.me();
            setUser(updatedUser);
            setIsEditModalOpen(false);
        } catch (error) {
            console.error("Failed to refresh user data:", error);
        }
    };

    return (
        <>
            <Card className="bg-white shadow-[0px_10px_60px_rgba(226,236,249,0.5)] rounded-[10px] border-none">
                <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-[#5932EA] text-white h-8 px-4 text-sm font-bold rounded-lg flex items-center justify-center">
                            אדמין
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                <img 
                                    src={displayUser.avatar} 
                                    alt="אדמין" 
                                    className="w-16 h-16 rounded-full object-cover shadow-[0px_0px_22px_rgba(89,50,234,0.19)]" 
                                />
                                <button 
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-dashed border-[#CAC0F9] cursor-pointer hover:bg-gray-100 transition-colors"
                                >
                                    <Edit className="w-3 h-3 text-gray-600" />
                                </button>
                            </div>
                            <h3 className="text-sm font-bold mt-2 text-center">{displayUser.full_name}</h3>
                            <p className="text-xs text-gray-500">גיל 36</p>
                        </div>

                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/b0418f046_cdb68a33e6cd9a426e2c179b7f8531be47d4a87e.png" 
                            alt="כללית" 
                            className="h-8 object-contain" 
                        />
                    </div>

                    <div className="pt-4 border-t space-y-4">
                        {info.map((item, index) => (
                           <div key={index} className="flex items-center justify-between text-sm">
                               <div className="flex items-center gap-2">
                                   <div className="w-5 h-5 border border-[#5932EA] rounded-full flex items-center justify-center shrink-0">
                                       {item.id ? (
                                           <span className="text-xs font-bold text-[#5932EA]">{item.id}</span>
                                       ) : item.letter ? (
                                           <span className="text-xs font-bold text-[#5932EA]">{item.letter}</span>
                                       ) : (
                                           <item.icon className="w-3 h-3 text-[#5932EA]" />
                                       )}
                                   </div>
                                   <span className="font-bold text-[#5932EA]">{item.label}</span>
                               </div>
                               <span className="text-gray-500 font-medium">{item.value}</span>
                           </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {isEditModalOpen && user && (
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