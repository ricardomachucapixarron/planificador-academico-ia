"use client";

import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
    Upload, FileText, BookOpen, Target, Edit, Copy, ChevronLeft, ChevronRight, SlidersHorizontal, X,
    BrainCog, School, Library, GraduationCap, Puzzle, Blocks, Book, CheckCircle2
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

// --- INTERFACES Y TIPOS ---

interface Conversation {
    prompt: string;
    reviewData: any[];
}

interface Tools {
    research: boolean;
    leveling: boolean;
    difficulty: string;
    indicatorSize: string;
}

interface PromptInputCardProps {
    prompt: string;
    setPrompt: (value: string) => void;
    uploadedFile: File | null;
    handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    isGenerating: boolean;
    canCreatePlanning: boolean;
    handleGenerateReview: () => void;
    conversations: Conversation[];
    isEditingPrompt: boolean;
    tempPromptText: string;
    setTempPromptText: (value: string) => void;
    handleCancelEdit: () => void;
    handleUpdatePrompt: () => void;
    currentConversationIndex: number;
    setCurrentConversationIndex: (updateFn: (prev: number) => number) => void;
    handleStartEdit: () => void;
    handleCopy: () => void;
    tools: Tools;
    setTools: (tools: Tools) => void;
}

// --- DATOS PARA RENDERIZAR OPCIONES ---
const difficultyLevels = [
  { value: 'escolar', label: 'Escolar', Icon: School },
  { value: 'estándar', label: 'Estándar', Icon: Library }
];

const indicatorSizes = [
  { value: 'atómico', label: 'Indicador Atómico', Icon: Puzzle },
  { value: 'estándar', label: 'Indicador Estándar', Icon: Target },
  { value: 'integrador', label: 'Indicador Integrador', Icon: Blocks }
];


// --- COMPONENTE ---

