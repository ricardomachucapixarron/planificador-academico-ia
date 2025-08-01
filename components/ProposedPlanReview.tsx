"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, X, ThumbsUp, ThumbsDown, Share2, RefreshCw, FileSearch2, Lightbulb } from "lucide-react";

// --- INTERFACES ---
interface IndicadorDesglosado {
  habilidad: { texto: string };
  metodo: { texto: string };
  contexto: { texto: string };
}

// --- CAMBIO: Se añade justificacion_pedagogica ---
interface Indicator {
    id: string;
    title: string;
    description: string;
    nombre_modulo?: string;
    texto_indicador?: string;
    texto_contenido?: string;
    justificacion_pedagogica?: string;
    indicador_desglosado?: IndicadorDesglosado;
    status: 'original' | 'modified' | 'deleted';
    isManual: boolean;
}

interface IndicatorGroup {
    groupTitle: string;
    indicators: Indicator[];
}

interface IntroductionPhrase {
  orden: number;
  frase: string;
  id_indicador_relacionado?: string;
}

interface Conversation {
    prompt: string;
    introduction: IntroductionPhrase[];
    reviewData: IndicatorGroup[];
}

interface ProposedPlanReviewProps {
    conversation: Conversation;
    onConversationUpdate: (updatedConversation: Conversation) => void;
    onAnnotationClick: (cardId: string) => void;
    highlightedCard: string | null;
    isGeneratingData: boolean;
}


// --- SUB-COMPONENTS ---

const EditableField = ({ id, value, onSave, isTitle = false, editingId, setEditingId, className }: {
    id: string;
    value: string;
    onSave: (newValue: string) => void;
    isTitle?: boolean;
    editingId: string | null;
    setEditingId: (id: string | null) => void;
    className?: string;
}) => {
    const [text, setText] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editingId === id) {
            if (isTitle && inputRef.current) inputRef.current.focus();
            else if (!isTitle && textareaRef.current) textareaRef.current.focus();
        }
    }, [editingId, id, isTitle]);

    const handleSave = () => {
        onSave(text);
        setEditingId(null);
    };

    const defaultTitleClasses = "font-semibold text-sm text-gray-200";
    const defaultDescriptionClasses = "text-xs text-gray-400";
    const displayClasses = className || (isTitle ? defaultTitleClasses : defaultDescriptionClasses);


    if (editingId === id) {
        if (isTitle) {
            return <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                className={`${displayClasses} bg-gray-700 border-gray-600 border rounded px-1 w-full`}
            />;
        }
        return <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            autoFocus
            className="text-sm w-full bg-gray-700 text-gray-300 border-gray-600"
        />;
    }
    return <p className={`${displayClasses} cursor-pointer w-full`} onClick={() => setEditingId(id)}>{value}</p>;
};

const AnnotatedText = ({ introduction, onAnnotationClick }: { introduction: IntroductionPhrase[], onAnnotationClick: (cardId: string) => void }) => {
    return (
        <p>
            {introduction.map((item) => (
                <span key={item.orden}>
                    {item.frase}{' '}
                    {item.id_indicador_relacionado && (
                        <span 
                            className="annotation-marker text-blue-400 hover:text-blue-300 cursor-pointer font-bold"
                            onClick={() => onAnnotationClick(`review-card-${item.id_indicador_relacionado}`)}
                        >
                            <sup>[{item.id_indicador_relacionado}]</sup>
                        </span>
                    )}
                </span>
            ))}
        </p>
    );
};


// --- COMPONENTE PRINCIPAL ---

