'use client';

import { useState, useEffect, useRef } from 'react';
import {
    getMeetingTasks,
    createMeetingTask,
    updateMeetingTask,
    deleteMeetingTask,
    getEligibleUsers,
    type MeetingTask,
} from '@/app/actions/meeting-tasks';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Loader2, CheckCircle2, History, RefreshCcw } from 'lucide-react';
import { MeetingTaskItem } from './task-item';
import { AnimatePresence, motion } from 'framer-motion';

export default function MeetingTasksPage() {
    // Aktif liste: Active, Important, Postponed + Son 2dk Completed
    const [activeTasks, setActiveTasks] = useState<MeetingTask[]>([]);
    // Tamamlanan liste: 2dk'dan eski Completed
    const [completedTasks, setCompletedTasks] = useState<MeetingTask[]>([]);

    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    // Polling ref'i (sonsuz döngüden kaçınmak için)
    const pollingRef = useRef<NodeJS.Timeout>(null);

    useEffect(() => {
        fetchData();

        // Listeleri dinamik tutmak için her 30 saniyede bir verileri tazele
        // Bu sayede 2 dakikası dolan "bitti" görevleri otomatik olarak aşağıya geçer.
        pollingRef.current = setInterval(() => {
            // Sessiz güncelleme (loading flag açmadan)
            silentRefresh();
        }, 30000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        await silentRefresh();
        setIsLoading(false);
    };

    const silentRefresh = async () => {
        try {
            const [activeRes, completedRes, usersRes] = await Promise.all([
                getMeetingTasks('active'),
                getMeetingTasks('completed'),
                getEligibleUsers(),
            ]);

            if (activeRes.success && activeRes.data) setActiveTasks(activeRes.data);
            if (completedRes.success && completedRes.data) setCompletedTasks(completedRes.data);
            if (usersRes.success && usersRes.data) setUsers(usersRes.data);
        } catch (error) {
            console.error('Veri yenileme hatası', error);
        }
    };

    const handleCreateTask = async () => {
        setIsCreating(true);
        try {
            const res = await createMeetingTask({
                title: '',
                description: '',
            });

            if (res.success && res.data) {
                // Yeni görev her zaman aktiftir
                setActiveTasks([res.data, ...activeTasks]);
                toast({
                    title: 'Yeni Konu Eklendi',
                    description: 'Detayları doldurmaya başlayabilirsiniz.',
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

    // Genel güncelleme fonksiyonu (TaskItem içinden çağrılır)
    const handleUpdateTask = async (id: string, data: Partial<MeetingTask>) => {
        // Optimistic Update
        // Not: Status değişimi karmaşık olduğu için (listeler arası geçiş), 
        // basic optimistic update yapıyoruz ama asıl veriyi sunucudan beklemek daha güvenli olabilir.
        // Ancak kullanıcı arayüzü "Anında" tepki vermeli.

        // Status değişimi var mı?
        if (data.status) {
            // Eğer 'completed' seçildiyse:
            // Server mantığı: 'active' listesinde kalmaya devam eder (son 2dk kuralı).
            // UI: Status rengi değişir (TaskItem içinde handle edilir).

            // Eğer 'completed'dan 'active'e döndüyse:
            // Server mantığı: Zaten active listesindedir.
        }

        setActiveTasks((prev) =>
            prev.map((task) => (task.id === id ? { ...task, ...data } : task))
        );

        try {
            const res = await updateMeetingTask(id, data);
            if (!res.success) {
                // Hata durumunda rollback
                silentRefresh();
                toast({
                    title: 'Hata',
                    description: res.error,
                    variant: 'destructive',
                });
            } else {
                // Başarılı olursa, veriyi (özellikle server tarafından set edilen timestamp'leri) güncelle
                if (res.data) {
                    const updated = res.data;
                    setActiveTasks(prev => prev.map(t => t.id === updated.id ? updated : t));

                    // Eğer bu bir 'completed' işlemi ise ve 2 dakika dolmuşsa (manuel refresh ile) listeden gidecek.
                }
            }
        } catch (error) {
            console.error('Update hatası:', error);
        }
    };

    const handleDeleteTask = async (id: string, isCompleted: boolean) => {
        if (!confirm('Bu görevi tamamen silmek istiyor musunuz?')) return;

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
        <div className="container mx-auto py-8 max-w-6xl space-y-12">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Toplantı Kararları</h1>
                    <p className="text-muted-foreground mt-1">Personel toplantılarında alınan kararları ve görevleri yönetin.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => fetchData()} title="Yenile">
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                    <Button onClick={handleCreateTask} disabled={isCreating} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                        {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="min-w-4 w-4 h-4 mr-2" />}
                        Yeni Konu Ekle
                    </Button>
                </div>
            </div>

            {/* Active Tasks Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold">Gündem & Aktif Görevler</h2>
                    <span className="ml-2 px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {activeTasks.length}
                    </span>
                </div>

                {/* Table Headers */}
                {activeTasks.length > 0 && (
                    <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        <div className="col-span-1 text-center hidden md:block">İşlem</div>
                        <div className="col-span-12 md:col-span-7 pl-1">İçerik Detayları</div>
                        <div className="hidden md:flex col-span-4 pl-6 justify-between">
                            <span>Sorumlu</span>
                            <div className="mr-8">Durum & Süre</div>
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
                                onDelete={handleDeleteTask}
                                isCompletedList={false}
                            />
                        ))}
                    </AnimatePresence>

                    {activeTasks.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                            <p className="text-muted-foreground">Henüz aktif bir görev veya karar bulunmuyor.</p>
                            <Button variant="link" onClick={handleCreateTask} className="mt-2 text-primary">
                                Hemen bir tane ekle
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Completed Tasks Section */}
            {completedTasks.length > 0 && (
                <div className="space-y-4 pt-10 border-t mt-12">
                    <div className="flex items-center gap-2 mb-4 opacity-80">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <h2 className="text-xl font-semibold">Geçmiş (Arşiv)</h2>
                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {completedTasks.length}
                        </span>
                    </div>

                    <div className="space-y-3 opacity-80 hover:opacity-100 transition-opacity duration-300">
                        {completedTasks.map((task) => (
                            <MeetingTaskItem
                                key={task.id}
                                task={task}
                                users={users}
                                onUpdate={handleUpdateTask}
                                onDelete={handleDeleteTask}
                                isCompletedList={true}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
