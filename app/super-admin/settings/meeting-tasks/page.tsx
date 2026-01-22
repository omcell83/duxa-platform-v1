'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, ExternalLink, Trash2 } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
}

export default function MeetingTasksPage() {
    const [activeTasks, setActiveTasks] = useState<MeetingTask[]>([]);
    const [completedTasks, setCompletedTasks] = useState<MeetingTask[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    // Görevleri yükle
    const loadTasks = async () => {
        const [activeResult, completedResult, usersResult] = await Promise.all([
            getMeetingTasks('active'),
            getMeetingTasks('completed'),
            getEligibleUsers(),
        ]);

        if (activeResult.success && activeResult.data) {
            setActiveTasks(activeResult.data);
        }

        if (completedResult.success && completedResult.data) {
            setCompletedTasks(completedResult.data);
        }

        if (usersResult.success && usersResult.data) {
            setUsers(usersResult.data);
        }

        setLoading(false);
    };

    useEffect(() => {
        loadTasks();
    }, []);

    // Yeni görev ekle
    const handleAddTask = async () => {
        const result = await createMeetingTask({
            title: 'Yeni Görev',
            description: '',
        });

        if (result.success && result.data) {
            setActiveTasks([result.data, ...activeTasks]);
            toast({
                title: 'Başarılı',
                description: 'Yeni görev eklendi',
            });
        } else {
            toast({
                title: 'Hata',
                description: result.error || 'Görev eklenirken bir hata oluştu',
                variant: 'destructive',
            });
        }
    };

    // Görev güncelle
    const handleUpdateTask = async (
        id: string,
        data: {
            title?: string;
            description?: string;
            responsible_person_id?: string;
            link?: string;
        }
    ) => {
        const result = await updateMeetingTask(id, data);

        if (result.success && result.data) {
            setActiveTasks(activeTasks.map((task) => (task.id === id ? result.data! : task)));
        } else {
            toast({
                title: 'Hata',
                description: result.error || 'Görev güncellenirken bir hata oluştu',
                variant: 'destructive',
            });
        }
    };

    // Görev tamamla (checkbox işaretlendiğinde)
    const handleCompleteTask = async (id: string) => {
        const result = await completeMeetingTask(id);

        if (result.success && result.data) {
            setActiveTasks(activeTasks.map((task) => (task.id === id ? result.data! : task)));

            // 2 dakika sonra completed statüsüne geç
            setTimeout(async () => {
                const markResult = await markTaskAsCompleted(id);
                if (markResult.success && markResult.data) {
                    setActiveTasks(activeTasks.filter((task) => task.id !== id));
                    setCompletedTasks([markResult.data, ...completedTasks]);
                }
            }, 2 * 60 * 1000); // 2 dakika

            toast({
                title: 'Görev Tamamlandı',
                description: '2 dakika sonra tamamlananlar listesine taşınacak',
            });
        } else {
            toast({
                title: 'Hata',
                description: result.error || 'Görev tamamlanırken bir hata oluştu',
                variant: 'destructive',
            });
        }
    };

    // Görev sil
    const handleDeleteTask = async (id: string, isCompleted: boolean) => {
        const result = await deleteMeetingTask(id);

        if (result.success) {
            if (isCompleted) {
                setCompletedTasks(completedTasks.filter((task) => task.id !== id));
            } else {
                setActiveTasks(activeTasks.filter((task) => task.id !== id));
            }
            toast({
                title: 'Başarılı',
                description: 'Görev silindi',
            });
        } else {
            toast({
                title: 'Hata',
                description: result.error || 'Görev silinirken bir hata oluştu',
                variant: 'destructive',
            });
        }
    };

    // Geçen süreyi hesapla
    const calculateElapsedTime = (startedAt: string | null, completedAt: string | null) => {
        if (!startedAt) return null;

        const start = new Date(startedAt);
        const end = completedAt ? new Date(completedAt) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return { days: diffDays, hours: diffHours, isOverdue: diffDays >= 2 };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Personel Toplantısı Kararları</h1>
                        <p className="text-muted-foreground mt-1">
                            Toplantılarda alınan kararlar ve yapılacaklar listesi
                        </p>
                    </div>
                    <Button onClick={handleAddTask} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Yeni Konu Ekle
                    </Button>
                </div>

                {/* Aktif Görevler */}
                <Card className="bg-card border-border p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Aktif Görevler</h2>
                    <div className="space-y-4">
                        {activeTasks.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">Henüz aktif görev yok</p>
                        ) : (
                            activeTasks.map((task) => {
                                const elapsed = calculateElapsedTime(task.started_at, task.completed_at);
                                const isChecked = !!task.completed_at;

                                return (
                                    <div
                                        key={task.id}
                                        className="grid grid-cols-12 gap-4 items-start p-4 bg-muted/30 rounded-lg border border-border"
                                    >
                                        {/* Checkbox */}
                                        <div className="col-span-1 flex items-center justify-center pt-2">
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={(checked: boolean) => {
                                                    if (checked) {
                                                        handleCompleteTask(task.id);
                                                    }
                                                }}
                                                disabled={isChecked}
                                            />
                                        </div>

                                        {/* Başlık */}
                                        <div className="col-span-2">
                                            <Input
                                                value={task.title}
                                                onChange={(e) =>
                                                    handleUpdateTask(task.id, { title: e.target.value })
                                                }
                                                className="bg-background border-border"
                                                placeholder="Başlık"
                                            />
                                        </div>

                                        {/* Açıklama */}
                                        <div className="col-span-3">
                                            <Textarea
                                                value={task.description || ''}
                                                onChange={(e) =>
                                                    handleUpdateTask(task.id, { description: e.target.value })
                                                }
                                                className="bg-background border-border min-h-[80px]"
                                                placeholder="Konu açıklaması..."
                                            />
                                        </div>

                                        {/* Sorumlu */}
                                        <div className="col-span-2">
                                            <Select
                                                value={task.responsible_person_id || ''}
                                                onValueChange={(value) =>
                                                    handleUpdateTask(task.id, { responsible_person_id: value })
                                                }
                                            >
                                                <SelectTrigger className="bg-background border-border">
                                                    <SelectValue placeholder="Sorumlu seçin" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-popover border-border">
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={user.id}>
                                                            {user.full_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Başlangıç Tarihi */}
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">
                                                {task.started_at
                                                    ? new Date(task.started_at).toLocaleDateString('tr-TR')
                                                    : '-'}
                                            </p>
                                        </div>

                                        {/* Geçen Süre */}
                                        <div className="col-span-1">
                                            {elapsed ? (
                                                <p
                                                    className={`text-sm font-medium ${elapsed.isOverdue ? 'text-red-500' : 'text-green-500'
                                                        }`}
                                                >
                                                    {elapsed.days}g {elapsed.hours}s
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">-</p>
                                            )}
                                        </div>

                                        {/* Sil Butonu */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteTask(task.id, false)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Link (Açıklama altında) */}
                                        <div className="col-span-11 col-start-2">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    value={task.link || ''}
                                                    onChange={(e) =>
                                                        handleUpdateTask(task.id, { link: e.target.value })
                                                    }
                                                    className="bg-background border-border"
                                                    placeholder="Link ekle (opsiyonel)"
                                                />
                                                {task.link && (
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        asChild
                                                        className="shrink-0"
                                                    >
                                                        <a href={task.link} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="w-4 h-4" />
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Tamamlanan Görevler */}
                <Card className="bg-card border-border p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">Tamamlanan Görevler</h2>
                    <div className="space-y-4">
                        {completedTasks.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">
                                Henüz tamamlanan görev yok
                            </p>
                        ) : (
                            completedTasks.map((task) => {
                                const elapsed = calculateElapsedTime(task.started_at, task.completed_at);

                                return (
                                    <div
                                        key={task.id}
                                        className="grid grid-cols-12 gap-4 items-start p-4 bg-muted/10 rounded-lg border border-border opacity-60"
                                    >
                                        {/* Checkbox (disabled) */}
                                        <div className="col-span-1 flex items-center justify-center pt-2">
                                            <Checkbox checked disabled />
                                        </div>

                                        {/* Başlık */}
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-foreground">{task.title}</p>
                                        </div>

                                        {/* Açıklama */}
                                        <div className="col-span-3">
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {task.description || '-'}
                                            </p>
                                        </div>

                                        {/* Sorumlu */}
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">
                                                {task.responsible_person?.full_name || '-'}
                                            </p>
                                        </div>

                                        {/* Başlangıç Tarihi */}
                                        <div className="col-span-2">
                                            <p className="text-sm text-muted-foreground">
                                                {task.started_at
                                                    ? new Date(task.started_at).toLocaleDateString('tr-TR')
                                                    : '-'}
                                            </p>
                                        </div>

                                        {/* Geçen Süre */}
                                        <div className="col-span-1">
                                            {elapsed ? (
                                                <p className="text-sm text-muted-foreground">
                                                    {elapsed.days}g {elapsed.hours}s
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">-</p>
                                            )}
                                        </div>

                                        {/* Sil Butonu */}
                                        <div className="col-span-1 flex items-center justify-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteTask(task.id, true)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Link */}
                                        {task.link && (
                                            <div className="col-span-11 col-start-2">
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={task.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        {task.link}
                                                        <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </Card>

                {/* Alt Yeni Konu Ekle Butonu */}
                <div className="flex justify-center">
                    <Button onClick={handleAddTask} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Yeni Konu Ekle
                    </Button>
                </div>
            </div>
        </div>
    );
}
