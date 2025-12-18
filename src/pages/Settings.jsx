
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Setting } from '@/entities/Setting';
import { Specialty } from '@/entities/Specialty'; // Added Specialty entity import
import { navItems } from '@/components/utils/navigationConfig';
import { 
    Settings as SettingsIcon, 
    Bell, 
    Shield, 
    Stethoscope, 
    Users, 
    Building, 
    Globe,
    Plus,
    Star,
    LayoutGrid
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// New component for managing specialties
const ManageSpecialtiesTab = () => {
    const [specialties, setSpecialties] = useState([]);
    const [newSpecialty, setNewSpecialty] = useState({ name: '', description: '', default_commission_rate: 10 });
    const [isAdding, setIsAdding] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // Added isLoading state

    useEffect(() => {
        loadSpecialties();
    }, []);

    const loadSpecialties = async () => {
        setIsLoading(true); // Set loading to true before fetching
        try {
            const allSpecialties = await Specialty.list('-created_date');
            setSpecialties(allSpecialties);
        } catch (error) {
            console.error('Error loading specialties:', error);
            setSaveStatus('שגיאה בטעינת התמחויות');
            setTimeout(() => setSaveStatus(null), 3000);
        } finally {
            setIsLoading(false); // Set loading to false after fetch completes
        }
    };

    const handleAddSpecialty = async () => {
        if (!newSpecialty.name.trim()) {
            setSaveStatus('שם התמחות לא יכול להיות ריק');
            setTimeout(() => setSaveStatus(null), 3000);
            return;
        }
        
        try {
            await Specialty.create({
                ...newSpecialty,
                is_active: true
            });
            
            setNewSpecialty({ name: '', description: '', default_commission_rate: 10 });
            setIsAdding(false);
            loadSpecialties();
            setSaveStatus('התמחות נוספה בהצלחה');
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error adding specialty:', error);
            setSaveStatus('שגיאה בהוספת התמחות');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const handleToggleActive = async (specialtyId, currentStatus) => {
        try {
            await Specialty.update(specialtyId, { is_active: !currentStatus });
            loadSpecialties();
            setSaveStatus(`התמחות ${!currentStatus ? 'הופעלה' : 'הושבתה'} בהצלחה`);
            setTimeout(() => setSaveStatus(null), 3000);
        } catch (error) {
            console.error('Error updating specialty:', error);
            setSaveStatus('שגיאה בעדכון סטטוס התמחות');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    return (
        <div className="space-y-6" dir="rtl"> {/* Added dir="rtl" to main div */}
            {saveStatus && (
                <Alert className={`${saveStatus.includes('שגיאה') ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'} mb-4`}>
                    <Bell className="h-4 w-4" />
                    <AlertTitle>{saveStatus.includes('שגיאה') ? 'שגיאה' : 'הצלחה'}</AlertTitle>
                    <AlertDescription>{saveStatus}</AlertDescription>
                </Alert>
            )}
            <div className="flex justify-between items-center text-right">
                <h3 className="text-lg font-semibold">ניהול תחומי התמחות</h3>
                <Button onClick={() => setIsAdding(true)} disabled={isAdding}>
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף התמחות
                </Button>
            </div>

            {isAdding && (
                <Card>
                    <CardContent className="p-4 space-y-4 text-right" dir="rtl">
                        <div>
                            <Label htmlFor="specialty-name">שם ההתמחות</Label>
                            <Input
                                id="specialty-name"
                                value={newSpecialty.name}
                                onChange={(e) => setNewSpecialty({...newSpecialty, name: e.target.value})}
                                placeholder="לדוגמה: פסיכיאטריה ילדים"
                                className="text-right"
                            />
                        </div>
                        <div>
                            <Label htmlFor="specialty-description">תיאור</Label>
                            <Textarea
                                id="specialty-description"
                                value={newSpecialty.description}
                                onChange={(e) => setNewSpecialty({...newSpecialty, description: e.target.value})}
                                placeholder="תיאור קצר של התמחות זו"
                                className="text-right"
                            />
                        </div>
                        <div>
                            <Label htmlFor="specialty-commission">שיעור עמלה ברירת מחדל (%)</Label>
                            <Input
                                id="specialty-commission"
                                type="number"
                                value={newSpecialty.default_commission_rate}
                                onChange={(e) => setNewSpecialty({...newSpecialty, default_commission_rate: parseFloat(e.target.value)})}
                                min="0"
                                max="100"
                                className="text-right"
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button onClick={handleAddSpecialty}>שמור</Button>
                            <Button variant="outline" onClick={() => setIsAdding(false)}>ביטול</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid gap-4">
                {isLoading ? ( // Conditional rendering based on isLoading state
                    <p className="text-center text-gray-500">טוען התמחויות...</p>
                ) : specialties.length === 0 ? ( // If not loading and no specialties
                    <p className="text-center text-gray-500">אין התמחויות להצגה. הוסף התמחות חדשה.</p>
                ) : ( // Else, map and render specialties
                    specialties.map(specialty => (
                        <Card key={specialty.id}>
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center text-right" dir="rtl">
                                <div className="mb-2 md:mb-0 md:text-right text-center">
                                    <h4 className="font-semibold">{specialty.name}</h4>
                                    <p className="text-sm text-gray-600">{specialty.description}</p>
                                    <p className="text-xs text-gray-500">עמלה: {specialty.default_commission_rate}%</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={specialty.is_active ? "default" : "secondary"}>
                                        {specialty.is_active ? 'פעיל' : 'לא פעיל'}
                                    </Badge>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleActive(specialty.id, specialty.is_active)}
                                    >
                                        {specialty.is_active ? 'השבת' : 'הפעל'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

function SettingsPageContent() {
    const [settings, setSettings] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState(null);
    const [rolePermissions, setRolePermissions] = useState({});
    const [menuOrder, setMenuOrder] = useState([]);

    useEffect(() => {
        loadSettings();
        loadMenuOrder();
    }, []);

    const loadSettings = async () => {
        try {
            const allSettings = await Setting.list();
            const settingsObj = allSettings.reduce((acc, setting) => {
                acc[setting.key] = setting.value;
                return acc;
            }, {});
            setSettings(settingsObj);
            
            const permissionsData = settingsObj['role_permissions'];
            if (permissionsData) {
                try {
                    setRolePermissions(JSON.parse(permissionsData));
                } catch (error) {
                    console.error('Error parsing role permissions:', error);
                    setRolePermissions({});
                }
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMenuOrder = async () => {
        try {
            const orderSetting = await Setting.filter({ key: 'menu_order' });
            if (orderSetting.length > 0) {
                setMenuOrder(JSON.parse(orderSetting[0].value));
            } else {
                // ברירת מחדל - סדר לפי navItems
                const defaultOrder = navItems.map(item => item.url);
                setMenuOrder(defaultOrder);
            }
        } catch (error) {
            console.error('Error loading menu order:', error);
            const defaultOrder = navItems.map(item => item.url);
            setMenuOrder(defaultOrder);
        }
    };

    const updateSetting = async (key, value, category) => {
        try {
            const existingSetting = await Setting.filter({ key });
            const stringValue = value !== null && value !== undefined ? value.toString() : '';
            
            if (existingSetting.length > 0) {
                await Setting.update(existingSetting[0].id, { value: stringValue });
            } else {
                await Setting.create({ 
                    key, 
                    value: stringValue, 
                    category,
                    description: `הגדרה עבור ${key}`
                });
            }
            setSettings(prev => ({ ...prev, [key]: stringValue }));
            if (key !== 'role_permissions' && key !== 'menu_order') {
                setSaveStatus('נשמר בהצלחה');
                setTimeout(() => setSaveStatus(null), 3000);
            } else if (key === 'menu_order') {
                setSaveStatus('סדר תפריט נשמר בהצלחה');
                setTimeout(() => setSaveStatus(null), 2000);
            }
        } catch (error) {
            console.error('Error saving setting:', error);
            setSaveStatus('שגיאה בשמירה');
            setTimeout(() => setSaveStatus(null), 3000);
        }
    };

    const updateRolePermissions = async (role, pageUrl, enabled) => {
        const newPermissions = { ...rolePermissions };
        if (!newPermissions[role]) newPermissions[role] = [];
        
        if (enabled) {
            if (!newPermissions[role].includes(pageUrl)) {
                newPermissions[role].push(pageUrl);
            }
        } else {
            newPermissions[role] = newPermissions[role].filter(p => p !== pageUrl);
        }
        
        setRolePermissions(newPermissions);
        await updateSetting('role_permissions', JSON.stringify(newPermissions), 'admin');
        setSaveStatus('הרשאות עודכנו');
        setTimeout(() => setSaveStatus(null), 2000);
    };

    const handleMenuReorder = async (result) => {
        if (!result.destination) return;
    
        // Get the full list of items in the current rendered order
        const orderedItems = getOrderedNavItems();
        
        // Perform the reorder operation on this list
        const [reorderedItem] = orderedItems.splice(result.source.index, 1);
        orderedItems.splice(result.destination.index, 0, reorderedItem);
    
        // Create the new order of URLs from the reordered list of objects
        const newOrder = orderedItems.map(item => item.url);
    
        // Update the state and save to the database
        setMenuOrder(newOrder);
        await updateSetting('menu_order', JSON.stringify(newOrder), 'admin');
    };

    const getOrderedNavItems = () => {
        if (menuOrder.length === 0) return navItems;
        
        const ordered = [];
        const itemsMap = navItems.reduce((acc, item) => {
            acc[item.url] = item;
            return acc;
        }, {});

        // Add items in the specified order
        menuOrder.forEach(url => {
            if (itemsMap[url]) {
                ordered.push(itemsMap[url]);
            }
        });

        // Add any new items that aren't in the order yet, preserving their original order among themselves
        navItems.forEach(item => {
            if (!menuOrder.includes(item.url) && !ordered.some(o => o.url === item.url)) {
                ordered.push(item);
            }
        });

        return ordered;
    };

    const getRoles = () => {
        const rolesString = getSetting('system_roles', 'מנהל\nמזכירה\nתמיכה\nמנהל מרפאה');
        return rolesString.split('\n').filter(role => role.trim().length > 0);
    };

    const getSetting = (key, defaultValue = '') => settings[key] || defaultValue;
    const getBoolSetting = (key, defaultValue = false) => settings[key] === 'true' || defaultValue;
    const getNumberSetting = (key, defaultValue = 0) => parseInt(settings[key]) || defaultValue;

    return (
        <div dir="rtl" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl text-right">
                        <SettingsIcon className="w-6 h-6" />
                        הגדרות מערכת
                    </CardTitle>
                </CardHeader>
                 <CardContent>
                    {saveStatus && (
                        <Alert className={`${saveStatus.includes('שגיאה') ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'} mb-4`}>
                            <Bell className="h-4 w-4" />
                            <AlertTitle>{saveStatus.includes('שגיאה') ? 'שגיאה' : 'הצלחה'}</AlertTitle>
                            <AlertDescription>{saveStatus}</AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Tabs defaultValue="admin" className="w-full">
                <TabsList className="grid w-full grid-cols-7"> {/* Changed to grid-cols-7 for new tab */}
                    <TabsTrigger value="doctors" className="flex items-center gap-2"><Stethoscope className="w-4 h-4" />רופאים</TabsTrigger>
                    <TabsTrigger value="patients" className="flex items-center gap-2"><Users className="w-4 h-4" />מטופלים</TabsTrigger>
                    <TabsTrigger value="admin" className="flex items-center gap-2"><Shield className="w-4 h-4" />מנהלה והרשאות</TabsTrigger>
                    <TabsTrigger value="clinics" className="flex items-center gap-2"><Building className="w-4 h-4" />מרפאות</TabsTrigger>
                    <TabsTrigger value="general" className="flex items-center gap-2"><Globe className="w-4 h-4" />כלליות</TabsTrigger>
                    <TabsTrigger value="menu" className="flex items-center gap-2"><LayoutGrid className="w-4 h-4" />סידור תפריט</TabsTrigger>
                    <TabsTrigger value="specialties" className="flex items-center gap-2"><Star className="w-4 h-4" />התמחויות</TabsTrigger> {/* New tab trigger */}
                </TabsList>
                
                <TabsContent value="doctors" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle className="text-right">הגדרות רופאים</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* Removed "סוגי התמחות פעילים" as it's now managed in the 'Specialties' tab */}

                            {/* תעריפי ברירת מחדל לפי תחום */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">תעריפי ברירת מחדל כלליים</Label>
                                <p className="text-sm text-gray-600 mb-3">תמחור בסיסי של 20% שמושלך אוטומטית על רופא חדש אלא אם כן הוגדר אחרת בהתמחות</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="default_commission_rate" className="text-right block mb-2">אחוז עמלה ברירת מחדל (%)</Label>
                                        <Input type="number" id="default_commission_rate" value={getNumberSetting('default_commission_rate', 20)} onChange={(e) => updateSetting('default_commission_rate', e.target.value, 'doctors')} className="text-right" />
                                    </div>
                                    <div>
                                        <Label htmlFor="default_session_price" className="text-right block mb-2">מחיר לפגישה ברירת מחדל (₪)</Label>
                                        <Input type="number" id="default_session_price" value={getNumberSetting('default_session_price', 300)} onChange={(e) => updateSetting('default_session_price', e.target.value, 'doctors')} className="text-right" />
                                    </div>
                                </div>
                            </div>

                            {/* שאלון ברירת מחדל לפי תחום */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">שאלון ברירת מחדל לפי תחום</Label>
                                <p className="text-sm text-gray-600 mb-3">יצירת שאלון שיופיע אוטומטית למטופלים בתחום זה</p>
                                <div className="flex items-center justify-between">
                                    <Switch id="enable_default_questionnaires" checked={getBoolSetting('enable_default_questionnaires', true)} onCheckedChange={(checked) => updateSetting('enable_default_questionnaires', checked, 'doctors')} />
                                    <Label htmlFor="enable_default_questionnaires" className="text-right">הפעל שאלונים אוטומטיים לפי תחום</Label>
                                </div>
                            </div>

                            {/* הרשאות לפי סוג רופא */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">הרשאות לפי סוג רופא</Label>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <Switch id="doctors_can_edit_availability" checked={getBoolSetting('doctors_can_edit_availability', true)} onCheckedChange={(checked) => updateSetting('doctors_can_edit_availability', checked, 'doctors')} />
                                        <Label htmlFor="doctors_can_edit_availability" className="text-right">הרופא יכול לשנות זמינות</Label>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                        <Switch id="doctors_can_approve_appointments" checked={getBoolSetting('doctors_can_approve_appointments', false)} onCheckedChange={(checked) => updateSetting('doctors_can_approve_appointments', checked, 'doctors')} />
                                        <Label htmlFor="doctors_can_approve_appointments" className="text-right">הרופא יכול לאשר תורים לבד</Label>
                                    </div>
                                </div>
                            </div>

                            {/* הצגה למטופלים לפי סוג רופא */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="show_doctors_to_patients" checked={getBoolSetting('show_doctors_to_patients', true)} onCheckedChange={(checked) => updateSetting('show_doctors_to_patients', checked, 'doctors')} />
                                    <Label htmlFor="show_doctors_to_patients" className="text-right">הצגת רופאים למטופלים ברירת מחדל</Label>
                                </div>
                            </div>

                            {/* שימוש ביומן */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">שימוש ביומן</Label>
                                <Select value={getSetting('default_calendar_system', 'internal')} onValueChange={(value) => updateSetting('default_calendar_system', value, 'doctors')}>
                                    <SelectTrigger className="text-right">
                                        <SelectValue placeholder="בחר סוג יומן" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="internal">יומן פנימי</SelectItem>
                                        <SelectItem value="google">Google Calendar</SelectItem>
                                        <SelectItem value="outlook">Outlook Calendar</SelectItem>
                                        <SelectItem value="other">אחר</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* אופן אישור תורים */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">אופן אישור תורים</Label>
                                <Select value={getSetting('appointment_approval_method', 'manual')} onValueChange={(value) => updateSetting('appointment_approval_method', value, 'doctors')}>
                                    <SelectTrigger className="text-right">
                                        <SelectValue placeholder="בחר שיטת אישור" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="automatic">אוטומטי</SelectItem>
                                        <SelectItem value="manual">ידני</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* הצגת דירוג רופא למטופלים */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="show_doctor_rating" checked={getBoolSetting('show_doctor_rating', true)} onCheckedChange={(checked) => updateSetting('show_doctor_rating', checked, 'doctors')} />
                                    <Label htmlFor="show_doctor_rating" className="text-right">הצגת דירוג רופא למטופלים</Label>
                                </div>
                            </div>

                            {/* תורים חוזרים */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="allow_recurring_appointments" checked={getBoolSetting('allow_recurring_appointments', true)} onCheckedChange={(checked) => updateSetting('allow_recurring_appointments', checked, 'doctors')} />
                                    <Label htmlFor="allow_recurring_appointments" className="text-right">ניתן לקבוע לרופא תורים חוזרים</Label>
                                </div>
                            </div>

                            {/* מסמכים חובה לפתיחת פרופיל רופא */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">מסמכים חובה לפתיחת פרופיל רופא</Label>
                                <Textarea 
                                    placeholder="רשום כל מסמך חובה בשורה חדשה (למשל: רישיון, ביטוח, תעודות)..."
                                    value={getSetting('required_doctor_documents', 'רישיון רופא\nביטוח אחריות מקצועית\nתעודת התמחות\nתעודת זהות')}
                                    onChange={(e) => updateSetting('required_doctor_documents', e.target.value, 'doctors')}
                                    className="text-right min-h-[100px]"
                                    dir="rtl"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="patients" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle className="text-right">הגדרות מטופלים</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* מגבלת תורים למטופל */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">מגבלת תורים למטופל</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="max_appointments_per_day" className="text-right block mb-2">מקסימום תורים ביום</Label>
                                        <Input type="number" id="max_appointments_per_day" value={getNumberSetting('max_appointments_per_day', 3)} onChange={(e) => updateSetting('max_appointments_per_day', e.target.value, 'patients')} className="text-right" />
                                    </div>
                                    <div>
                                        <Label htmlFor="max_appointments_per_week" className="text-right block mb-2">מקסימום תורים בשבוע</Label>
                                        <Input type="number" id="max_appointments_per_week" value={getNumberSetting('max_appointments_per_week', 10)} onChange={(e) => updateSetting('max_appointments_per_week', e.target.value, 'patients')} className="text-right" />
                                    </div>
                                </div>
                            </div>

                            {/* תזכורות אוטומטיות */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">תזכורות אוטומטיות</Label>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Switch id="enable_reminders" checked={getBoolSetting('enable_reminders', true)} onCheckedChange={(checked) => updateSetting('enable_reminders', checked, 'patients')} />
                                        <Label htmlFor="enable_reminders" className="text-right">הפעל תזכורות אוטומטיות</Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-right block mb-2">אמצעי תזכורת</Label>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <Switch id="reminder_sms" checked={getBoolSetting('reminder_sms', true)} onCheckedChange={(checked) => updateSetting('reminder_sms', checked, 'patients')} />
                                                    <Label htmlFor="reminder_sms">SMS</Label>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <Switch id="reminder_email" checked={getBoolSetting('reminder_email', true)} onCheckedChange={(checked) => updateSetting('reminder_email', checked, 'patients')} />
                                                    <Label htmlFor="reminder_email">מייל</Label>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <Switch id="reminder_whatsapp" checked={getBoolSetting('reminder_whatsapp', false)} onCheckedChange={(checked) => updateSetting('reminder_whatsapp', checked, 'patients')} />
                                                    <Label htmlFor="reminder_whatsapp">וואטסאפ</Label>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="reminder_time_minutes" className="text-right block mb-2">זמן לפני התור (דקות)</Label>
                                            <Select value={getSetting('reminder_time_minutes', '60')} onValueChange={(value) => updateSetting('reminder_time_minutes', value, 'patients')}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="5">5 דקות</SelectItem>
                                                    <SelectItem value="15">15 דקות</SelectItem>
                                                    <SelectItem value="30">30 דקות</SelectItem>
                                                    <SelectItem value="60">שעה</SelectItem>
                                                    <SelectItem value="120">שעתיים</SelectItem>
                                                    <SelectItem value="1440">יום</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ביטול תור - זמן מינימלי */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">ביטול תור - זמן מינימלי</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="cancellation_hours" className="text-right block mb-2">שעות מינימום לביטול תור</Label>
                                        <Input type="number" id="cancellation_hours" value={getNumberSetting('cancellation_hours', 4)} onChange={(e) => updateSetting('cancellation_hours', e.target.value, 'patients')} className="text-right" />
                                    </div>
                                    <div>
                                        <Label htmlFor="full_refund_hours" className="text-right block mb-2">שעות מינימום להחזר מלא</Label>
                                        <Input type="number" id="full_refund_hours" value={getNumberSetting('full_refund_hours', 48)} onChange={(e) => updateSetting('full_refund_hours', e.target.value, 'patients')} className="text-right" />
                                    </div>
                                </div>
                                <div className="mt-3 text-sm text-gray-600">
                                    <p>• ביטול לפני {getNumberSetting('full_refund_hours', 48)} שעות - החזר מלא</p>
                                    <p>• ביטול לפני {getNumberSetting('cancellation_hours', 4)} שעות - החזר חלקי 50%</p>
                                    <p>• ביטול פחות מ-{getNumberSetting('cancellation_hours', 4)} שעות - ללא החזר</p>
                                </div>
                            </div>

                            {/* אימות טלפון/מייל */}
                            <div className="p-4 border rounded-lg">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Switch id="require_phone_verification" checked={getBoolSetting('require_phone_verification', true)} onCheckedChange={(checked) => updateSetting('require_phone_verification', checked, 'patients')} />
                                        <Label htmlFor="require_phone_verification" className="text-right">דרוש אימות טלפון בעת הרשמה</Label>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Switch id="require_email_verification" checked={getBoolSetting('require_email_verification', true)} onCheckedChange={(checked) => updateSetting('require_email_verification', checked, 'patients')} />
                                        <Label htmlFor="require_email_verification" className="text-right">דרוש אימות מייל בעת הרשמה</Label>
                                    </div>
                                </div>
                            </div>

                            {/* שאלון כללי ראשוני */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="require_initial_questionnaire" checked={getBoolSetting('require_initial_questionnaire', true)} onCheckedChange={(checked) => updateSetting('require_initial_questionnaire', checked, 'patients')} />
                                    <Label htmlFor="require_initial_questionnaire" className="text-right">שאלון כללי ראשוני חובה</Label>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">כל מטופל עובר שאלון בסיסי טרם תיאום תור</p>
                            </div>

                            {/* תיעוד סיבת פנייה חובה */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="require_reason_description" checked={getBoolSetting('require_reason_description', true)} onCheckedChange={(checked) => updateSetting('require_reason_description', checked, 'patients')} />
                                    <Label htmlFor="require_reason_description" className="text-right">תיעוד סיבת פנייה חובה</Label>
                                </div>
                            </div>

                            {/* מגבלות גיל/מין לפי תחום */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">מגבלות גיל/מין לפי תחום</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Switch id="enable_age_restrictions" checked={getBoolSetting('enable_age_restrictions', false)} onCheckedChange={(checked) => updateSetting('enable_age_restrictions', checked, 'patients')} />
                                        <Label htmlFor="enable_age_restrictions" className="text-right">הפעל מגבלות גיל לפי תחום</Label>
                                    </div>
                                    {getBoolSetting('enable_age_restrictions') && (
                                        <div className="grid grid-cols-2 gap-3 mr-6">
                                            <div>
                                                <Label htmlFor="min_age" className="text-right block mb-1">גיל מינימום</Label>
                                                <Input type="number" id="min_age" value={getNumberSetting('min_age', 0)} onChange={(e) => updateSetting('min_age', e.target.value, 'patients')} className="text-right" />
                                            </div>
                                            <div>
                                                <Label htmlFor="max_age" className="text-right block mb-1">גיל מקסימום</Label>
                                                <Input type="number" id="max_age" value={getNumberSetting('max_age', 120)} onChange={(e) => updateSetting('max_age', e.target.value, 'patients')} className="text-right" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* מגבלות קביעת תור כפול */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="allow_duplicate_appointments" checked={getBoolSetting('allow_duplicate_appointments', false)} onCheckedChange={(checked) => updateSetting('allow_duplicate_appointments', checked, 'patients')} />
                                    <Label htmlFor="allow_duplicate_appointments" className="text-right">אפשר קביעת תור כפול לאותו תחום/יום</Label>
                                </div>
                            </div>

                            {/* קביעת זמן בין פגישות חוזרות */}
                            <div className="p-4 border rounded-lg">
                                <Label htmlFor="days_between_recurring_appointments" className="text-right block text-base font-semibold mb-2">זמן מינימום בין פגישות חוזרות (ימים)</Label>
                                <Input type="number" id="days_between_recurring_appointments" value={getNumberSetting('days_between_recurring_appointments', 7)} onChange={(e) => updateSetting('days_between_recurring_appointments', e.target.value, 'patients')} className="text-right max-w-xs" />
                                <p className="text-sm text-gray-600 mt-2">חייבים לפחות {getNumberSetting('days_between_recurring_appointments', 7)} ימים בין כל פגישה</p>
                            </div>

                            {/* דרישת קבצים בעת בקשת תור */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <Switch id="require_files_for_appointments" checked={getBoolSetting('require_files_for_appointments', false)} onCheckedChange={(checked) => updateSetting('require_files_for_appointments', checked, 'patients')} />
                                    <Label htmlFor="require_files_for_appointments" className="text-right">דרוש קבצים בעת בקשת תור</Label>
                                </div>
                                {getBoolSetting('require_files_for_appointments') && (
                                    <Textarea 
                                        placeholder="רשום סוגי קבצים נדרשים (סיכום רפואי קודם, הפנייה, וכו')..."
                                        value={getSetting('required_appointment_files', 'סיכום רפואי קודם\nהפנייה מרופא המשפחה\nתוצאות בדיקות עדכניות')}
                                        onChange={(e) => updateSetting('required_appointment_files', e.target.value, 'patients')}
                                        className="text-right min-h-[80px]"
                                        dir="rtl"
                                    />
                                )}
                            </div>

                            {/* סימון מטופלים עם תגית מיוחדת */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">תגיות מיוחדות למטופלים</Label>
                                <p className="text-sm text-gray-600 mb-3">אפשרות לסמן מטופל ולהפעיל חוקים שונים</p>
                                <Textarea 
                                    placeholder="רשום תגיות זמינות (VIP, מורכב, מסוכן, וכו')..."
                                    value={getSetting('patient_tags', 'VIP\nמורכב\nמסוכן\nדחוף\nחדש\nמטופל חוזר')}
                                    onChange={(e) => updateSetting('patient_tags', e.target.value, 'patients')}
                                    className="text-right min-h-[100px]"
                                    dir="rtl"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admin" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle className="text-right">ניהול תפקידים והרשאות גישה לתפריט</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label className="text-right block text-base font-semibold">תפקידים במערכת</Label>
                                <Textarea 
                                    placeholder="הגדר את התפקידים השונים, כל תפקיד בשורה חדשה..."
                                    value={getSetting('system_roles', 'מנהל\nמזכירה\nתמיכה\nמנהל מרפאה')}
                                    onChange={(e) => updateSetting('system_roles', e.target.value, 'admin')}
                                    className="text-right min-h-[100px]"
                                    dir="rtl"
                                />
                            </div>

                            <div className="space-y-6">
                                {getRoles().map(role => (
                                    <Card key={role} className="border-l-4 border-l-blue-500">
                                        <CardHeader className="pb-3"><CardTitle className="text-right text-lg">{role}</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {navItems.map(page => (
                                                    <div key={page.url} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border">
                                                        <div>
                                                            <Label htmlFor={`${role}-${page.url}`} className="text-sm font-medium">{page.title}</Label>
                                                            <p className="text-xs text-gray-500">{page.description}</p>
                                                        </div>
                                                        <Switch
                                                            id={`${role}-${page.url}`}
                                                            checked={rolePermissions[role]?.includes(page.url) || false}
                                                            onCheckedChange={(checked) => updateRolePermissions(role, page.url, checked)}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="clinics" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle className="text-right">הגדרות מרפאות חיצוניות</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* סוגי מרפאות */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">סוגי מרפאות</Label>
                                <Textarea 
                                    placeholder="רשום סוגי מרפאות זמינים..."
                                    value={getSetting('clinic_types', 'פרטית\nציבורית\nקופת חולים\nמרפאת התמחות\nמרכז רפואי')}
                                    onChange={(e) => updateSetting('clinic_types', e.target.value, 'clinics')}
                                    className="text-right min-h-[100px]"
                                    dir="rtl"
                                />
                            </div>

                            {/* זמינות ברירת מחדל */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">זמינות ברירת מחדל</Label>
                                <p className="text-sm text-gray-600 mb-3">שעות פעילות שיושלכו אוטומטית על מרפאה חדשה</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="default_clinic_start_time" className="text-right block mb-2">שעת התחלה</Label>
                                        <Input type="time" id="default_clinic_start_time" value={getSetting('default_clinic_start_time', '08:00')} onChange={(e) => updateSetting('default_clinic_start_time', e.target.value, 'clinics')} className="text-right" />
                                    </div>
                                    <div>
                                        <Label htmlFor="default_clinic_end_time" className="text-right block mb-2">שעת סיום</Label>
                                        <Input type="time" id="default_clinic_end_time" value={getSetting('default_clinic_end_time', '18:00')} onChange={(e) => updateSetting('default_clinic_end_time', e.target.value, 'clinics')} className="text-right" />
                                    </div>
                                </div>
                            </div>

                            {/* שיוך תחומים לכל מרפאה */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">תחומי טיפול זמינים (ברירת מחדל)</Label>
                                <Textarea 
                                    placeholder="רשום תחומי טיפול זמינים במרפאות..."
                                    value={getSetting('default_clinic_specialties', 'רפואת משפחה\nפנימית\nילדים\nנשים\nעיניים\nאוזן אף גרון')}
                                    onChange={(e) => updateSetting('default_clinic_specialties', e.target.value, 'clinics')}
                                    className="text-right min-h-[120px]"
                                    dir="rtl"
                                />
                            </div>

                            {/* מנהל מרפאה ברירת מחדל */}
                            <div className="p-4 border rounded-lg">
                                <Label htmlFor="default_clinic_manager_role" className="text-right block text-base font-semibold mb-3">תפקיד מנהל מרפאה ברירת מחדל</Label>
                                <Input id="default_clinic_manager_role" value={getSetting('default_clinic_manager_role', 'מנהל מרפאה')} onChange={(e) => updateSetting('default_clinic_manager_role', e.target.value, 'clinics')} className="text-right" />
                            </div>

                            {/* כמות רופאים מקסימלית */}
                            <div className="p-4 border rounded-lg">
                                <Label htmlFor="max_doctors_per_clinic" className="text-right block text-base font-semibold mb-2">מספר רופאים מקסימלי במרפאה</Label>
                                <Input type="number" id="max_doctors_per_clinic" value={getNumberSetting('max_doctors_per_clinic', 50)} onChange={(e) => updateSetting('max_doctors_per_clinic', e.target.value, 'clinics')} className="text-right max-w-xs" />
                            </div>

                            {/* שיעור עמלה ברירת מחדל */}
                            <div className="p-4 border rounded-lg">
                                <Label htmlFor="default_commission_rate_clinic" className="text-right block text-base font-semibold mb-2">שיעור עמלת ברירת מחדל למרפאות (%)</Label>
                                <Input type="number" id="default_commission_rate_clinic" value={getNumberSetting('default_commission_rate_clinic', 10)} onChange={(e) => updateSetting('default_commission_rate_clinic', e.target.value, 'clinics')} className="text-right max-w-xs" />
                            </div>

                            {/* תדירות תשלום למרפאות */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">תדירות תשלום למרפאות</Label>
                                <Select value={getSetting('clinic_payout_schedule', 'monthly')} onValueChange={(value) => updateSetting('clinic_payout_schedule', value, 'clinics')}>
                                    <SelectTrigger className="text-right max-w-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">שבועי</SelectItem>
                                        <SelectItem value="monthly">חודשי</SelectItem>
                                        <SelectItem value="quarterly">רבעוני</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="general" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle className="text-right">הגדרות כלליות</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            {/* מרחק תור מקסימלי מהיום */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">מרחק תור מקסימלי מהיום</Label>
                                <Select value={getSetting('max_appointment_days_ahead', '30')} onValueChange={(value) => updateSetting('max_appointment_days_ahead', value, 'general')}>
                                    <SelectTrigger className="text-right max-w-xs">
                                        <SelectValue placeholder="בחר מספר ימים" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 ימים</SelectItem>
                                        <SelectItem value="14">14 ימים</SelectItem>
                                        <SelectItem value="30">30 ימים</SelectItem>
                                        <SelectItem value="60">60 ימים</SelectItem>
                                        <SelectItem value="90">90 ימים</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* זמן ביטול תור */}
                            <div className="p-4 border rounded-lg">
                                <Label htmlFor="cancellation_hours_general" className="text-right block text-base font-semibold mb-2">זמן ביטול תור (שעות מראש)</Label>
                                <Input type="number" id="cancellation_hours_general" value={getNumberSetting('cancellation_hours_general', 4)} onChange={(e) => updateSetting('cancellation_hours_general', e.target.value, 'general')} className="text-right max-w-xs" />
                                <p className="text-sm text-gray-600 mt-2">מינימום שעות לביטול תור מראש והחזרת הבקשה לזירה</p>
                            </div>

                            {/* הפעלת "פינג פונג" לתיאום */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">הפעלת "פינג פונג" לתיאום</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Switch id="enable_ping_pong" checked={getBoolSetting('enable_ping_pong', true)} onCheckedChange={(checked) => updateSetting('enable_ping_pong', checked, 'general')} />
                                        <Label htmlFor="enable_ping_pong" className="text-right">מערכת שליחת הצעות תור חוזרות</Label>
                                    </div>
                                    {getBoolSetting('enable_ping_pong') && (
                                        <div className="mr-6">
                                            <Label htmlFor="ping_pong_rounds" className="text-right block mb-2">מספר סבבים מקסימלי</Label>
                                            <Input type="number" id="ping_pong_rounds" value={getNumberSetting('ping_pong_rounds', 3)} onChange={(e) => updateSetting('ping_pong_rounds', e.target.value, 'general')} className="text-right max-w-xs" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* תורים דחופים */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="enable_urgent_appointments" checked={getBoolSetting('enable_urgent_appointments', true)} onCheckedChange={(checked) => updateSetting('enable_urgent_appointments', checked, 'general')} />
                                    <Label htmlFor="enable_urgent_appointments" className="text-right">אפשרות לסמן בקשה כדחופה</Label>
                                </div>
                            </div>

                            {/* זמינות לפי תחום */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="availability_by_specialty" checked={getBoolSetting('availability_by_specialty', false)} onCheckedChange={(checked) => updateSetting('availability_by_specialty', checked, 'general')} />
                                    <Label htmlFor="availability_by_specialty" className="text-right">הפעלת חישוב זמינות לפי תחום התמחות</Label>
                                </div>
                            </div>

                            {/* קביעת תור ללא רופא */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="allow_appointment_without_doctor" checked={getBoolSetting('allow_appointment_without_doctor', true)} onCheckedChange={(checked) => updateSetting('allow_appointment_without_doctor', checked, 'general')} />
                                    <Label htmlFor="allow_appointment_without_doctor" className="text-right">ניתן לקבוע תור ללא רופא (הצעה פתוחה)</Label>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">המטופל יציע זמן, והמנהל ישייך לרופא</p>
                            </div>

                            {/* מנגנון אישור כפול */}
                            <div className="p-4 border rounded-lg">
                                <div className="flex items-center justify-between">
                                    <Switch id="require_double_approval" checked={getBoolSetting('require_double_approval', false)} onCheckedChange={(checked) => updateSetting('require_double_approval', checked, 'general')} />
                                    <Label htmlFor="require_double_approval" className="text-right">מנגנון אישור כפול</Label>
                                </div>
                                <p className="text-sm text-gray-600 mt-2">תור צריך לקבל אישור גם מהרופא וגם מהמזכירה</p>
                            </div>

                            {/* שם האתר */}
                            <div className="p-4 border rounded-lg">
                                <Label htmlFor="site_name" className="text-right block text-base font-semibold mb-2">שם האתר</Label>
                                <Input id="site_name" value={getSetting('site_name', 'Clickmed 360')} onChange={(e) => updateSetting('site_name', e.target.value, 'general')} className="text-right" />
                            </div>

                            {/* אימייל תמיכה */}
                            <div className="p-4 border rounded-lg">
                                <Label htmlFor="support_email" className="text-right block text-base font-semibold mb-2">אימייל תמיכה</Label>
                                <Input type="email" id="support_email" value={getSetting('support_email', 'support@clickmed.com')} onChange={(e) => updateSetting('support_email', e.target.value, 'general')} className="text-right" dir="ltr" />
                            </div>

                            {/* מצב תחזוקה */}
                            <div className="p-4 border rounded-lg">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Switch id="enable_maintenance_mode" checked={getBoolSetting('enable_maintenance_mode', false)} onCheckedChange={(checked) => updateSetting('enable_maintenance_mode', checked, 'general')} />
                                        <Label htmlFor="enable_maintenance_mode" className="text-right">הפעל מצב תחזוקה</Label>
                                    </div>
                                    {getBoolSetting('enable_maintenance_mode') && (
                                        <div className="mr-6">
                                            <Label htmlFor="maintenance_mode_message" className="text-right block mb-2">הודעת תחזוקה</Label>
                                            <Textarea id="maintenance_mode_message" value={getSetting('maintenance_mode_message', 'המערכת כרגע בתחזוקה. נשוב בקרוב.')} onChange={(e) => updateSetting('maintenance_mode_message', e.target.value, 'general')} className="text-right" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* דוחות אוטומטיים */}
                            <div className="p-4 border rounded-lg">
                                <Label className="text-right block text-base font-semibold mb-3">דוחות אוטומטיים</Label>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Switch id="enable_auto_reports" checked={getBoolSetting('enable_auto_reports', true)} onCheckedChange={(checked) => updateSetting('enable_auto_reports', checked, 'general')} />
                                        <Label htmlFor="enable_auto_reports" className="text-right">הפעל דוחות אוטומטיים</Label>
                                    </div>
                                    {getBoolSetting('enable_auto_reports') && (
                                        <div className="mr-6">
                                            <Label className="text-right block mb-2">תדירות שליחה</Label>
                                            <Select value={getSetting('auto_report_frequency', 'weekly')} onValueChange={(value) => updateSetting('auto_report_frequency', value, 'general')}>
                                                <SelectTrigger className="max-w-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="daily">יומי</SelectItem>
                                                    <SelectItem value="weekly">שבועי</SelectItem>
                                                    <SelectItem value="monthly">חודשי</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* New TabsContent for Specialties Management */}
                <TabsContent value="specialties" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle className="text-right">ניהול תחומי התמחות</CardTitle></CardHeader>
                        <CardContent>
                            <ManageSpecialtiesTab />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Existing TabsContent for Menu Ordering */}
                <TabsContent value="menu" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader><CardTitle className="text-right">סידור התפריט</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">
                                גרור ושחרר כדי לשנות את סדר הדפים בתפריט. השינויים יחולו על כל המשתמשים.
                            </p>
                            
                            <DragDropContext onDragEnd={handleMenuReorder}>
                                <Droppable droppableId="menu-items">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                            {getOrderedNavItems().map((item, index) => (
                                                <Draggable key={item.url} draggableId={item.url} index={index}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`flex items-center gap-3 p-4 rounded-lg border-2 ${
                                                                snapshot.isDragging 
                                                                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                                                                    : 'border-gray-200 bg-white hover:border-gray-300'
                                                            } transition-all cursor-move`}
                                                        >
                                                            {item.icon && <item.icon className="w-5 h-5 text-gray-500" />}
                                                            <div className="flex-1">
                                                                <h4 className="font-semibold">{item.title}</h4>
                                                                <p className="text-sm text-gray-500">{item.description}</p>
                                                            </div>
                                                            <div className="text-xs text-gray-400">
                                                                {index + 1}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function Settings() {
    return (
        <ProtectedRoute requiredRoles={['admin']}>
            <SettingsPageContent />
        </ProtectedRoute>
    );
}
