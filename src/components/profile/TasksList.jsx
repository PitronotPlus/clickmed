import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, AlertTriangle, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { User } from '@/entities/User';
import { Task } from '@/entities/Task';
import TaskModal from './TaskModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TasksList() {
    const [tasks, setTasks] = useState([]);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    
    // Alert dialog state
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                const userTasks = await Task.filter({ user_id: currentUser.id }, '-created_date', 3); // Load 3 most recent tasks
                setTasks(userTasks);
            } catch (error) {
                console.error("Error loading tasks:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const refreshTasks = async () => {
        if (!user) return;
        const userTasks = await Task.filter({ user_id: user.id }, '-created_date', 3);
        setTasks(userTasks);
    };

    const handleTaskToggle = async (task) => {
        const newStatus = task.status === 'completed' ? 'pending' : 'completed';
        await Task.update(task.id, { status: newStatus });
        refreshTasks();
    };

    const handleSaveTask = async (taskData) => {
        if (editingTask) {
            // Update existing task
            await Task.update(editingTask.id, taskData);
        } else {
            // Create new task
            await Task.create({ ...taskData, user_id: user.id });
        }
        setEditingTask(null);
        setIsModalOpen(false);
        refreshTasks();
    };

    const handleEdit = (task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleDelete = (taskId) => {
        setTaskToDelete(taskId);
        setIsAlertOpen(true);
    };

    const confirmDelete = async () => {
        await Task.delete(taskToDelete);
        setIsAlertOpen(false);
        setTaskToDelete(null);
        refreshTasks();
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'in_progress': return <Clock className="w-5 h-5 text-blue-600" />;
            default: return <Circle className="w-5 h-5 text-gray-400" />;
        }
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            high: 'bg-red-100 text-red-800',
            medium: 'bg-yellow-100 text-yellow-800',
            low: 'bg-green-100 text-green-800'
        };
        const text = { high: 'גבוה', medium: 'בינוני', low: 'נמוך' };
        return <Badge className={styles[priority]}>{text[priority]}</Badge>;
    };

    return (
        <>
            <Card className="bg-white border shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <AlertTriangle className="w-6 h-6 text-blue-600" />
                            המשימות שלי
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link to={createPageUrl('Tasks')}>צפה בכולם</Link>
                            </Button>
                            <Button onClick={() => { setEditingTask(null); setIsModalOpen(true); }} size="sm" className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                הוסף משימה
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading && <p>טוען משימות...</p>}
                        {!loading && tasks.length === 0 && <p className="text-center text-gray-500 py-4">אין משימות להצגה.</p>}
                        {!loading && tasks.map(task => (
                            <div key={task.id} className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <button onClick={() => handleTaskToggle(task)} className="mt-1 flex-shrink-0">
                                    {getStatusIcon(task.status)}
                                </button>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className={`font-semibold ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                            {task.title}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            {getPriorityBadge(task.priority)}
                                            {task.dueDate && <span className="text-sm text-gray-500">{new Date(task.dueDate).toLocaleDateString('he-IL')}</span>}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm">{task.description}</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="flex-shrink-0">
                                            <MoreVertical className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleEdit(task)}>
                                            <Edit className="w-4 h-4 ml-2" />
                                            <span>ערוך</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(task.id)} className="text-red-600">
                                            <Trash2 className="w-4 h-4 ml-2" />
                                            <span>מחק</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            
            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveTask}
                task={editingTask}
            />

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>אישור מחיקת משימה</AlertDialogTitle>
                        <AlertDialogDescription>
                            האם אתה בטוח שברצונך למחוק את המשימה? לא ניתן לשחזר פעולה זו.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}