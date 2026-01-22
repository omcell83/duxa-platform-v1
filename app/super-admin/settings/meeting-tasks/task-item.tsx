'use client';

import { useState, useEffect, useRef } from 'react';
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'; // Set new height
        }
    }, [description]);

    // Canlı Sayaç
    useEffect(() => {
        if (!task.started_at || isCompletedList) {
            if (task.started_at && task.completed_at) {
                setElapsedString(calculateDiff(new Date(task.started_at), new Date(task.completed_at)));
            }
            return;
        }

        const interval = setInterval(() => {
            const start = new Date(task.started_at!);
            const now = new Date();
            setElapsedString(calculateDiff(start, now));
        }, 1000 * 60);

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
                "group relative grid grid-cols-12 gap-6 p-5 rounded-xl border-2 transition-all duration-200", // gap ve padding artırıldı, border-2 yapıldı
                isCompletedList
                    ? "bg-muted/20 border-border/50 opacity-70"
                    : "bg-background shadow-sm hover:shadow-md",
                // Renkler daha belirgin (vivid) hale getirildi
                !isCompletedList && status === 'active' && "border-border",
                !isCompletedList && status === 'important' && "border-red-500 bg-red-50/50 dark:bg-red-900/20",
                !isCompletedList && status === 'postponed' && "border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/20",
                !isCompletedList && status === 'completed' && "border-green-500 bg-green-50/50 dark:bg-green-900/20"
            )}
        >
            {/* 1. Sütun: Aksiyon Butonları */}
            <div className="col-span-12 md:col-span-1 flex md:flex-col items-center justify-start gap-3 border-b md:border-b-0 md:border-r border-border/40 pb-4 md:pb-0 md:pr-4">
                {!isCompletedList && (
                    <>
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Önemli"
                            className={cn(
                                "h-12 w-12 rounded-lg transition-all", // Boyut büyütüldü (2x yaklaşık)
                                status === 'important'
                                    ? "bg-red-500 text-white hover:bg-red-600 hover:text-white shadow-md shadow-red-200"
                                    : "text-muted-foreground hover:bg-red-100 hover:text-red-500"
                            )}
                            onClick={() => onUpdate(task.id, { status: status === 'important' ? 'active' : 'important' })}
                        >
                            <AlertCircle className="w-7 h-7" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            title="Ertele"
                            className={cn(
                                "h-12 w-12 rounded-lg transition-all",
                                status === 'postponed'
                                    ? "bg-yellow-500 text-white hover:bg-yellow-600 hover:text-white shadow-md shadow-yellow-200"
                                    : "text-muted-foreground hover:bg-yellow-100 hover:text-yellow-500"
                            )}
                            onClick={() => onUpdate(task.id, { status: status === 'postponed' ? 'active' : 'postponed' })}
                        >
                            <PauseCircle className="w-7 h-7" />
                        </Button>

                        <Button
                            variant="ghost"
                            size="icon"
                            title="Bitti"
                            className={cn(
                                "h-12 w-12 rounded-lg transition-all",
                                status === 'completed'
                                    ? "bg-green-500 text-white hover:bg-green-600 hover:text-white shadow-md shadow-green-200"
                                    : "text-muted-foreground hover:bg-green-100 hover:text-green-500"
                            )}
                            onClick={() => onUpdate(task.id, { status: status === 'completed' ? 'active' : 'completed' })}
                        >
                            <CheckCircle2 className="w-7 h-7" />
                        </Button>
                    </>
                )}
                {isCompletedList && (
                    <div className="text-green-500 p-2">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                )}
            </div>

            {/* İçerik Alanı */}
            <div className="col-span-12 md:col-span-7 space-y-4">
                {/* Başlık */}
                <div className="relative">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={(e) => handleUpdate('title', e.target.value)}
                        disabled={isCompletedList}
                        placeholder="Görev Başlığı"
                        className={cn(
                            "font-bold text-xl border-transparent px-0 h-auto focus-visible:ring-0 focus-visible:border-primary/50 focus-visible:px-2 transition-all rounded-md bg-transparent",
                            isCompletedList && "line-through text-muted-foreground"
                        )}
                    />
                </div>

                {/* Açıklama (Auto-resize) */}
                <div className="relative group/desc">
                    <Textarea
                        ref={textareaRef}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={(e) => handleUpdate('description', e.target.value)}
                        disabled={isCompletedList}
                        placeholder="Yapılacak işin detayı..."
                        className="min-h-[80px] overflow-hidden resize-none border-transparent bg-muted/40 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary/20 transition-all rounded-lg p-4 text-base leading-relaxed"
                    />
                </div>

                {/* Link Alanı */}
                <div className="flex items-center gap-2 group/link pt-2">
                    <div className="relative flex-1 flex items-center">
                        <LinkIcon className="w-4 h-4 absolute left-3 text-muted-foreground" />
                        <Input
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            onBlur={(e) => handleUpdate('link', e.target.value)}
                            disabled={isCompletedList}
                            placeholder="İlgili bağlantı ekle (URL)..."
                            className="h-9 pl-9 text-sm bg-transparent border-transparent hover:bg-muted/30 focus-visible:bg-background focus-visible:border-border transition-all"
                        />
                    </div>
                    {(task.link || link) && (
                        <Button
                            variant="ghost"
                            size="icon"
                            asChild
                            className="h-9 w-9 text-primary hover:text-primary hover:bg-primary/10"
                        >
                            <a href={task.link || link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                            </a>
                        </Button>
                    )}
                </div>
            </div>

            {/* Meta Veriler ve (Sağ Taraf) */}
            <div className="col-span-12 md:col-span-4 flex flex-col justify-between gap-4 md:border-l md:pl-8 border-border/50">

                {/* Sorumlu Kişi */}
                <div className="w-full pt-1">
                    <Select
                        value={task.responsible_person_id || ''}
                        onValueChange={(value) => onUpdate(task.id, { responsible_person_id: value })}
                        disabled={isCompletedList}
                    >
                        <SelectTrigger className="h-10 border-transparent hover:border-border bg-muted/30 hover:bg-muted/50 transition-colors text-sm w-full font-medium">
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
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-muted-foreground p-3 bg-muted/20 rounded-lg">
                        <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Başlangıç</span>
                        <span className="font-mono font-medium">{task.started_at ? new Date(task.started_at).toLocaleDateString('tr-TR') : '-'}</span>
                    </div>
                    <div className={cn(
                        "flex items-center justify-between text-sm p-3 rounded-lg font-semibold",
                        isCompletedList ? "bg-green-100/50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    )}>
                        <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> Süre</span>
                        <span className="font-mono text-base">{elapsedString}</span>
                    </div>
                </div>

                {/* Silme Butonu (En altta) */}
                <div className="flex justify-end pt-4 mt-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(task.id, isCompletedList)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-9 px-3 text-xs"
                    >
                        <Trash2 className="w-4 h-4 mr-1.5" /> Sil
                    </Button>
                </div>
            </div>

            {/* Updating indicator */}
            {isUpdating && (
                <div className="absolute top-3 right-3">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse block" />
                </div>
            )}
        </motion.div>
    );
}
