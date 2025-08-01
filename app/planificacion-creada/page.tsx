"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BrainCircuit, Star, ExternalLink, Folder, FolderOpen, CheckCircle, AlertCircle, X, Check, ChevronDown, ChevronUp, FilePenLine, Link, ArrowLeft, ArrowRight, ChevronsDown, ChevronsUp, ArrowUp, Filter, SlidersHorizontal, HelpCircle, BookOpen, ChevronLeft, ChevronRight, PlusCircle, Lightbulb } from "lucide-react"

// --- FIX: Componente HoverTooltip simplificado y robusto ---
const HoverTooltip = ({ children, content }: { children: React.ReactNode, content: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          className="z-50 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md shadow-lg absolute top-full mt-2 left-1/2 -translate-x-1/2 whitespace-nowrap max-w-xs"
        >
          {content}
        </div>
      )}
    </div>
  );
};

// --- INTERFACES (Estas deberían estar en un archivo compartido) ---
interface ModuleData {
  type: string
  moduleUrl: string
  moduleName: string
}

interface SectionDecomposition {
  decomposition_type: string;
  decomposition_text: string;
  is_covered: boolean;
  reason: string;
}

interface SuggestedSection {
  sectionname: string
  sectionprofile: string
  sectionprofile_summary: string
  modulesdata: ModuleData[]
  score: number
  ds_curriculum_tag: string
  coursename: string
  sectiondescomposition: SectionDecomposition[];
  coverage_rate: number;
  coverage_label: string;
  uncovered_reasons: string;
}

interface PlanningResult {
  requiredsectionname: string
  requiredsection: string
  requiredsectiondescription: string
  suggestedsections: SuggestedSection[]
  assignedSection: SuggestedSection | null
  topic: string; // Campo para agrupar
  texto_contenido: string; // Nuevo campo para el tema del curso
  justificacion_pedagogica?: string; // Nuevo campo para justificación
}

