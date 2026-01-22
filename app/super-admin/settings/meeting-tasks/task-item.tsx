'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Trash2, Link as LinkIcon, Calendar, AlertCircle, Clock, CheckCircle2, PauseCircle } from 'lucide-react';
import { type MeetingTask } from '@/app/actions/meeting-tasks';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface User {
    id: string;
    full_name: string;
    email: string;
    role: string;
}

interface MeetingTaskItemProps {
    task: MeetingTask;
    users: User[];
    onUpdate: (id: string, data: Partial<MeetingTask>) => Promise<void>;
    onDelete: (id: string, isCompleted: boolean) => Promise<void>;
    isCompletedList?: boolean; // Tamamlananlar listesinde mi?
}

export function MeetingTaskItem({
    task,
    users,
    onUpdate,
    onDelete,
    isCompletedList = false,
}: MeetingTaskItemProps) {
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [link, setLink] = useState(task.link || '');
    const [isUpdating, setIsUpdating] = useState(false);
    const [elapsedString, setElapsedString] = useState<string>('-');

    // Canlı Sayaç
    useEffect(() => {
        if (!task.started_at || isCompletedList) {
            // Eğer tamamlanmışsa sabit son süreyi göster
            if (task.started_at && task.completed_at) {
                setElapsedString(calculateDiff(new Date(task.started_at), new Date(task.completed_at)));
            }
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(task.started_at!);
            const now = new Date();
            setElapsedString(calculateDiff(start, now));
        }, 1000 * 60); // Her dakika güncelle

        // İlk hesaplama
        setElapsedString(calculateDiff(new Date(task.started_at), new Date()));

        return () => clearInterval(interval);
    }, [task.started_at, task.completed_at, isCompletedList]);

    const calculateDiff = (start: Date, end: Date) => {
        const diffMs = end.getTime() - start.getTime();
        if (diffMs < 0) return '0dk';

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let res = '';
        if (diffDays > 0) res += `${diffDays} gün `;
        if (diffHours > 0) res += `${diffHours} sa `;
        res += `${diffMinutes} dk`;
        return res;
    };

    const handleUpdate = async (field: string, value: any) => {
        // Değişiklik yoksa güncelleme yapma
        if (field === 'title' && value === task.title) return;
        if (field === 'description' && value === (task.description || '')) return;
        if (field === 'link' && value === (task.link || '')) return;

        setIsUpdating(true);
        await onUpdate(task.id, { [field]: value });
        setIsUpdating(false);
    };

    const status = task.status;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={cn(
                "group relative grid grid-cols-12 gap-4 p-4 rounded-xl border transition-all duration-200",
                isCompletedList
                    ? "bg-muted/20 border-border/50 opacity-70"
                    : "bg-background border-border shadow-sm hover:shadow-md",
                status === 'important' && "border-red-200 bg-red-50/10 dark:border-red-900/30 dark:bg-red-900/5",
                status === 'postponed' && "border-yellow-200 bg-yellow-50/10 dark:border-yellow-900/30 dark:bg-yellow-900/5",
                status === 'completed' && !isCompletedList && "border-green-200 bg-green-50/10 dark:border-green-900/30 dark:bg-green-900/5"
            )}
        >
            {/* 1. Sütun: Aksiyon Butonları */}
            <div className="col-span-12 md:col-span-1 flex md:flex-col items-center justify-center gap-2 border-b md:border-b-0 md:border-r border-border/40 pb-3 md:pb-0 md:pr-3">
                {!isCompletedList && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Önemli"
                            className={cn("h-8 w-8", status === 'important' ? "text-red-500 bg-red-100 dark:bg-red-900/20" : "text-muted-foreground hover:text-red-500")}
                            onClick={() => onUpdate(task.id, { status: status === 'important' ? 'active' : 'important' })}
                        >
                            <AlertCircle className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            title="Ertele"
                            className={cn("h-8 w-8", status === 'postponed' ? "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20" : "text-muted-foreground hover:text-yellow-500")}
                            onClick={() => onUpdate(task.id, { status: status === 'postponed' ? 'active' : 'postponed' })}
                        >
                            <PauseCircle className="w-5 h-5" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            title="Bitti"
                            className={cn("h-8 w-8", status === 'completed' ? "text-green-600 bg-green-100 dark:bg-green-900/20" : "text-muted-foreground hover:text-green-600")}
                            onClick={() => onUpdate(task.id, { status: status === 'completed' ? 'active' : 'completed' })}
                        >
                            <CheckCircle2 className="w-5 h-5" />
                        </Button>
                    </>
                )}
                {isCompletedList && (
                    <div className="text-green-500">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                )}
            </div>

            {/* İçerik Alanı */}
            <div className="col-span-12 md:col-span-7 space-y-3">
                {/* Başlık */}
                <div className="relative">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={(e) => handleUpdate('title', e.target.value)}
                        disabled={isCompletedList}
                        placeholder="Görev Başlığı"
                        className={cn(
                            "font-semibold text-lg border-transparent px-0 h-auto focus-visible:ring-0 focus-visible:border-primary/50 focus-visible:px-2 transition-all rounded-md bg-transparent",
                            isCompletedList && "line-through text-muted-foreground"
                        )}
                    />
                </div>

                {/* Açıklama */}
                <div className="relative group/desc">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={(e) => handleUpdate('description', e.target.value)}
                        disabled={isCompletedList}
                        placeholder="Yapılacak işin detayı..."
                        className="min-h-[60px] resize-none border-transparent bg-muted/30 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 transition-all rounded-lg p-3 text-sm leading-relaxed"
                    />
                </div>

                {/* Link Alanı */}
                <div className="flex items-center gap-2 group/link">
                    <div className="relative flex-1 flex items-center">
                        <LinkIcon className="w-3.5 h-3.5 absolute left-3 text-muted-foreground" />
                        <Input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            onBlur={(e) => handleUpdate('link', e.target.value)}
                            disabled={isCompletedList}
                            placeholder="İlgili bağlantı ekle (URL)..."
                            className="h-8 pl-8 text-xs bg-transparent border-transparent hover:bg-muted/30 focus-visible:bg-background focus-visible:border-border transition-all"
                        />
                    </div>
                    {(task.link || link) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                        >
                            <a href={task.link || link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Meta Veriler ve (Sağ Taraf) */}
            <div className="col-span-12 md:col-span-4 flex flex-col justify-between gap-4 md:border-l md:pl-6 border-border/50">

                {/* Sorumlu Kişi */}
                <div className="w-full">
                    <Select
                        value={task.responsible_person_id || ''}
                        onValueChange={(value) => onUpdate(task.id, { responsible_person_id: value })}
                        disabled={isCompletedList}
                    >
                        <SelectTrigger className="h-9 border-transparent hover:border-border bg-muted/20 hover:bg-muted/40 transition-colors text-sm w-full">
                            <SelectValue placeholder="Sorumlu Ata" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id} className="text-sm">
                                    {user.full_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tarih ve Sayaç */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground p-2 bg-muted/20 rounded-md">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Başlangıç</span>
                        <span className="font-mono">{task.started_at ? new Date(task.started_at).toLocaleDateString('tr-TR') : '-'}</span>
                    </div>
                    <div className={cn(
                        "flex items-center justify-between text-xs p-2 rounded-md font-medium",
                        isCompletedList ? "bg-green-100 text-green-700 dark:bg-green-900/20" : "bg-blue-50 text-blue-700 dark:bg-blue-900/20"
                    )}>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Süre</span>
                        <span className="font-mono">{elapsedString}</span>
                    </div>
                </div>

                {/* Silme Butonu (En altta) */}
                <div className="flex justify-end pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(task.id, isCompletedList)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 px-2 text-xs"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Sil
                    </Button>
                </div>
            </div>

            {/* Updating indicator */}
            {isUpdating && (
                <div className="absolute top-2 right-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse block" />
                </div>
            )}
        </motion.div>
    );
}