export default function ProposedPlanReview({ conversation, onConversationUpdate, onAnnotationClick, highlightedCard, isGeneratingData }: ProposedPlanReviewProps) {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('Analizando la instrucción...');
    // --- CAMBIO: Estado para la justificación visible ---
    const [visibleJustification, setVisibleJustification] = useState<string | null>(null);

    useEffect(() => {
        if (isGeneratingData) {
            setLoadingMessage('Analizando la instrucción...');
            
            const timer = setTimeout(() => {
                setLoadingMessage('Desglosando la instrucción...');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [isGeneratingData]);

    // --- CAMBIO: Efecto para cerrar la justificación ---
    useEffect(() => {
        if (!visibleJustification) return;

        // Cierra después de 10 segundos
        const timer = setTimeout(() => {
            setVisibleJustification(null);
        }, 10000);

        // Cierra al hacer clic en cualquier parte
        const handleClickOutside = () => {
            setVisibleJustification(null);
        };
        document.addEventListener('click', handleClickOutside);

        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClickOutside);
        };
    }, [visibleJustification]);

    const handleUpdate = (groupIdx: number, indicatorIdx: number | null, field: string, value: string) => {
        const newConversation = JSON.parse(JSON.stringify(conversation));
        if (indicatorIdx === null) {
            newConversation.reviewData[groupIdx].groupTitle = value;
        } else {
            (newConversation.reviewData[groupIdx].indicators[indicatorIdx] as any)[field] = value;
            if (newConversation.reviewData[groupIdx].indicators[indicatorIdx].status === 'original') {
                newConversation.reviewData[groupIdx].indicators[indicatorIdx].status = 'modified';
            }
        }
        onConversationUpdate(newConversation);
    };

    const addGroup = () => {
        const newConversation = JSON.parse(JSON.stringify(conversation));
        newConversation.reviewData.push({ groupTitle: "Nuevo Resultado de Aprendizaje", indicators: [] });
        onConversationUpdate(newConversation);
    };

    const deleteGroup = (groupIdx: number) => {
        const newConversation = JSON.parse(JSON.stringify(conversation));
        newConversation.reviewData.splice(groupIdx, 1);
        onConversationUpdate(newConversation);
    };
    
    const addIndicator = (groupIdx: number) => {
        const newConversation = JSON.parse(JSON.stringify(conversation));
        const group = newConversation.reviewData[groupIdx];
        const newIndicatorId = `${groupIdx + 1}.${group.indicators.length + 1}`;
        group.indicators.push({
            id: newIndicatorId,
            title: `Nuevo Indicador de Logro`,
            texto_contenido: "Nuevo Contenido del Syllabus",
            description: "",
            status: 'original',
            isManual: true,
        });
        onConversationUpdate(newConversation);
    };

    const deleteIndicator = (groupIdx: number, indicatorIdx: number) => {
        const newConversation = JSON.parse(JSON.stringify(conversation));
        newConversation.reviewData[groupIdx].indicators[indicatorIdx].status = 'deleted';
        onConversationUpdate(newConversation);
    };
    
    // --- CAMBIO: Handler para el clic en el ícono de justificación ---
    const handleJustificationClick = (e: React.MouseEvent, indicatorId: string) => {
        e.stopPropagation(); // Evita que el listener del documento se cierre inmediatamente
        setVisibleJustification(prevId => prevId === indicatorId ? null : indicatorId);
    };

    return (
        <div className="relative group">
            <Card className="bg-gray-800 border-gray-700 text-gray-200 min-h-[300px]">
              <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                      <FileSearch2 className="h-6 w-6 text-blue-400" />
                      Análisis de la Instrucción
                  </CardTitle>
                  {!isGeneratingData && (
                    <CardDescription className="text-gray-400">
                        Hemos desglosado tu instrucción en los siguientes indicadores. Revísalos, edítalos o añade nuevos según necesites.
                    </CardDescription>
                  )}
              </CardHeader>
              <CardContent>
                  {isGeneratingData ? (
                      <div className="flex items-center justify-center p-8 text-gray-400">
                          <div className="flex items-center gap-3">
                              <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                              </span>
                              {loadingMessage}
                          </div>
                      </div>
                  ) : (
                      <>
                          <div className="text-sm text-gray-300 border border-gray-700 p-4 rounded-md bg-gray-900/50 leading-relaxed mb-6">
                              <AnnotatedText introduction={conversation.introduction || []} onAnnotationClick={onAnnotationClick} />
                          </div>
                          
                          <div className="space-y-6">
                              {(conversation.reviewData || []).map((group, groupIdx) => (
                                  <div key={`group-${groupIdx}`}>
                                      <div className="flex items-center justify-between mb-2 group">
                                          <EditableField 
                                            id={`group-${groupIdx}`} 
                                            value={group.groupTitle} 
                                            onSave={(value) => handleUpdate(groupIdx, null, 'groupTitle', value)} 
                                            isTitle 
                                            editingId={editingId} 
                                            setEditingId={setEditingId}
                                            className="font-bold text-xs text-blue-400 uppercase tracking-wider"
                                          />
                                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteGroup(groupIdx)}><Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" /></Button>
                                      </div>
                                      <div className="overflow-x-auto rounded-lg border border-gray-700">
                                          <table className="w-full text-sm text-left">
                                              <thead className="bg-gray-700/50">
                                                  <tr>
                                                      <th scope="col" className="px-4 py-2 font-semibold text-gray-400 uppercase tracking-wider">Indicador de Logro</th>
                                                      <th scope="col" className="px-4 py-2 font-semibold text-gray-400 uppercase tracking-wider">Contenido Syllabus</th>
                                                      <th scope="col" className="relative px-4 py-2 w-20 text-center font-semibold text-gray-400 uppercase tracking-wider">Acciones</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="bg-gray-800">
                                                  {group.indicators.filter(ind => ind.status !== 'deleted').map((indicator, indicatorIdx) => (
                                                    <React.Fragment key={indicator.id}>
                                                      <tr id={`review-card-${indicator.id}`} className={`border-b border-gray-700 ${highlightedCard === `review-card-${indicator.id}` ? 'bg-blue-900/30' : ''}`}>
                                                          <td className="px-4 py-3 align-top w-1/2">
                                                              <div className="flex items-start gap-2">
                                                                  <span className="font-mono text-xs text-gray-500 pt-1">{indicator.id}</span>
                                                                  <EditableField id={`title-${indicator.id}`} value={indicator.title} onSave={(value) => handleUpdate(groupIdx, indicatorIdx, 'title', value)} isTitle editingId={editingId} setEditingId={setEditingId} />
                                                              </div>
                                                          </td>
                                                          <td className="px-4 py-3 align-top w-1/2">
                                                              <EditableField 
                                                                id={`content-${indicator.id}`} 
                                                                value={indicator.texto_contenido || ''} 
                                                                onSave={(value) => handleUpdate(groupIdx, indicatorIdx, 'texto_contenido', value)} 
                                                                editingId={editingId} 
                                                                setEditingId={setEditingId}
                                                                className="text-sm text-gray-300"
                                                              />
                                                          </td>
                                                          <td className="px-4 py-3 align-top text-center">
                                                              {/* --- CAMBIO: Botón para mostrar justificación --- */}
                                                              {indicator.justificacion_pedagogica && (
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleJustificationClick(e, indicator.id)}>
                                                                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                                                                </Button>
                                                              )}
                                                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteIndicator(groupIdx, indicatorIdx)}><X className="h-4 w-4 text-gray-400 hover:text-red-500" /></Button>
                                                          </td>
                                                      </tr>
                                                      {/* --- CAMBIO: Fila condicional para la justificación --- */}
                                                      {visibleJustification === indicator.id && (
                                                        <tr className="bg-gray-900/50">
                                                            <td colSpan={3} className="p-4 text-sm text-gray-300 border-x border-b border-gray-700" onClick={(e) => e.stopPropagation()}>
                                                                <p><strong className="font-semibold text-blue-400">Justificación Pedagógica:</strong> {indicator.justificacion_pedagogica}</p>
                                                            </td>
                                                        </tr>
                                                      )}
                                                    </React.Fragment>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                      <div className="mt-2">
                                        <Button variant="ghost" size="sm" className="text-gray-400" onClick={() => addIndicator(groupIdx)}><Plus className="h-4 w-4 mr-2" />Agregar Indicador</Button>
                                      </div>
                                  </div>
                              ))}
                               <div className="mt-4">
                                <Button variant="outline" size="sm" onClick={addGroup}><Plus className="h-4 w-4 mr-2" />Agregar Resultado de Aprendizaje</Button>
                               </div>
                          </div>
                      </>
                  )}
              </CardContent>
            </Card>
            {!isGeneratingData && (
                <div className="absolute bottom-0 left-0 translate-y-full mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => console.log('Like clicked')}>
                        <ThumbsUp className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => console.log('Dislike clicked')}>
                        <ThumbsDown className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => console.log('Share clicked')}>
                        <Share2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white" onClick={() => console.log('Retry clicked')}>
                        <RefreshCw className="h-5 w-5" />
                    </Button>
                </div>
            )}
        </div>
    );
}
