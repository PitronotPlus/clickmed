
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { UserCheck } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function UserApprovalTab() {
    const [users, setUsers] = useState([]);
    const [alertInfo, setAlertInfo] = useState({ isOpen: false, user: null });
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        const pendingUsers = await User.filter({ status: 'pending' });
        setUsers(pendingUsers);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApproveUser = async () => {
        if (!alertInfo.user) return;
        
        await User.update(alertInfo.user.id, { 
            status: 'active', 
            permissions: [...(alertInfo.user.permissions || []), alertInfo.user.user_type] 
        });
        setUsers(users.filter(u => u.id !== alertInfo.user.id));
        setAlertInfo({ isOpen: false, user: null });
    };

    if (loading) {
        return <p className="text-center text-gray-500 py-8">טוען משתמשים...</p>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4 text-right">רופאים ומרפאות הממתינים לאישור</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">שם</TableHead>
                        <TableHead className="text-right">אימייל</TableHead>
                        <TableHead className="text-right">סוג</TableHead>
                        <TableHead className="text-right">מספר רישיון</TableHead>
                        <TableHead className="text-center">פעולות</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium text-right">{user.full_name}</TableCell>
                            <TableCell className="text-right">{user.email}</TableCell>
                            <TableCell className="text-right">{user.user_type === 'doctor' ? 'רופא/ה' : 'מרפאה'}</TableCell>
                            <TableCell className="text-right">{user.license_number || 'לא הוזן'}</TableCell>
                            <TableCell className="text-center">
                                <Button size="sm" onClick={() => setAlertInfo({ isOpen: true, user })}>
                                    <UserCheck className="w-4 h-4 ml-2" />
                                    אשר משתמש
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            {users.length === 0 && <p className="text-center text-gray-500 py-8">אין משתמשים הממתינים לאישור.</p>}
        
            <AlertDialog open={alertInfo.isOpen} onOpenChange={(isOpen) => setAlertInfo({ ...alertInfo, isOpen })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-right">אישור משתמש</AlertDialogTitle>
                        <AlertDialogDescription className="text-right">
                            האם לאשר את המשתמש "{alertInfo.user?.full_name}"? פעולה זו תהפוך את חשבונו לפעיל.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setAlertInfo({ isOpen: false, user: null })}>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={handleApproveUser}>אשר</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