export default function PromptInputCard({
    prompt,
    setPrompt,
    uploadedFile,
    handleFileUpload,
    isGenerating,
    canCreatePlanning,
    handleGenerateReview,
    conversations,
    isEditingPrompt,
    tempPromptText,
    setTempPromptText,
    handleCancelEdit,
    handleUpdatePrompt,
    currentConversationIndex,
    setCurrentConversationIndex,
    handleStartEdit,
    handleCopy,
    tools,
    setTools
}: PromptInputCardProps) {
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleToolChange = (key: keyof Tools, value: any) => {
        setTools({ ...tools, [key]: value });
    };

    const RemovableBadge = ({ children, onRemove }: { children: React.ReactNode, onRemove: () => void }) => (
        <div className="flex items-center gap-1.5 pl-2 pr-1 py-1 text-xs bg-gray-700 text-gray-300 rounded-md">
            {children}
            <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="rounded-full hover:bg-gray-600 p-0.5 focus:outline-none focus:ring-2 focus:ring-gray-500">
                <X className="h-3 w-3" />
            </button>
        </div>
    );

    const getSelectedToolsBadges = () => {
        const badges = [];
        if (tools.research) {
            badges.push(
                <RemovableBadge key="research" onRemove={() => handleToolChange('research', false)}>
                    <BrainCog className="h-3 w-3" />
                    <span>Investiga</span>
                </RemovableBadge>
            );
        }
        if (tools.leveling) {
            badges.push(
                <RemovableBadge key="leveling" onRemove={() => handleToolChange('leveling', false)}>
                    <Book className="h-3 w-3" />
                    <span>Nivelación</span>
                </RemovableBadge>
            );
        }
        
        const selectedDifficulty = difficultyLevels.find(d => d.value === tools.difficulty);
        if (selectedDifficulty && selectedDifficulty.value !== 'estándar') {
            badges.push(
                <RemovableBadge key="difficulty" onRemove={() => handleToolChange('difficulty', 'estándar')}>
                    <selectedDifficulty.Icon className="h-3 w-3" />
                    <span>{selectedDifficulty.label}</span>
                </RemovableBadge>
            );
        }

        const selectedSize = indicatorSizes.find(s => s.value === tools.indicatorSize);
        if (selectedSize && selectedSize.value !== 'estándar') {
            badges.push(
                <RemovableBadge key="indicatorSize" onRemove={() => handleToolChange('indicatorSize', 'estándar')}>
                    <selectedSize.Icon className="h-3 w-3" />
                    <span>{selectedSize.label}</span>
                </RemovableBadge>
            );
        }
        
        return badges;
    };

    const selectedBadges = getSelectedToolsBadges();

    const ToolsPopover = () => (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:bg-gray-700/50">
                    <SlidersHorizontal className="h-4 w-4" />
                    {selectedBadges.length > 0 ? (
                        <div className="flex items-center gap-1">{selectedBadges}</div>
                    ) : (
                        <span>Herramientas</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-gray-900/95 backdrop-blur border-gray-700 text-gray-200">
                <div className="grid gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium leading-none">Herramientas de Generación</h4>
                        <p className="text-sm text-gray-400">
                            Ajusta los parámetros para refinar la planificación.
                        </p>
                    </div>
                    <div className="grid gap-1">
                        <div onClick={() => handleToolChange('research', !tools.research)} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                            <Label className="flex items-center gap-2 cursor-pointer"><BrainCog className="h-4 w-4 text-blue-400" />Investiga</Label>
                            {tools.research && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                        </div>
                         <div onClick={() => handleToolChange('leveling', !tools.leveling)} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                            <Label className="flex items-center gap-2 cursor-pointer"><Book className="h-4 w-4 text-blue-400" />Nivelación</Label>
                            {tools.leveling && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Nivel de Dificultad</Label>
                        <div className="grid gap-1">
                            {difficultyLevels.map(({ value, label, Icon }) => (
                                <div key={value} onClick={() => handleToolChange('difficulty', value)} className="flex items-center justify-between space-x-2 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                    <Label className="flex items-center gap-2 cursor-pointer"><Icon className="h-4 w-4" />{label}</Label>
                                    {tools.difficulty === value && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Tamaño de Indicadores</Label>
                        <div className="grid gap-1">
                            {indicatorSizes.map(({ value, label, Icon }) => (
                                <div key={value} onClick={() => handleToolChange('indicatorSize', value)} className="flex items-center justify-between space-x-2 p-2 rounded-md hover:bg-gray-700/50 cursor-pointer">
                                    <Label className="flex items-center gap-2 cursor-pointer"><Icon className="h-4 w-4" />{label}</Label>
                                    {tools.indicatorSize === value && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );

    return (
        <div className="relative group">
            <Card className="bg-gray-800 border-gray-700 shadow-sm transition-all duration-300">
                {conversations.length === 0 && (
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-100">
                            <BookOpen className="h-5 w-5" />
                            Crear Nueva Planificación
                        </CardTitle>
                        <CardDescription className="text-gray-400">
                            Describe tu curso o sube un archivo para generar una planificación.
                        </CardDescription>
                    </CardHeader>
                )}

                <CardContent className={
                    conversations.length === 0
                        ? "space-y-4 min-h-[184px] flex flex-col justify-center"
                        : "p-6" 
                }>
                    {conversations.length === 0 ? (
                        <>
                            <Textarea
                                id="prompt"
                                placeholder="Ejemplo: UNIDAD I. Sistemas de Referencia y Vectores..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="min-h-[120px] resize-none bg-gray-900 border-gray-600 text-gray-200"
                                disabled={isGenerating}
                            />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isGenerating} className="flex items-center gap-2">
                                        <Upload className="h-4 w-4" />Subir archivo
                                    </Button>
                                    <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                                    {uploadedFile && <div className="flex items-center gap-2 text-sm text-gray-400"><FileText className="h-4 w-4" />{uploadedFile.name}</div>}
                                    
                                    <div className="border-l border-gray-600 h-6 mx-1"></div>
                                    <ToolsPopover />
                                </div>
                                <Button onClick={handleGenerateReview} disabled={!canCreatePlanning}>
                                    {isGenerating ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Generando...</>) : (<><Target className="h-4 w-4 mr-2" />Generar</>)}
                                </Button>
                            </div>
                        </>
                    ) : isEditingPrompt ? (
                        <>
                            <Textarea
                                id="edit-prompt"
                                value={tempPromptText}
                                onChange={(e) => setTempPromptText(e.target.value)}
                                className="min-h-[120px] resize-none bg-gray-900 border-gray-600 text-gray-200"
                                autoFocus
                            />
                            {/* --- CAMBIO: Se muestra la barra de herramientas al editar --- */}
                            <div className="flex items-center justify-between mt-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <ToolsPopover />
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
                                    <Button onClick={handleUpdatePrompt} disabled={isGenerating}>
                                        {isGenerating ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Generando...</>) : 'Enviar'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <p className="text-gray-300 whitespace-pre-wrap max-h-32 overflow-hidden [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)]">
                            {conversations[currentConversationIndex].prompt}
                        </p>
                    )}
                </CardContent>
            </Card>
            {conversations.length > 0 && !isEditingPrompt && (
                <div className="absolute bottom-0 right-0 translate-y-full mt-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {conversations.length > 1 && (
                        <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => setCurrentConversationIndex(prev => Math.max(0, prev - 1))} disabled={currentConversationIndex === 0}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-gray-400 font-mono">
                                {currentConversationIndex + 1} / {conversations.length}
                            </span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => setCurrentConversationIndex(prev => Math.min(conversations.length - 1, prev + 1))} disabled={currentConversationIndex === conversations.length - 1}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={handleStartEdit}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={handleCopy}>
                        <Copy className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
