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
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Loader2, CheckCircle2, History, RefreshCcw, Search, Filter, X } from 'lucide-react';
import { MeetingTaskItem } from './task-item';
import { AnimatePresence, motion } from 'framer-motion';

export default function MeetingTasksPage() {
    // Normal Mod Listeleri
    const [activeTasks, setActiveTasks] = useState<MeetingTask[]>([]);
    const [completedTasks, setCompletedTasks] = useState<MeetingTask[]>([]);

    // Filtreleme Modu Listesi
    const [filteredTasks, setFilteredTasks] = useState<MeetingTask[]>([]);

    // Filtre State'leri
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');

    const [users, setUsers] = useState<Array<{ id: string; full_name: string; email: string; role: string }>>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const { toast } = useToast();

    // Polling ref'i
    const pollingRef = useRef<NodeJS.Timeout>(null);
    const debounceRef = useRef<NodeJS.Timeout>(null);

    // Filtrelerin aktif olup olmadığını kontrol et
    const isFiltering = searchQuery.trim().length > 0 || selectedUserFilter !== 'all';

    useEffect(() => {
        // İlk yükleme
        loadInitialData();

        // Polling (Sadece filtreleme yokken çalışsın)
        pollingRef.current = setInterval(() => {
            if (!isFiltering) {
                silentRefresh();
            }
        }, 30000);

        return () => {
            if (pollingRef.current) clearInterval(pollingRef.current as any);
        };
    }, []);

    // Filtre değişince veriyi çek (Debounce ile)
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current as any);

        debounceRef.current = setTimeout(() => {
            if (isFiltering) {
                fetchFilteredData();
            } else {
                // Filtre temizlendiyse normal veriyi çek
                fetchData();
            }
        }, 300); // 300ms debounce

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current as any);
        };
    }, [searchQuery, selectedUserFilter]);

    const loadInitialData = async () => {
        setIsLoading(true);
        await Promise.all([
            fetchData(),
            fetchUsers()
        ]);
        setIsLoading(false);
    };

    const fetchUsers = async () => {
        const usersRes = await getEligibleUsers();
        if (usersRes.success && usersRes.data) {
            setUsers(usersRes.data);
        }
    };

    const fetchData = async () => {
        try {
            const [activeRes, completedRes] = await Promise.all([
                getMeetingTasks('active'),
                getMeetingTasks('completed'),
            ]);

            if (activeRes.success && activeRes.data) setActiveTasks(activeRes.data);
            if (completedRes.success && completedRes.data) setCompletedTasks(completedRes.data);
        } catch (error) {
            console.error('Veri yükleme hatası', error);
        }
    };

    const fetchFilteredData = async () => {
        setIsLoading(true);
        try {
            const res = await getMeetingTasks(undefined, {
                search: searchQuery,
                userId: selectedUserFilter
            });

            if (res.success && res.data) {
                setFilteredTasks(res.data);
            }
        } catch (error) {
            console.error('Filtreleme hatası', error);
        } finally {
            setIsLoading(false);
        }
    };

    const silentRefresh = async () => {
        if (isFiltering) return; // Filtreleme aktifken refresh yapma (UX bozulur)
        await fetchData();
    };

    const handleCreateTask = async () => {
        // Arama yaparken oluşturulursa filtreyi temizle
        if (isFiltering) {
            setSearchQuery('');
            setSelectedUserFilter('all');
        }

        setIsCreating(true);
        try {
            const res = await createMeetingTask({
                title: '',
                description: '',
            });

            if (res.success && res.data) {
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

    // Generic update handler
    const handleUpdateTask = async (id: string, data: Partial<MeetingTask>) => {
        // Optimistic update logic
        const updateLists = (list: MeetingTask[]) =>
            list.map((task) => (task.id === id ? { ...task, ...data } : task));

        if (isFiltering) {
            setFilteredTasks(updateLists(filteredTasks));
        } else {
            setActiveTasks(updateLists(activeTasks));
            setCompletedTasks(updateLists(completedTasks));
        }

        try {
            const res = await updateMeetingTask(id, data);
            if (!res.success) {
                silentRefresh(); // Hata varsa geri dön
                toast({
                    title: 'Hata',
                    description: res.error,
                    variant: 'destructive',
                });
            } else if (res.data) {
                // Başarılı güncelleme sonrası veriyi tazele (özellikle zaman damgaları için)
                const updated = res.data;
                const refreshList = (list: MeetingTask[]) =>
                    list.map(t => t.id === updated.id ? updated : t);

                if (isFiltering) {
                    setFilteredTasks(refreshList(filteredTasks));
                } else {
                    setActiveTasks(refreshList(activeTasks));
                    setCompletedTasks(refreshList(completedTasks));
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
                if (isFiltering) {
                    setFilteredTasks((prev) => prev.filter((t) => t.id !== id));
                } else {
                    if (isCompleted) {
                        setCompletedTasks((prev) => prev.filter((t) => t.id !== id));
                    } else {
                        setActiveTasks((prev) => prev.filter((t) => t.id !== id));
                    }
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

    return (
        <div className="container mx-auto py-8 max-w-7xl space-y-8">

            {/* Header ve Filtreler */}
            <div className="flex flex-col gap-6 border-b border-border/40 pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Toplantı Kararları</h1>
                        <p className="text-muted-foreground mt-1">Personel toplantılarında alınan kararları yönetin, görev atayın ve takip edin.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => { if (isFiltering) fetchFilteredData(); else fetchData(); }} title="Yenile">
                            <RefreshCcw className="w-4 h-4" />
                        </Button>
                        <Button onClick={handleCreateTask} disabled={isCreating} size="lg" className="shadow-lg hover:shadow-xl transition-all">
                            {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="min-w-4 w-4 h-4 mr-2" />}
                            Yeni Konu Ekle
                        </Button>
                    </div>
                </div>

                {/* Filtre Alanı */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                    <div className="md:col-span-2 relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Başlık, içerik veya notlarda ara..."
                            className="pl-9 bg-background h-10 border-border/60 focus-visible:border-primary"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <div className="md:col-span-1">
                        <Select value={selectedUserFilter} onValueChange={setSelectedUserFilter}>
                            <SelectTrigger className="h-10 bg-background border-border/60">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-muted-foreground" />
                                    <SelectValue placeholder="Sorumlu Kişi" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tümü (Sorumlu)</SelectItem>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-1 flex items-center justify-end md:justify-start px-2">
                        {isFiltering && (
                            <span className="text-sm text-muted-foreground font-medium">
                                {isLoading ? 'Aranıyor...' : `${filteredTasks.length} sonuç bulundu`}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {isLoading && !activeTasks.length && !completedTasks.length && !filteredTasks.length ? (
                <div className="flex h-[40vh] w-full items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                </div>
            ) : (
                <>
                    {/* Filtreleme Sonuçları */}
                    {isFiltering ? (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                Arama Sonuçları
                            </h2>

                            {filteredTasks.length > 0 && (
                                <div className="grid grid-cols-12 gap-6 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/10 rounded-lg">
                                    <div className="col-span-1 text-center hidden md:block">İşlem</div>
                                    <div className="col-span-12 md:col-span-7 pl-2">İçerik</div>
                                    <div className="hidden md:flex col-span-4 pl-8 justify-between">
                                        <span>Sorumlu</span>
                                        <div className="mr-8">Durum</div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <AnimatePresence initial={false}>
                                    {filteredTasks.map((task) => (
                                        <MeetingTaskItem
                                            key={task.id}
                                            task={task}
                                            users={users}
                                            onUpdate={handleUpdateTask}
                                            onDelete={handleDeleteTask}
                                            isCompletedList={task.status === 'completed' && (!task.completed_at || (new Date().getTime() - new Date(task.completed_at).getTime() > 2 * 60 * 1000))} // 2dk kuralı kabaca buraya da uygulanabilir veya tümü aktif gibi görünebilir. 
                                        // "bütün görevler listelenmeli" dendiği için ayrım yapmadan gösteriyoruz ama completed olanları silik gösterebiliriz.
                                        />
                                    ))}
                                </AnimatePresence>
                                {filteredTasks.length === 0 && !isLoading && (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                                        <p className="text-muted-foreground text-lg">Aradığınız kriterlere uygun sonuç bulunamadı.</p>
                                        <Button variant="link" onClick={() => { setSearchQuery(''); setSelectedUserFilter('all'); }} className="mt-2 text-primary">
                                            Filtreleri Temizle
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Normal Liste Görünümü */
                        <>
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

                                {activeTasks.length > 0 && (
                                    <div className="grid grid-cols-12 gap-6 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/10 rounded-lg">
                                        <div className="col-span-1 text-center hidden md:block">İşlem</div>
                                        <div className="col-span-12 md:col-span-7 pl-2">İçerik</div>
                                        <div className="hidden md:flex col-span-4 pl-8 justify-between">
                                            <span>Sorumlu</span>
                                            <div className="mr-8">Durum & Süre</div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
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
                                <div className="space-y-4 pt-10 border-t mt-16">
                                    <div className="flex items-center gap-2 mb-4 opacity-80">
                                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                            <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                        </div>
                                        <h2 className="text-xl font-semibold">Geçmiş (Arşiv)</h2>
                                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                            {completedTasks.length}
                                        </span>
                                    </div>

                                    <div className="space-y-4 opacity-80 hover:opacity-100 transition-opacity duration-300">
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
                        </>
                    )}
                </>
            )}
        </div>
    );
}
