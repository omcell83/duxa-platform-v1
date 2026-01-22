'use client';

import { useState, useEffect } from 'react';
import {
    getMeetingTasks,
    createMeetingTask,
    updateMeetingTask,
    completeMeetingTask,
    markTaskAsCompleted,
    deleteMeetingTask,
    getEligibleUsers,
    type MeetingTask,
} from '@/app/actions/meeting-tasks';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, CheckCircle2, History } from 'lucide-react';
import { MeetingTaskItem } from './task-item';
import { AnimatePresence, motion } from 'framer-motion';

export default function MeetingTasksPage() {
    const [activeTasks, setActiveTasks] = useState<MeetingTask[]>([]);
    const [completedTasks, setCompletedTasks] = useState<MeetingTask[]>([]);
    const [users, setUsers] = useState<
        Array<{ id: string; full_name: string; email: string; role: string }>
    >([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [activeRes, completedRes, usersRes] = await Promise.all([
                getMeetingTasks('active'),
                getMeetingTasks('completed'),
                getEligibleUsers(),
            ]);

            if (activeRes.success && activeRes.data) {
                setActiveTasks(activeRes.data);
            }
            if (completedRes.success && completedRes.data) {
                setCompletedTasks(completedRes.data);
            }
            if (usersRes.success && usersRes.data) {
                setUsers(usersRes.data);
            }
        } catch (error) {
            console.error('Veri yükleme hatası:', error);
            toast({
                title: 'Hata',
                description: 'Veriler yüklenirken bir sorun oluştu.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateTask = async () => {
        setIsCreating(true);
        try {
            const res = await createMeetingTask({
                title: '', // Boş başlıkla başla
                description: '',
            });

            if (res.success && res.data) {
                setActiveTasks([res.data, ...activeTasks]);
                toast({
                    title: 'Yeni Konu Eklendi',
                    description: 'Lütfen görev detaylarını doldurun.',
                });
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: error.message || 'Görev oluşturulamadı.',
                variant: 'destructive',
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateTask = async (id: string, data: Partial<MeetingTask>) => {
        // Optimistic update for UI responsiveness
        setActiveTasks((prev) =>
            prev.map((task) => (task.id === id ? { ...task, ...data } : task))
        );

        try {
            const res = await updateMeetingTask(id, data);
            if (!res.success) {
                // Revert on failure (simple fetch for now or rigorous state management)
                fetchData();
                toast({
                    title: 'Güncelleme Hatası',
                    description: res.error,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Update hatası:', error);
        }
    };

    const handleCompleteTask = async (id: string) => {
        try {
            // 1. Mark as completed (sets completed_at)
            const res = await completeMeetingTask(id);

            if (res.success && res.data) {
                // Update local state to show checkbox ticked immediately
                setActiveTasks((prev) =>
                    prev.map((t) => (t.id === id ? { ...t, completed_at: res.data!.completed_at } : t))
                );

                toast({
                    title: 'Görev Tamamlandı',
                    description: 'Görev 2 saniye sonra tamamlananlar listesine taşınacak.',
                    className: "bg-green-50 border-green-200 text-green-800",
                });

                // 2. Wait 2 seconds then move to completed list
                setTimeout(async () => {
                    // Server update status to 'completed'
                    await markTaskAsCompleted(id);

                    // Move in UI
                    setActiveTasks((prev) => prev.filter((t) => t.id !== id));
                    setCompletedTasks((prev) => [res.data!, ...prev]);
                }, 2000);
            }
        } catch (error) {
            console.error('Complete task error:', error);
            toast({
                title: 'Hata',
                description: 'İşlem sırasında bir hata oluştu.',
                variant: 'destructive',
            });
        }
    };

    const handleDeleteTask = async (id: string, isCompleted: boolean) => {
        if (!confirm('Bu görevi silmek istediğinize emin misiniz?')) return;

        try {
            const res = await deleteMeetingTask(id);
            if (res.success) {
                if (isCompleted) {
                    setCompletedTasks((prev) => prev.filter((t) => t.id !== id));
                } else {
                    setActiveTasks((prev) => prev.filter((t) => t.id !== id));
                }
                toast({
                    title: 'Silindi',
                    description: 'Görev başarıyla silindi.',
                });
            } else {
                throw new Error(res.error);
            }
        } catch (error: any) {
            toast({
                title: 'Hata',
                description: error.message || 'Silme işlemi başarısız.',
                variant: 'destructive',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-12">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Toplantı Kararları</h1>
                    <p className="text-muted-foreground mt-1">Personel toplantılarında alınan kararları ve görevleri yönetin.</p>
                </div>
                <Button onClick={handleCreateTask} disabled={isCreating} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                    {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="min-w-4 w-4 h-4 mr-2" />}
                    Yeni Konu Ekle
                </Button>
            </div>

            {/* Active Tasks Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Aktif Gündem & Görevler</h2>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {activeTasks.length}
                    </span>
                </div>

                {/* Table Headers (Visual Guide) */}
                {activeTasks.length > 0 && (
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-1 text-center">Durum</div>
                        <div className="col-span-11 md:col-span-6">Karar / Görev Detayı</div>
                        <div className="hidden md:flex col-span-5 pl-6 justify-between">
                            <span>Sorumlu</span>
                            <div className="flex gap-8 mr-12">
                                <span>Başlangıç</span>
                                <span>Süre</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {activeTasks.map((task) => (
                            <MeetingTaskItem
                                key={task.id}
                                task={task}
                                users={users}
                                onUpdate={handleUpdateTask}
                                onComplete={handleCompleteTask}
                                onDelete={handleDeleteTask}
                            />
                        ))}
                    </AnimatePresence>

                    {activeTasks.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                            <p className="text-muted-foreground">Henüz aktif bir görev veya karar bulunmuyor.</p>
                            <Button variant="link" onClick={handleCreateTask} className="mt-2 text-primary">
                                İlk konuyu ekle
                            </Button>
                        </div>
                    )}
                </div>

                {/* Bottom Add Button for convenience */}
                {activeTasks.length > 3 && (
                    <Button variant="outline" onClick={handleCreateTask} disabled={isCreating} className="w-full border-dashed border-2 py-6 text-muted-foreground hover:text-primary hover:border-primary/50">
                        <PlusCircle className="min-w-4 w-4 h-4 mr-2" />
                        Bir Konu Daha Ekle
                    </Button>
                )}
            </div>

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
                <div className="space-y-4 pt-8 border-t">
                    <div className="flex items-center gap-2 mb-4 opacity-80">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Tamamlananlar</h2>
                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {completedTasks.length}
                        </span>
                    </div>

                    <div className="space-y-3 opacity-70 hover:opacity-100 transition-opacity duration-300">
                        {completedTasks.map((task) => (
                            <MeetingTaskItem
                                key={task.id}
                                task={task}
                                users={users}
                                onUpdate={handleUpdateTask}
                                onComplete={handleCompleteTask}
                                onDelete={handleDeleteTask}
                                isCompleted={true}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