// --- COMPONENTE DE LA PÁGINA DE RESULTADOS ---
export default function PlanningResultsPage({ initialPlanningResults, isGeneratingData }: { initialPlanningResults: PlanningResult[], isGeneratingData: boolean }) {
  const [planningResults, setPlanningResults] = useState(initialPlanningResults);
  const [isGenerating, setIsGenerating] = useState(isGeneratingData);
  
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [currentSuggestionIndexes, setCurrentSuggestionIndexes] = useState<{ [key: number]: number }>({});
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'covered' | 'pending'>('all');
  const [assignmentThreshold, setAssignmentThreshold] = useState(0.595);
  const [tempThreshold, setTempThreshold] = useState(Math.round(0.595 * 100));
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHelpPopoverOpen, setIsHelpPopoverOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isThresholdMenuOpen, setIsThresholdMenuOpen] = useState(false);
  const [expandedAdditionalOptions, setExpandedAdditionalOptions] = useState<Set<number>>(new Set());
  const [hoveredPlaceholderIndex, setHoveredPlaceholderIndex] = useState<number | null>(null);
  const [popupContent, setPopupContent] = useState<{text: string, id: number} | null>(null);
  
  const helpRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const thresholdMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!popupContent) return;

    const timer = setTimeout(() => {
        setPopupContent(null);
    }, 10000);

    const handleClickOutside = (event: MouseEvent) => {
        const triggerEl = document.getElementById(`justification-trigger-${popupContent.id}`);
        const popupEl = document.getElementById(`justification-popup-${popupContent.id}`);

        if (triggerEl && triggerEl.contains(event.target as Node)) {
            return;
        }
        if (popupEl && popupEl.contains(event.target as Node)) {
            return;
        }
        setPopupContent(null);
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [popupContent]);

  useEffect(() => {
    setPlanningResults(initialPlanningResults);
    const defaultExpandedOptions = new Set<number>();
    initialPlanningResults.forEach((result, index) => {
      if (!result.assignedSection) {
        defaultExpandedOptions.add(index);
      }
    });
    setExpandedAdditionalOptions(defaultExpandedOptions);
  }, [initialPlanningResults]);

  useEffect(() => {
    setIsGenerating(isGeneratingData);
  }, [isGeneratingData]);

  // --- Lógica y Helpers específicos de esta página ---
  const cleanSectionName = (name: string): string => {
    if (!name) return '';
    return name.replace(/^(N?\d{1,2}\.\s)/, '');
  };

  const assignSection = (planIndex: number, section: SuggestedSection) => {
    setPlanningResults(currentResults => 
      currentResults.map((result, index) => 
        index === planIndex ? { ...result, assignedSection: section } : result
      )
    );
    const newSet = new Set(expandedAdditionalOptions);
    newSet.delete(planIndex);
    setExpandedAdditionalOptions(newSet);
    setCurrentSuggestionIndexes(prev => ({ ...prev, [planIndex]: 0 }));
  };

  const unassignSection = (planIndex: number) => {
    setPlanningResults(currentResults => 
      currentResults.map((result, index) => 
        index === planIndex ? { ...result, assignedSection: null } : result
      )
    );
    const newSet = new Set(expandedAdditionalOptions);
    newSet.add(planIndex);
    setExpandedAdditionalOptions(newSet);
  };
  
  const toggleCardExpansion = (planIndex: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(planIndex)) newExpanded.delete(planIndex);
    else newExpanded.add(planIndex);
    setExpandedCards(newExpanded);
  }

  const toggleProfileExpansion = (profileId: string) => {
    const newExpanded = new Set(expandedProfiles);
    if (newExpanded.has(profileId)) newExpanded.delete(profileId);
    else newExpanded.add(profileId);
    setExpandedProfiles(newExpanded);
  };
  
  const toggleTagsExpansion = (tagId: string) => {
    const newExpanded = new Set(expandedTags);
    if (newExpanded.has(tagId)) newExpanded.delete(tagId);
    else newExpanded.add(tagId);
    setExpandedTags(newExpanded);
  };

  const toggleAdditionalOptions = (planIndex: number) => {
    const newSet = new Set(expandedAdditionalOptions);
    if (newSet.has(planIndex)) {
        newSet.delete(planIndex);
    } else {
        newSet.add(planIndex);
    }
    setExpandedAdditionalOptions(newSet);
  };

  const handleSuggestionChange = (planIndex: number, direction: 'next' | 'prev', total: number) => {
    setCurrentSuggestionIndexes(prev => {
      const currentIndex = prev[planIndex] || 0;
      const newIndex = direction === 'next' ? (currentIndex + 1) % total : (currentIndex - 1 + total) % total;
      return { ...prev, [planIndex]: newIndex };
    });
  };
  
  const handleApplyThreshold = () => {
    const newThreshold = tempThreshold / 100;
    setAssignmentThreshold(newThreshold);
    const reprocessedResults = planningResults.map(result => {
        const sortedSuggestions = result.suggestedsections;
        const topSuggestion = sortedSuggestions[0] || null;
        const assigned = (topSuggestion && topSuggestion.score >= newThreshold && topSuggestion.coverage_label === 'Cubierto') ? topSuggestion : null;
        return { ...result, assignedSection: assigned };
    });
    setPlanningResults(reprocessedResults);
    setIsConfirmModalOpen(false);
  };

  const handleExpandAll = () => setExpandedCards(new Set(planningResults.map((_, index) => index)));
  const handleCollapseAll = () => setExpandedCards(new Set());

  const getCoverageBadgeColor = (label: string) => {
    switch (label) {
      case 'Cubierto': return "bg-green-900/50 text-green-300 border-green-500/50";
      case 'Parcialmente cubierto': return "bg-orange-900/50 text-orange-300 border-orange-500/50";
      case 'No cubierto': return "bg-gray-700 text-gray-300 border-gray-600";
      default: return "bg-gray-700 text-gray-300 border-gray-600";
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "quiz": return <FilePenLine className="h-5 w-5 text-indigo-400 flex-shrink-0" />;
      case "url": return <BookOpen className="h-5 w-5 text-teal-400 flex-shrink-0" />;
      default: return <Link className="h-5 w-5 text-gray-500 flex-shrink-0" />;
    }
  }
  
  const handleResourceClick = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const toggleResourceExpansion = (id: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(id)) newExpanded.delete(id);
    else newExpanded.add(id);
    setExpandedResources(newExpanded);
  }

  // Lógica de agrupación
  const indexedAndFilteredResults = planningResults
    .map((result, index) => ({ ...result, originalIndex: index }))
    .filter(result => {
      if (filterStatus === 'covered') return result.assignedSection !== null;
      if (filterStatus === 'pending') return result.assignedSection === null;
      return true;
    });

  const groupedResults = indexedAndFilteredResults.reduce((acc, result) => {
    const topic = result.topic || "Sin Tópico";
    if (!acc[topic]) {
      acc[topic] = [];
    }
    acc[topic].push(result);
    return acc;
  }, {} as { [key: string]: (PlanningResult & { originalIndex: number })[] });

  const coveredTopics = planningResults.filter(p => p.assignedSection !== null).length;
  const totalTopics = planningResults.length;
  const progressPercentage = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-100 mb-2">Resultados de la Planificación</h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">Explora y ajusta las sugerencias para tu planificación.</p>
        </div>
        
        <div className="space-y-6">
            {isGeneratingData ? (
                <div className="text-center py-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-400">Generando planificación detallada...</p>
                </div>
            ) : (
                <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-100">Resultados de la Búsqueda</h2>
                        <p className="text-gray-400">{planningResults.length} temas analizados.</p>
                      </div>
                      <Button variant="outline">Nueva planificación</Button>
                    </div>
                    
                    <Card className="bg-gray-800 border-gray-700">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-200">Progreso de la Planificación</h3>
                          <div className="text-2xl font-bold text-blue-400">{progressPercentage}%</div>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                          <div className="bg-blue-500 h-3 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span>Cubiertos: {coveredTopics} temas</span></div>
                          <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-500 rounded-full"></div><span>Pendientes: {totalTopics - coveredTopics} temas</span></div>
                        </div>
                      </CardContent>
                    </Card>

                    {planningResults.length > 0 && (
                      <div className="flex items-center justify-end gap-2">
                         <div className="relative inline-block text-left" ref={thresholdMenuRef}>
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600" onClick={() => setIsThresholdMenuOpen(prev => !prev)}>
                                <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                            {isThresholdMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-64 p-2 rounded-md shadow-lg bg-gray-800 border border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-between">
                                            <label htmlFor="threshold" className="text-sm font-medium whitespace-nowrap text-gray-200">Umbral de Asignación: {tempThreshold}%</label>
                                            <div className="relative" ref={helpRef}>
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setIsHelpPopoverOpen(prev => !prev); }}>
                                                    <HelpCircle className="h-4 w-4 text-gray-400" />
                                                </Button>
                                                {isHelpPopoverOpen && (
                                                    <div className="absolute bottom-full right-0 mb-2 w-56 bg-gray-900 text-white text-xs rounded-md p-2 shadow-lg z-20">
                                                        El coeficiente de similitud es una medida matemática que indica qué tan parecido es el contenido del tema requerido respecto al tema sugerido. Basado en observaciones empíricas, hemos determinado que un coeficiente de similitud de 60% representa un umbral razonable.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <input
                                            id="threshold"
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={tempThreshold}
                                            onChange={(e) => setTempThreshold(Number(e.target.value))}
                                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                            style={{ background: `linear-gradient(to right, #4f46e5 ${tempThreshold}%, #4b5563 ${tempThreshold}%)`}}
                                        />
                                        <Button className="w-full" size="sm" onClick={() => { setIsConfirmModalOpen(true); setIsThresholdMenuOpen(false); }}>Aplicar</Button>
                                    </div>
                                </div>
                            )}
                         </div>
                         <div className="relative inline-block text-left" ref={filterMenuRef}>
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600" onClick={() => setIsFilterMenuOpen(prev => !prev)}>
                                <Filter className="h-4 w-4" />
                            </Button>
                            {isFilterMenuOpen && (
                                <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 border border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
                                    <div className="py-1">
                                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700" onClick={() => { setFilterStatus('all'); setIsFilterMenuOpen(false); }}>Todos</button>
                                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700" onClick={() => { setFilterStatus('covered'); setIsFilterMenuOpen(false); }}>Cubiertos</button>
                                        <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700" onClick={() => { setFilterStatus('pending'); setIsFilterMenuOpen(false); }}>Pendientes</button>
                                    </div>
                                </div>
                            )}
                         </div>
                        <HoverTooltip content={<p>Expandir todo</p>}>
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600" onClick={handleExpandAll}>
                                <ChevronsDown className="h-4 w-4" />
                            </Button>
                        </HoverTooltip>
                        <HoverTooltip content={<p>Colapsar todo</p>}>
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600" onClick={handleCollapseAll}>
                                <ChevronsUp className="h-4 w-4" />
                            </Button>
                        </HoverTooltip>
                      </div>
                    )}

                    <div className="space-y-8">
                      {Object.entries(groupedResults).map(([topic, resultsInGroup], groupIndex) => (
                        <Card key={topic} className="bg-transparent border-none p-0">
                          <CardHeader>
                            <CardTitle className="text-xl text-gray-300">{`${groupIndex + 1}. ${topic}`}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-0 pt-4">
                            {resultsInGroup.map((result, index) => {
                              const planIndex = result.originalIndex;
                              const isExpanded = expandedCards.has(planIndex);
                              const isCovered = result.assignedSection !== null;
                              const otherSuggestions = result.suggestedsections.filter(s => s.sectionname !== result.assignedSection?.sectionname);
                              const currentSuggestionIndex = currentSuggestionIndexes[planIndex] || 0;
                              const currentSuggestion = otherSuggestions[currentSuggestionIndex];

                              return (
                                <React.Fragment key={planIndex}>
                                  <div className={`transition-all duration-500 ${isExpanded ? 'w-full' : 'max-w-3xl mx-auto'}`}>
                                    <Card className="bg-gray-800 border-gray-700 text-gray-200 rounded-2xl">
                                      <CardHeader className={`cursor-pointer hover:bg-gray-700/50 rounded-t-2xl ${!isExpanded ? 'rounded-b-2xl' : ''}`} onClick={() => toggleCardExpansion(planIndex)}>
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-2">
                                              {isCovered ? <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" /> : <AlertCircle className="h-6 w-6 text-gray-500 flex-shrink-0 mt-1" />}
                                              <div>
                                                  <CardTitle className="text-lg leading-tight text-gray-100">{result.requiredsectionname}</CardTitle>
                                                  <p className="text-sm text-gray-300 mt-1">{result.texto_contenido}</p>
                                                  <CardDescription className="text-sm text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                                                      <span>
                                                          <span className="font-semibold text-gray-300">Indicador de logro:</span> {result.requiredsectiondescription}
                                                      </span>
                                                      {result.justificacion_pedagogica && (
                                                          <div className="relative inline-block">
                                                              <Button
                                                                  id={`justification-trigger-${planIndex}`}
                                                                  variant="ghost"
                                                                  size="icon"
                                                                  className="h-5 w-5 text-yellow-400 hover:text-yellow-300"
                                                                  onClick={(e) => {
                                                                      e.stopPropagation();
                                                                      setPopupContent(popupContent?.id === planIndex ? null : { text: result.justificacion_pedagogica!, id: planIndex });
                                                                  }}
                                                              >
                                                                  <Lightbulb className="h-4 w-4" />
                                                              </Button>
                                                              {popupContent?.id === planIndex && (
                                                                  <div
                                                                      id={`justification-popup-${planIndex}`}
                                                                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 z-50 p-3 bg-gray-950 border border-gray-700 rounded-lg shadow-xl"
                                                                      onClick={(e) => e.stopPropagation()}
                                                                  >
                                                                      <h4 className="font-semibold text-sm text-yellow-400 mb-1">Justificación Pedagógica</h4>
                                                                      <p className="text-xs text-gray-300">{popupContent.text}</p>
                                                                  </div>
                                                              )}
                                                          </div>
                                                      )}
                                                  </CardDescription>
                                              </div>
                                            </div>
                                            <div className="pl-9">
                                              <Badge className={`text-sm font-medium px-3 py-1 ${isCovered ? "bg-green-900/50 text-green-300" : "bg-gray-700 text-gray-300"}`}>
                                                  {isCovered ? "Cubierto" : "Pendiente"}
                                              </Badge>
                                            </div>
                                          </div>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</Button>
                                        </div>
                                      </CardHeader>

                                      {isExpanded && (
                                        <CardContent className="p-6 border-t border-gray-700">
                                          <div className={`grid grid-cols-1 ${otherSuggestions.length > 0 ? 'lg:grid-cols-2' : ''} gap-6`}>
                                            {/* Columna Izquierda: Tema asignado */}
                                            <div>
                                              <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2 mb-3"><Star className="h-5 w-5 text-yellow-400" />Tema asignado</h3>
                                              {result.assignedSection ? (
                                                <div className="border border-gray-700 rounded-lg p-4 relative h-full">
                                                  <Button variant="ghost" size="sm" onClick={() => unassignSection(planIndex)} className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 hover:text-red-400"><X className="h-4 w-4" /></Button>
                                                  <div className="flex flex-col items-start gap-2 mb-2">
                                                    <h4 className="font-semibold text-md text-indigo-400">{cleanSectionName(result.assignedSection.sectionname)}</h4>
                                                    <div className="flex items-center flex-wrap gap-2">
                                                      <Badge className={`text-xs font-medium px-2 py-0.5 ${getCoverageBadgeColor(result.assignedSection.coverage_label)}`}>{result.assignedSection.coverage_label}</Badge>
                                                      {result.assignedSection.ds_curriculum_tag && (
                                                          <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 bg-gray-700 text-gray-300">
                                                              {result.assignedSection.ds_curriculum_tag}
                                                          </Badge>
                                                      )}
                                                      {(() => {
                                                        const allTags = [
                                                            { label: "Similitud", value: `${Math.round(result.assignedSection.score * 100)}%` },
                                                            { label: "Curso", value: result.assignedSection.coursename },
                                                            { label: "Tema", value: result.assignedSection.sectionname }
                                                        ].filter(tag => tag.value);

                                                        if (allTags.length === 0) return null;
                                                        const tagId = `assigned-tags-${planIndex}`;
                                                        return (
                                                          <div className="relative">
                                                            <Button variant="link" className="text-xs h-auto p-0 underline text-indigo-400" onClick={(e) => { e.stopPropagation(); toggleTagsExpansion(tagId); }}>
                                                              +{allTags.length} más
                                                            </Button>
                                                            {expandedTags.has(tagId) && (
                                                              <div className="absolute z-10 top-full mt-1 w-max max-w-xs bg-gray-800 border border-gray-700 rounded-md shadow-lg p-2 text-xs space-y-1">
                                                                {allTags.map(tag => (
                                                                    <p key={tag.label}><strong>{tag.label}:</strong> {tag.value}</p>
                                                                ))}
                                                              </div>
                                                            )}
                                                          </div>
                                                        );
                                                      })()}
                                                    </div>
                                                  </div>
                                                  
                                                  <p className="text-sm text-gray-400 mt-2 mb-4">
                                                      {expandedProfiles.has(`assigned-${planIndex}`) || !result.assignedSection.sectionprofile_summary
                                                          ? result.assignedSection.sectionprofile
                                                          : result.assignedSection.sectionprofile_summary
                                                      }
                                                      {result.assignedSection.sectionprofile_summary && result.assignedSection.sectionprofile_summary !== result.assignedSection.sectionprofile && (
                                                          <button onClick={(e) => { e.stopPropagation(); toggleProfileExpansion(`assigned-${planIndex}`); }} className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold text-xs inline-flex items-center align-middle" >
                                                              {expandedProfiles.has(`assigned-${planIndex}`) ? 'Ver menos' : 'Ver más'}
                                                              {expandedProfiles.has(`assigned-${planIndex}`) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                          </button>
                                                      )}
                                                  </p>

                                                  {result.assignedSection.coverage_label !== 'Cubierto' && result.assignedSection.uncovered_reasons && (
                                                      <div className="mt-3 pt-3 border-t border-dashed border-red-400/30">
                                                          <h5 className="text-sm font-semibold text-red-400">Puntos no cubiertos:</h5>
                                                          <p className="text-xs text-red-400/80 mt-1">{result.assignedSection.uncovered_reasons}</p>
                                                      </div>
                                                  )}

                                                  <div className="flex items-center gap-2 mt-4">
                                                    <Button variant="ghost" size="sm" onClick={() => toggleResourceExpansion(`assigned-${planIndex}`)} className="h-6 w-6 p-0 text-indigo-400 hover:text-indigo-300">
                                                      {expandedResources.has(`assigned-${planIndex}`) ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                                                    </Button>
                                                    <span className="text-sm font-medium text-indigo-400">{result.assignedSection.modulesdata.length} recursos</span>
                                                  </div>
                                                  {expandedResources.has(`assigned-${planIndex}`) && (
                                                    <div className="mt-3 border-t border-gray-700 pt-3 space-y-1">
                                                      {result.assignedSection.modulesdata.map((resource, resIndex) => (
                                                        <button key={resIndex} onClick={() => handleResourceClick(resource.moduleUrl)} className="w-full text-left p-2 text-sm hover:bg-gray-700/50 rounded flex items-center gap-3 transition-colors">
                                                          {getResourceIcon(resource.type)}
                                                          <span className="flex-1 text-gray-300 truncate">{resource.moduleName}</span>
                                                          <ExternalLink className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                        </button>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div 
                                                  className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-700 rounded-lg h-full flex items-center justify-center cursor-pointer transition-colors hover:bg-gray-700/50 hover:border-gray-500"
                                                  onMouseEnter={() => setHoveredPlaceholderIndex(planIndex)}
                                                  onMouseLeave={() => setHoveredPlaceholderIndex(null)}
                                                >
                                                  {hoveredPlaceholderIndex === planIndex ? (
                                                    <div className="flex flex-col items-center gap-2 text-gray-400">
                                                      <PlusCircle className="h-8 w-8" />
                                                      <span className="font-semibold">Crear</span>
                                                    </div>
                                                  ) : (
                                                    <p>No hay ninguna sección asignada.</p>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            
                                            {/* Columna Derecha: Opciones Adicionales */}
                                            {otherSuggestions.length > 0 && (
                                              <div>
                                                <div 
                                                  className="flex justify-between items-center mb-3 cursor-pointer rounded-md p-2 -m-2 hover:bg-gray-700/50" 
                                                  onClick={() => toggleAdditionalOptions(planIndex)}
                                                >
                                                    <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                                                      <BrainCircuit className="h-5 w-5 text-gray-400" />Opciones Adicionales
                                                    </h3>
                                                    {expandedAdditionalOptions.has(planIndex) ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                                                </div>
                                                {expandedAdditionalOptions.has(planIndex) && (
                                                  <div className="space-y-2">
                                                    <div className="border-2 border-dashed border-gray-700/50 rounded-lg p-3 opacity-70 hover:opacity-100 transition-opacity">
                                                      <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                          <h4 className="font-semibold text-md truncate mb-1 text-gray-200">{cleanSectionName(currentSuggestion.sectionname)}</h4>
                                                          <div className="flex items-center flex-wrap gap-2">
                                                            <Badge className={`text-xs font-medium px-2 py-0.5 ${getCoverageBadgeColor(currentSuggestion.coverage_label)}`}>{currentSuggestion.coverage_label}</Badge>
                                                            {currentSuggestion.ds_curriculum_tag && (
                                                                <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5 bg-gray-700 text-gray-300">
                                                                    {currentSuggestion.ds_curriculum_tag}
                                                                </Badge>
                                                            )}
                                                            {(() => {
                                                              const allTags = [
                                                                  { label: "Similitud", value: `${Math.round(currentSuggestion.score * 100)}%` },
                                                                  { label: "Curso", value: currentSuggestion.coursename },
                                                                  { label: "Tema", value: currentSuggestion.sectionname }
                                                              ].filter(tag => tag.value);
                                                              
                                                              if (allTags.length === 0) return null;
                                                              const tagId = `other-tags-${planIndex}-${currentSuggestionIndex}`;
                                                              return (
                                                                <div className="relative">
                                                                  <Button variant="link" className="text-xs h-auto p-0 underline text-indigo-400" onClick={(e) => { e.stopPropagation(); toggleTagsExpansion(tagId); }}>
                                                                    +{allTags.length} más
                                                                  </Button>
                                                                  {expandedTags.has(tagId) && (
                                                                    <div className="absolute z-10 top-full mt-1 w-max max-w-xs bg-gray-800 border border-gray-700 rounded-md shadow-lg p-2 text-xs space-y-1">
                                                                      {allTags.map(tag => (
                                                                          <p key={tag.label}><strong>{tag.label}:</strong> {tag.value}</p>
                                                                      ))}
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              );
                                                            })()}
                                                          </div>
                                                          
                                                          <p className="text-xs text-gray-400 mt-2 mb-2">
                                                            {expandedProfiles.has(`other-profile-${planIndex}-${currentSuggestionIndex}`) || !currentSuggestion.sectionprofile_summary
                                                                ? currentSuggestion.sectionprofile
                                                                : currentSuggestion.sectionprofile_summary
                                                            }
                                                            {currentSuggestion.sectionprofile_summary && currentSuggestion.sectionprofile_summary !== currentSuggestion.sectionprofile && (
                                                                <button onClick={(e) => { e.stopPropagation(); toggleProfileExpansion(`other-profile-${planIndex}-${currentSuggestionIndex}`); }} className="ml-2 text-indigo-400 hover:text-indigo-300 font-semibold text-xs inline-flex items-center align-middle">
                                                                    {expandedProfiles.has(`other-profile-${planIndex}-${currentSuggestionIndex}`) ? 'Ver menos' : 'Ver más'}
                                                                    {expandedProfiles.has(`other-profile-${planIndex}-${currentSuggestionIndex}`) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                                </button>
                                                            )}
                                                          </p>
                                                          
                                                          {currentSuggestion.coverage_label !== 'Cubierto' && currentSuggestion.uncovered_reasons && (
                                                              <div className="mt-2 pt-2 border-t border-dashed border-red-400/30">
                                                                  <h5 className="text-sm font-semibold text-red-400">Puntos no cubiertos:</h5>
                                                                  <p className="text-xs text-red-400/80 mt-1">{currentSuggestion.uncovered_reasons}</p>
                                                              </div>
                                                          )}

                                                          <div className="flex items-center gap-2 mt-4">
                                                            <Button variant="ghost" size="sm" onClick={() => toggleResourceExpansion(`other-${planIndex}-${currentSuggestionIndex}`)} className="h-6 w-6 p-0 text-indigo-400 hover:text-indigo-300">
                                                              {expandedResources.has(`other-${planIndex}-${currentSuggestionIndex}`) ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                                                            </Button>
                                                            <span className="text-sm font-medium text-indigo-400">{currentSuggestion.modulesdata.length} recursos</span>
                                                          </div>
                                                        </div>
                                                        <Button size="sm" variant="outline" className="flex items-center gap-2 self-center flex-shrink-0 bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600" onClick={() => assignSection(planIndex, currentSuggestion)}><Check className="h-4 w-4"/>Elegir</Button>
                                                      </div>
                                                      {expandedResources.has(`other-${planIndex}-${currentSuggestionIndex}`) && (
                                                        <div className="mt-3 border-t border-gray-700 pt-3 space-y-1">
                                                          {currentSuggestion.modulesdata.map((resource, resIndex) => (
                                                            <button key={resIndex} onClick={() => handleResourceClick(resource.moduleUrl)} className="w-full text-left p-2 text-sm hover:bg-gray-700/50 rounded flex items-center gap-3 transition-colors">
                                                              {getResourceIcon(resource.type)}
                                                              <span className="flex-1 text-gray-300 truncate">{resource.moduleName}</span>
                                                              <ExternalLink className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                            </button>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                    {otherSuggestions.length > 1 && (
                                                      <div className="flex items-center justify-center gap-4 mt-2">
                                                        <Button variant="outline" size="icon" className="h-8 w-8 bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600" onClick={() => handleSuggestionChange(planIndex, 'prev', otherSuggestions.length)}>
                                                          <ArrowLeft className="h-4 w-4" />
                                                        </Button>
                                                        <span className="text-sm font-medium text-gray-400">{currentSuggestionIndex + 1} / {otherSuggestions.length}</span>
                                                        <Button variant="outline" size="icon" className="h-8 w-8 bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600" onClick={() => handleSuggestionChange(planIndex, 'next', otherSuggestions.length)}>
                                                          <ArrowRight className="h-4 w-4" />
                                                        </Button>
                                                      </div>
                                                    )}
                                                  </div>
                                              )}
                                            </div>
                                          )}
                                          </div>
                                        </CardContent>
                                      )}
                                    </Card>
                                  </div>
                                  {index < resultsInGroup.length - 1 && (
                                    <div className="flex justify-center h-8 my-1" aria-hidden="true">
                                      <ChevronDown className="h-6 w-6 text-gray-600" />
                                    </div>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                </>
            )}
        </div>
        {isConfirmModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 p-6 rounded-lg shadow-xl border border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-100">Confirmar Cambio</h2>
                    <p className="text-gray-300">¿Seguro que desea aplicar este cambio a todos los temas?</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleApplyThreshold}>Aceptar</Button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
