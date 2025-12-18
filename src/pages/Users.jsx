
import React, { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User as UserIcon, Plus, Search, LogIn } from 'lucide-react';
import { User } from '@/entities/User';
import EditUserModal from '@/components/users/EditUserModal';
import { Input } from '@/components/ui/input';
import { SystemNotification } from '@/entities/SystemNotification'; // New import for SystemNotification
import { createPageUrl } from '@/utils'; // Import createPageUrl

function UsersPageContent() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState(''); // New state for input field value
    const [adminUser, setAdminUser] = useState(null); // State to hold the current admin user

    useEffect(() => {
        const init = async () => {
            await fetchUsers();
            const currentUser = await User.me();
            setAdminUser(currentUser);
        };
        init();

        // האזנה לחיפוש גלובלי
        const handleGlobalSearch = (event) => {
            setSearchTerm(event.detail);
            setInputValue(event.detail);
        };

        window.addEventListener('globalSearch', handleGlobalSearch);

        return () => {
            window.removeEventListener('globalSearch', handleGlobalSearch);
        };
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            console.log('Attempting to fetch users...');

            // בדיקה אם המשתמש מחובר ויש לו הרשאות
            const currentUser = await User.me();
            console.log('Current user:', currentUser);

            if (!currentUser) {
                throw new Error('משתמש לא מחובר');
            }

            const isAdmin = currentUser.permissions?.includes('admin') || currentUser.role === 'admin';
            if (!isAdmin) {
                throw new Error('אין הרשאות מנהל לצפייה במשתמשים');
            }

            // נסה לטעון את כל המשתמשים
            const userList = await User.list();
            console.log('Users fetched successfully:', userList.length, 'users');
            
            // Debug: log each user's status
            userList.forEach(u => {
                console.log(`User: ${u.email}, user_type: ${u.user_type}, status: ${u.status}`);
            });

            setUsers(userList || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);

            // הצגת הודעת שגיאה מפורטת יותר
            let errorMessage = 'שגיאה בטעינת רשימת המשתמשים.';

            if (error.response?.status === 401) {
                errorMessage = 'אין הרשאה לצפות ברשימת המשתמשים. יש להתחבר מחדש או לבקש הרשאות מנהל.';
                // נסה לנתב למסך התחברות
                setTimeout(() => {
                    window.location.href = '/Welcome';
                }, 3000);
            } else if (error.response) {
                // שגיאה מהשרת
                errorMessage += ` קוד שגיאה: ${error.response.status}`;
                if (error.response.data?.message) {
                    errorMessage += ` - ${error.response.data.message}`;
                }
            } else if (error.message) {
                // שגיאה כללית
                errorMessage += ` פרטים: ${error.message}`;
            }

            console.error('Error details:', errorMessage);
            alert(errorMessage);

            // הגדרת רשימה רקה במקרה של שגיאה
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleInviteUser = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleSaveUser = async (userData) => {
        try {
            if (selectedUser) {
                // עדכון משתמש קיים
                console.log('Updating user:', selectedUser.id, userData);
                await User.update(selectedUser.id, userData);
                alert('פרטי המשתמש עודכנו בהצלחה');
            } else {
                // הזמנת משתמש חדש - זה לא אמור לעבוד ישירות
                console.log('Attempting to create new user:', userData);
                alert('יצירת משתמש חדש צריכה להתבצע דרך מערכת ההזמנות של Base44');
                setIsModalOpen(false);
                return;
            }

            setIsModalOpen(false);
            fetchUsers(); // רענון הרשימה
        } catch (error) {
            console.error('Error saving user:', error);

            let errorMessage = 'שגיאה בשמירת פרטי המשתמש.';
            if (error.response?.data?.message) {
                errorMessage += ` ${error.response.data.message}`;
            } else if (error.message) {
                errorMessage += ` ${error.message}`;
            }

            alert(errorMessage);
        }
    };

    const handleApproveUser = async (user) => {
        try {
            await User.update(user.id, { status: 'active' });

            // Send notification to the approved user
            await SystemNotification.create({
                user_id: user.id,
                title: 'חשבונך אושר!',
                message: `שלום ${user.full_name}, חשבונך כ${user.user_type === 'doctor' ? 'רופא' : 'מרפאה'} אושר. כעת יש לך גישה מלאה למערכת.`,
                type: 'system',
                priority: 'high'
            });

            alert('המשתמש אושר בהצלחה!');
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Error approving user:', error);
            alert('אירעה שגיאה באישור המשתמש.');
        }
    };

    // New function to handle search form submission
    const handleSearch = (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        setSearchTerm(inputValue); // Update searchTerm with the current inputValue
    };
    
    const handleImpersonate = (userToImpersonate) => {
        if (!adminUser || !(adminUser.role === 'admin' || adminUser.permissions?.includes('admin'))) {
            alert('רק אדמין יכול לבצע פעולה זו.');
            return;
        }

        // Store both admin and impersonated user IDs in session storage
        sessionStorage.setItem('impersonatedUserId', userToImpersonate.id);
        sessionStorage.setItem('adminUserId', adminUser.id);
        
        // Determine the target dashboard based on user type
        let targetPage = 'Dashboard'; // Default
        if (userToImpersonate.user_type === 'doctor') {
            targetPage = 'DoctorAdminPanel';
        } else if (userToImpersonate.user_type === 'clinic') {
            targetPage = 'Partners';
        } else if (userToImpersonate.user_type === 'office') {
            targetPage = 'Office';
        }
        
        // Redirect to the user's dashboard with a full page reload to apply the new state
        window.location.href = createPageUrl(targetPage);
    };

    const handleTogglePremium = async (user) => {
        try {
            const isPremium = user.subscription_type === 'premium' && user.subscription_status === 'active';
            
            if (isPremium) {
                // Remove premium
                await User.update(user.id, {
                    subscription_type: 'basic',
                    subscription_status: 'active',
                    subscription_end_date: null
                });
                alert('מנוי פרמיום הוסר בהצלחה');
            } else {
                // Add premium with 1 year validity
                const endDate = new Date();
                endDate.setFullYear(endDate.getFullYear() + 1);
                
                await User.update(user.id, {
                    subscription_type: 'premium',
                    subscription_status: 'active',
                    subscription_start_date: new Date().toISOString().split('T')[0],
                    subscription_end_date: endDate.toISOString().split('T')[0]
                });
                alert('מנוי פרמיום הוענק בהצלחה לשנה');
            }
            
            fetchUsers(); // Refresh the list
        } catch (error) {
            console.error('Error toggling premium:', error);
            alert('אירעה שגיאה בעדכון המנוי');
        }
    };

    const filteredUsers = users.filter(user =>
        (user.display_name?.toLowerCase() || user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (user) => {
        const permissions = user.permissions || [];

        if (permissions.includes('admin')) return <Badge className="bg-red-500 text-white">אדמין</Badge>;

        // Show user_type instead of permissions for clearer display
        if (user.user_type === 'doctor') return <Badge className="bg-blue-500 text-white">רופא</Badge>;
        if (user.user_type === 'clinic') return <Badge className="bg-purple-500 text-white">מרפאה</Badge>;
        if (user.user_type === 'office' || permissions.includes('office')) return <Badge className="bg-yellow-500 text-white">משרד</Badge>;
        if (permissions.includes('manager')) return <Badge className="bg-purple-500 text-white">מנהל</Badge>;
        if (permissions.includes('support')) return <Badge className="bg-yellow-500 text-white">תמיכה</Badge>;

        return <Badge variant="secondary">מטופל</Badge>;
    };

    const getStatusBadge = (user) => {
        // Force a fresh read and don't use fallback
        const status = user.status;
        
        console.log(`Status badge for ${user.email}: ${status}`); // Debug log
        
        if (status === 'active') {
            return <Badge className="bg-green-100 text-green-700">פעיל</Badge>;
        } else if (status === 'pending') {
            return <Badge className="bg-yellow-100 text-yellow-700">ממתין לאישור</Badge>;
        } else if (status === 'inactive') {
            return <Badge className="bg-red-100 text-red-700">לא פעיל</Badge>;
        } else {
            // If no status is defined, default based on user type
            const defaultStatusText = user.user_type === 'patient' ? 'פעיל' : 'ממתין לאישור';
            return <Badge className="bg-gray-100 text-gray-700">{defaultStatusText}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="p-6 text-center">
                <div className="inline-flex items-center gap-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5932EA]"></div>
                    <span>טוען משתמשים...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon />
                        ניהול משתמשים
                    </CardTitle>
                    <div className="flex gap-4 items-center">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="חיפוש לפי שם או אימייל..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                className="w-64"
                            />
                            <Button type="submit" size="icon">
                                <Search className="h-4 w-4" />
                            </Button>
                        </form>
                        <Button onClick={handleInviteUser} disabled>
                            <Plus className="mr-2 h-4 w-4" />
                            הזמן משתמש חדש (לא זמין)
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <div className="text-center py-8">
                            <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">לא נמצאו משתמשים במערכת</p>
                            <p className="text-sm text-gray-400 mt-2">
                                ייתכן שאין הרשאה לצפות במשתמשים או שאין משתמשים רשומים
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-right">שם מלא</TableHead>
                                    <TableHead className="text-right">אימייל</TableHead>
                                    <TableHead className="text-right">תפקידים</TableHead>
                                    <TableHead className="text-right">סטטוס</TableHead>
                                    <TableHead className="text-center">פעולות</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">
                                            לא נמצאו משתמשים התואמים לחיפוש.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium text-right">
                                                <div className="flex items-center gap-2">
                                                    <span>{user.display_name || user.full_name || 'לא מוגדר'}</span>
                                                    {user.subscription_type === 'premium' && user.subscription_status === 'active' && (
                                                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                                                            פרמיום
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">{user.email}</TableCell>
                                            <TableCell className="text-right">{getRoleBadge(user)}</TableCell>
                                            <TableCell className="text-right">{getStatusBadge(user)}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex gap-2 justify-center">
                                                    {user.status === 'pending' ? (
                                                        <Button variant="default" size="sm" onClick={() => handleApproveUser(user)} className="bg-green-600 hover:bg-green-700">
                                                            אשר משתמש
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>
                                                                ערוך
                                                            </Button>
                                                            {adminUser && user.id !== adminUser.id && ( // Only show if not impersonating self
                                                                <Button variant="secondary" size="sm" onClick={() => handleImpersonate(user)} className="flex items-center gap-1">
                                                                    <LogIn className="w-3 h-3"/>
                                                                    צפה כמשתמש
                                                                </Button>
                                                            )}
                                                        </>
                                                    )}
                                                    {user.user_type === 'patient' && (
                                                        <Button
                                                            variant={user.subscription_type === 'premium' && user.subscription_status === 'active' ? "destructive" : "default"}
                                                            size="sm"
                                                            onClick={() => handleTogglePremium(user)}
                                                            className={user.subscription_type === 'premium' && user.subscription_status === 'active' 
                                                                ? "bg-red-600 hover:bg-red-700" 
                                                                : "bg-purple-600 hover:bg-purple-700"
                                                            }
                                                        >
                                                            {user.subscription_type === 'premium' && user.subscription_status === 'active' ? 'הסר פרמיום' : 'הפוך לפרמיום'}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {isModalOpen && (
                <EditUserModal
                    isOpen={isModalOpen}
                    user={selectedUser}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveUser}
                />
            )}
        </div>
    );
}

export default function Users() {
    return (
        <ProtectedRoute requiredRoles={['admin', 'manager']}>
            <UsersPageContent />
        </ProtectedRoute>
    )
}
