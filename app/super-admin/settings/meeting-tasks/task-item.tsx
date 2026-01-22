'use client';

import { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ExternalLink, Trash2, Link as LinkIcon, Calendar, Clock } from 'lucide-react';
import { type MeetingTask } from '@/app/actions/meeting-tasks';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
    onComplete: (id: string) => Promise<void>;
    onDelete: (id: string, isCompleted: boolean) => Promise<void>;
    isCompleted?: boolean;
}

export function MeetingTaskItem({
    task,
    users,
    onUpdate,
    onComplete,
    onDelete,
    isCompleted = false,
}: MeetingTaskItemProps) {
    // Local state for immediate user feedback
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [link, setLink] = useState(task.link || '');
    const [isUpdating, setIsUpdating] = useState(false);

    // Calculate elapsed time
    const calculateElapsedTime = (startedAt: string | null, completedAt: string | null) => {
        if (!startedAt) return null;
        const start = new Date(startedAt);
        const end = completedAt ? new Date(completedAt) : new Date();
        const diffMs = end.getTime() - start.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return { days: diffDays, hours: diffHours, isOverdue: diffDays >= 2 };
    };

    const elapsed = calculateElapsedTime(task.started_at, task.completed_at);

    // Generic update handler used by onBlur
    const handleUpdate = async (field: string, value: string | null) => {
        // Don't update if value hasn't changed
        if (field === 'title' && value === task.title) return;
        if (field === 'description' && value === (task.description || '')) return;
        if (field === 'link' && value === (task.link || '')) return;

        setIsUpdating(true);
        await onUpdate(task.id, { [field]: value });
        setIsUpdating(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className={cn(
                "group relative grid grid-cols-12 gap-4 p-4 rounded-xl border transition-all duration-200",
                isCompleted
                    ? "bg-muted/20 border-border/50 opacity-60 hover:opacity-100"
                    : "bg-background border-border shadow-sm hover:shadow-md hover:border-primary/20"
            )}
        >
            {/* 1. Sütun: Checkbox (Ortalanmış) */}
            <div className="col-span-1 flex items-start justify-center pt-3">
                <Checkbox
                    checked={!!task.completed_at}
                    onCheckedChange={(checked) => {
                        if (checked) onComplete(task.id);
                    }}
                    disabled={!!task.completed_at}
                    className="w-5 h-5 border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                />
            </div>

            {/* İçerik Alanı (Başlık ve Açıklama) */}
            <div className="col-span-11 md:col-span-6 space-y-3">
                {/* Başlık */}
                <div className="relative">
                    <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={(e) => handleUpdate('title', e.target.value)}
                        disabled={isCompleted}
                        placeholder="Görev Başlığı"
                        className={cn(
                            "font-semibold text-lg border-transparent px-0 h-auto focus-visible:ring-0 focus-visible:border-primary/50 focus-visible:px-2 transition-all rounded-md bg-transparent",
                            isCompleted && "line-through text-muted-foreground"
                        )}
                    />
                </div>

                {/* Açıklama */}
                <div className="relative group/desc">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={(e) => handleUpdate('description', e.target.value)}
                        disabled={isCompleted}
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
                            disabled={isCompleted}
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

            {/* Meta Veriler ve Aksiyonlar (Sağ Taraf) */}
            <div className="col-span-12 md:col-span-5 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between md:border-l md:pl-6 border-border/50">

                {/* Sorumlu Kişi */}
                <div className="w-full md:w-40 shrink-0">
                    <Select
                        value={task.responsible_person_id || ''}
                        onValueChange={(value) => onUpdate(task.id, { responsible_person_id: value })}
                        disabled={isCompleted}
                    >
                        <SelectTrigger className="h-9 border-transparent hover:border-border bg-muted/20 hover:bg-muted/40 transition-colors text-sm">
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

                {/* Tarih ve Süre Bilgisi */}
                <div className="flex flex-col gap-1 text-xs text-muted-foreground min-w-[100px]">
                    <div className="flex items-center gap-1.5" title="Başlangıç Tarihi">
                        <Calendar className="w-3.5 h-3.5 opacity-70" />
                        {task.started_at
                            ? new Date(task.started_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
                            : '-'}
                    </div>
                    <div className="flex items-center gap-1.5" title="Geçen Süre">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        {elapsed ? (
                            <span className={cn(
                                "font-medium",
                                elapsed.isOverdue ? "text-red-500" : "text-green-600"
                            )}>
                                {elapsed.days}g {elapsed.hours}s
                            </span>
                        ) : '-'}
                    </div>
                </div>

                {/* Silme Butonu */}
                <div className="ml-auto md:ml-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(task.id, isCompleted)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 w-8"
                    >
                        <Trash2 className="w-4 h-4" />
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
