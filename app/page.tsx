"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, BookOpen, Target, BrainCircuit, Star, ExternalLink, Folder, FolderOpen, CheckCircle, AlertCircle, X, Check, ChevronDown, ChevronUp, FilePenLine, Link, ArrowLeft, ArrowRight, ChevronsDown, ChevronsUp, ArrowUp, Filter, SlidersHorizontal, HelpCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// --- FIX: Definición local del componente Tooltip ---
const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>; // Corregido para aceptar null
} | null>(null);

const useTooltip = () => {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("useTooltip must be used within a TooltipProvider");
  }
  return context;
};

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  return (
    <TooltipContext.Provider value={{ open, setOpen, triggerRef }}>
      {children}
    </TooltipContext.Provider>
  );
};

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  return <TooltipProvider>{children}</TooltipProvider>;
};

const TooltipTrigger = React.forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => { // Corregido: 'asChild' eliminado
  const { setOpen, triggerRef } = useTooltip();
  const internalRef = useRef<HTMLButtonElement>(null);
  const combinedRef = (node: HTMLButtonElement | null) => {
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    (internalRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
  };

  const child = React.Children.only(children) as React.ReactElement;

  return React.cloneElement(child, {
    ...props,
    ref: combinedRef,
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onFocus: () => setOpen(true),
    onBlur: () => setOpen(false),
  });
});
TooltipTrigger.displayName = "TooltipTrigger";

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, className, ...props }, ref) => {
  const { open, triggerRef } = useTooltip();
  const [position, setPosition] = useState({ top: 0, left: 0 });

  React.useEffect(() => {
    if (open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  }, [open, triggerRef]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        transform: 'translateX(-50%)',
      }}
      className={`z-50 px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md shadow-md animate-in fade-in-0 zoom-in-95 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
TooltipContent.displayName = "TooltipContent";

// --- FIX: Definición local del componente DropdownMenu ---
const DropdownMenuContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} | null>(null);

const useDropdownMenu = () => {
    const context = React.useContext(DropdownMenuContext);
    if (!context) {
        throw new Error("useDropdownMenu must be used within a DropdownMenu");
    }
    return context;
};

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
    const [open, setOpen] = useState(false);
    return (
        <DropdownMenuContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block text-left">{children}</div>
        </DropdownMenuContext.Provider>
    );
};

const DropdownMenuTrigger = ({ children }: { children: React.ReactNode }) => {
    const { open, setOpen } = useDropdownMenu();
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
        onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            setOpen(!open);
        },
    });
};

const DropdownMenuContent = ({ children, className }: { children: React.ReactNode, className?: string }) => {
    const { open, setOpen } = useDropdownMenu();
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setOpen]);

    if (!open) return null;

    return (
        <div ref={menuRef} className={`origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-20 ${className}`}>
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                {children}
            </div>
        </div>
    );
};

const DropdownMenuItem = ({ children, onClick }: { children: React.ReactNode, onClick: () => void }) => {
    const { setOpen } = useDropdownMenu();
    return (
        <button
            onClick={() => {
                onClick();
                setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            role="menuitem"
        >
            {children}
        </button>
    );
};

// --- INTERFACES ADAPTADAS A LA NUEVA ESTRUCTURA DE N8N Y LA UI ---

interface ModuleData {
  type: string
  moduleUrl: string
  moduleName: string
}

interface SuggestedSection {
  sectionname: string
  sectionprofile: string
  sectionprofile_summary: string
  modulesdata: ModuleData[]
  score: number
  ds_curriculum_tag: string
  coursename: string // Nuevo campo para el nombre del curso
}

interface PlanningResult {
  requiredsection: string
  requiredsectiondescription: string
  suggestedsections: SuggestedSection[]
  // Guardamos la sección asignada para poder cambiarla
  assignedSection: SuggestedSection | null
}

// --- COMPONENTE PRINCIPAL ---

export default function AcademicPlanner() {
  const [prompt, setPrompt] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [planningResults, setPlanningResults] = useState<PlanningResult[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set())
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())
  const [expandedProfiles, setExpandedProfiles] = useState<Set<string>>(new Set());
  const [currentSuggestionIndexes, setCurrentSuggestionIndexes] = useState<{ [key: number]: number }>({});
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'covered' | 'pending'>('all');
  const [assignmentThreshold, setAssignmentThreshold] = useState(0.595);
  const [tempThreshold, setTempThreshold] = useState(Math.round(0.595 * 100));
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHelpPopoverOpen, setIsHelpPopoverOpen] = useState(false);
  const helpRef = useRef<HTMLDivElement>(null);

  // Función para limpiar el prefijo del nombre de la sección
  const cleanSectionName = (name: string): string => {
    if (!name) return '';
    // Expresión regular para quitar prefijos como "N01. " o "10. "
    return name.replace(/^(N?\d{1,2}\.\s)/, '');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setPrompt("")
    }
  }

  const handleCreatePlanning = async () => {
    setIsGenerating(true)
    setHasGenerated(false)
    setPlanningResults([])

    const n8nWebhookUrl = "https://pixarron.app.n8n.cloud/webhook/4d5d060a-50ce-4d82-9208-1f7baae747cc"; // ¡URL DE EJEMPLO!

    try {
      let response;
      if (uploadedFile) {
        const formData = new FormData();
        formData.append('data', uploadedFile);
        response = await fetch(n8nWebhookUrl, { method: 'POST', body: formData });
      } else if (prompt.trim()) {
        const requestBody = [{ textoBusqueda: prompt, tipoDeBusqueda: "section" }];
        response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
      } else {
        alert("Por favor, describe tu planificación o sube un archivo.");
        setIsGenerating(false);
        return;
      }

      if (!response.ok) throw new Error(`Error en la petición a n8n: ${response.statusText}`);

      const responseData = await response.json();
      const results: Omit<PlanningResult, 'assignedSection'>[] = responseData.planningdata || [];
      
      const initialIndexes: { [key: number]: number } = {};
      const processedResults: PlanningResult[] = results.map((result, index) => {
        initialIndexes[index] = 0; // Inicializar el índice del carrusel para cada tarjeta
        const sortedSuggestions = [...result.suggestedsections].sort((a, b) => b.score - a.score);
        const topSuggestion = sortedSuggestions[0] || null;
        const assigned = (topSuggestion && topSuggestion.score >= assignmentThreshold) ? topSuggestion : null;
        
        return {
          ...result,
          suggestedsections: sortedSuggestions,
          assignedSection: assigned,
        };
      });
      
      setCurrentSuggestionIndexes(initialIndexes);
      setPlanningResults(processedResults);
      setHasGenerated(true);

    } catch (error) {
      console.error("No se pudo conectar con el servicio de planificación:", error);
      alert("Hubo un error al generar la planificación. Revisa la consola para más detalles.");
    } finally {
      setIsGenerating(false);
    }
  }

  const assignSection = (planIndex: number, section: SuggestedSection) => {
    setPlanningResults(currentResults => 
      currentResults.map((result, index) => 
        index === planIndex ? { ...result, assignedSection: section } : result
      )
    );
    setCurrentSuggestionIndexes(prev => ({ ...prev, [planIndex]: 0 }));
  };

  const unassignSection = (planIndex: number) => {
    setPlanningResults(currentResults => 
      currentResults.map((result, index) => 
        index === planIndex ? { ...result, assignedSection: null } : result
      )
    );
  };

  const toggleCardExpansion = (planIndex: number) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(planIndex)) {
      newExpanded.delete(planIndex);
    } else {
      newExpanded.add(planIndex);
    }
    setExpandedCards(newExpanded);
  }

  const toggleProfileExpansion = (profileId: string) => {
    const newExpanded = new Set(expandedProfiles);
    if (newExpanded.has(profileId)) {
        newExpanded.delete(profileId);
    } else {
        newExpanded.add(profileId);
    }
    setExpandedProfiles(newExpanded);
  };
  
  const toggleTagsExpansion = (tagId: string) => {
    const newExpanded = new Set(expandedTags);
    if (newExpanded.has(tagId)) {
        newExpanded.delete(tagId);
    } else {
        newExpanded.add(tagId);
    }
    setExpandedTags(newExpanded);
  };

  const handleSuggestionChange = (planIndex: number, direction: 'next' | 'prev', total: number) => {
    setCurrentSuggestionIndexes(prev => {
      const currentIndex = prev[planIndex] || 0;
      const newIndex = direction === 'next' 
        ? (currentIndex + 1) % total
        : (currentIndex - 1 + total) % total;
      return { ...prev, [planIndex]: newIndex };
    });
  };
  
  const handleApplyThreshold = () => {
    const newThreshold = tempThreshold / 100;
    setAssignmentThreshold(newThreshold);
    
    const reprocessedResults = planningResults.map(result => {
        const sortedSuggestions = result.suggestedsections;
        const topSuggestion = sortedSuggestions[0] || null;
        const assigned = (topSuggestion && topSuggestion.score >= newThreshold) ? topSuggestion : null;
        return {
          ...result,
          assignedSection: assigned,
        };
    });
    
    setPlanningResults(reprocessedResults);
    setIsConfirmModalOpen(false);
  };

  const handleExpandAll = () => {
    const allCardIndexes = new Set(planningResults.map((_, index) => index));
    setExpandedCards(allCardIndexes);
  };

  const handleCollapseAll = () => {
    setExpandedCards(new Set());
  };

  const getSimilarityBadgeColor = (similarity: number) => {
    if (similarity >= assignmentThreshold) return "bg-green-100 text-green-800 border-green-300";
    if (similarity >= 0.40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "quiz": return <FilePenLine className="h-5 w-5 text-indigo-600 flex-shrink-0" />;
      case "url": return <BookOpen className="h-5 w-5 text-teal-600 flex-shrink-0" />;
      default: return <Link className="h-5 w-5 text-gray-500 flex-shrink-0" />;
    }
  }
  
  const handleResourceClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const toggleResourceExpansion = (id: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedResources(newExpanded);
  }

  const canCreatePlanning = (prompt.trim().length > 0 || uploadedFile) && !isGenerating;

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScrollTop && window.pageYOffset > 300) {
        setShowScrollTop(true);
      } else if (showScrollTop && window.pageYOffset <= 300) {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, [showScrollTop]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(event.target as Node)) {
        setIsHelpPopoverOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredPlanningResults = planningResults.filter(result => {
    if (filterStatus === 'covered') return result.assignedSection !== null;
    if (filterStatus === 'pending') return result.assignedSection === null;
    return true;
  });

  const coveredTopics = planningResults.filter(p => p.assignedSection !== null).length;
  const totalTopics = planningResults.length;
  const progressPercentage = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Planificador Académico</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">Genera planificaciones educativas precisas y personalizadas conectando objetivos curriculares con recursos y proyectos pedagógicos sugeridos.</p>
        </div>

        {!hasGenerated ? (
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Crear Nueva Planificación</CardTitle>
              <CardDescription>Describe tu curso o sube un archivo para generar una planificación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <Textarea
                id="prompt"
                placeholder="Ejemplo: UNIDAD I. Sistemas de Referencia y Vectores..."
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (e.target.value) setUploadedFile(null);
                }}
                className="min-h-[120px] resize-none"
                disabled={isGenerating}
              />
              <div className="flex items-center justify-center"><div className="flex items-center gap-4 text-sm text-gray-500"><div className="h-px bg-gray-300 flex-1"></div><span>o</span><div className="h-px bg-gray-300 flex-1"></div></div></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isGenerating} className="flex items-center gap-2"><Upload className="h-4 w-4" />Subir archivo</Button>
                  <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
                  {uploadedFile && <div className="flex items-center gap-2 text-sm text-gray-600"><FileText className="h-4 w-4" />{uploadedFile.name}</div>}
                </div>
                <Button onClick={handleCreatePlanning} disabled={!canCreatePlanning} className="flex items-center gap-2">
                  {isGenerating ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>Generando...</>) : (<><Target className="h-4 w-4" />Crear planificación</>)}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Resultados de la Búsqueda</h2>
                <p className="text-gray-600">{planningResults.length} temas analizados.</p>
              </div>
              <Button variant="outline" onClick={() => { setHasGenerated(false); setPlanningResults([]); setPrompt(""); setUploadedFile(null); }}>Nueva planificación</Button>
            </div>
            
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Progreso de la Planificación</h3>
                  <div className="text-2xl font-bold text-blue-600">{progressPercentage}%</div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span>Cubiertos: {coveredTopics} temas</span></div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-400 rounded-full"></div><span>Pendientes: {totalTopics - coveredTopics} temas</span></div>
                </div>
              </CardContent>
            </Card>

            {planningResults.length > 0 && (
              <div className="flex items-center justify-end gap-2">
                 <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="threshold" className="text-sm font-medium">Umbral de Asignación: {tempThreshold}%</label>
                                <div className="relative" ref={helpRef}>
                                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); setIsHelpPopoverOpen(prev => !prev); }}>
                                        <HelpCircle className="h-4 w-4 text-gray-500" />
                                    </Button>
                                    {isHelpPopoverOpen && (
                                        <div className="absolute bottom-full right-0 mb-2 w-56 bg-gray-800 text-white text-xs rounded-md p-2 shadow-lg z-20">
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
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                style={{ background: `linear-gradient(to right, #d1d5db ${tempThreshold}%, #3b82f6 ${tempThreshold}%)`}}
                            />
                            <Button className="w-full" size="sm" onClick={() => setIsConfirmModalOpen(true)}>Aplicar</Button>
                        </div>
                    </DropdownMenuContent>
                 </DropdownMenu>
                 <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="outline" size="icon" className="h-8 w-8">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilterStatus('all')}>Todos</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus('covered')}>Cubiertos</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilterStatus('pending')}>Pendientes</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleExpandAll} className="h-8 w-8">
                      <ChevronsDown className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Expandir todo</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={handleCollapseAll} className="h-8 w-8">
                      <ChevronsUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Colapsar todo</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            <div className="space-y-4">
              {filteredPlanningResults.map((result, _) => { // Corregido: 'index' no se usa
                const planIndex = planningResults.findIndex(p => p.requiredsection === result.requiredsection);
                const isExpanded = expandedCards.has(planIndex);
                const isCovered = result.assignedSection !== null;
                const otherSuggestions = result.suggestedsections.filter(s => s.sectionname !== result.assignedSection?.sectionname);
                const currentSuggestionIndex = currentSuggestionIndexes[planIndex] || 0;
                const currentSuggestion = otherSuggestions[currentSuggestionIndex];

                return (
                  <Card key={planIndex} className="bg-white shadow-md rounded-lg">
                    <CardHeader className="cursor-pointer hover:bg-gray-50" onClick={() => toggleCardExpansion(planIndex)}>
                       <div className="flex items-start justify-between gap-4">
                         <div className="flex-1">
                           <div className="flex items-center gap-3 mb-2">
                            {isCovered ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertCircle className="h-6 w-6 text-gray-400" />}
                            <div>
                                <CardTitle className="text-lg leading-tight text-gray-800">{result.requiredsection}</CardTitle>
                                <CardDescription className="text-sm text-gray-600 mt-1">{result.requiredsectiondescription}</CardDescription>
                            </div>
                           </div>
                           <Badge className={`text-sm font-medium px-3 py-1 ${isCovered ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                            {isCovered ? "Cubierto" : "Pendiente"}
                           </Badge>
                         </div>
                         <Button variant="ghost" size="sm" className="h-8 w-8 p-0">{isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</Button>
                       </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-6 border-t">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Columna Izquierda: Tema asignado */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3"><Star className="h-5 w-5 text-yellow-500" />Tema asignado</h3>
                            {result.assignedSection ? (
                              <div className="border border-gray-200 rounded-lg p-4 relative h-full">
                                <Button variant="ghost" size="sm" onClick={() => unassignSection(planIndex)} className="absolute top-2 right-2 h-6 w-6 p-0 text-red-500 hover:text-red-700"><X className="h-4 w-4" /></Button>
                                <div className="flex flex-col items-start gap-2 mb-2">
                                  <h4 className="font-semibold text-md text-indigo-600">{cleanSectionName(result.assignedSection.sectionname)}</h4>
                                  <div className="flex items-center flex-wrap gap-2">
                                    <Badge className={`text-xs font-medium px-2 py-0.5 ${getSimilarityBadgeColor(result.assignedSection.score)}`}>{Math.round(result.assignedSection.score * 100)}% Similitud</Badge>
                                    {(() => {
                                      const extraTags = [result.assignedSection.ds_curriculum_tag, result.assignedSection.coursename, result.assignedSection.sectionname].filter(Boolean);
                                      if (extraTags.length === 0) return null;
                                      const tagId = `assigned-tags-${planIndex}`;
                                      return (
                                        <div className="relative">
                                          <Button variant="link" className="text-xs h-auto p-0 underline text-indigo-600" onClick={(e) => { e.stopPropagation(); toggleTagsExpansion(tagId); }}>
                                            +{extraTags.length} más
                                          </Button>
                                          {expandedTags.has(tagId) && (
                                            <div className="absolute z-10 top-full mt-1 w-max max-w-xs bg-white border rounded-md shadow-lg p-2 text-xs space-y-1">
                                              {result.assignedSection.ds_curriculum_tag && <p><strong>Fuente:</strong> {result.assignedSection.ds_curriculum_tag}</p>}
                                              {result.assignedSection.coursename && <p><strong>Curso:</strong> {result.assignedSection.coursename}</p>}
                                              <p><strong>Tema:</strong> {result.assignedSection.sectionname}</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 mt-2 mb-4">
                                    {expandedProfiles.has(`assigned-${planIndex}`) || !result.assignedSection.sectionprofile_summary
                                        ? result.assignedSection.sectionprofile
                                        : result.assignedSection.sectionprofile_summary
                                    }
                                    {result.assignedSection.sectionprofile_summary && result.assignedSection.sectionprofile_summary !== result.assignedSection.sectionprofile && (
                                        <button onClick={(e) => { e.stopPropagation(); toggleProfileExpansion(`assigned-${planIndex}`); }} className="ml-2 text-indigo-600 hover:text-indigo-800 font-semibold text-xs inline-flex items-center align-middle" >
                                            {expandedProfiles.has(`assigned-${planIndex}`) ? 'Ver menos' : 'Ver más'}
                                            {expandedProfiles.has(`assigned-${planIndex}`) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </button>
                                    )}
                                </p>

                                <div className="flex items-center gap-2 mt-2">
                                  <Button variant="ghost" size="sm" onClick={() => toggleResourceExpansion(`assigned-${planIndex}`)} className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-800">
                                    {expandedResources.has(`assigned-${planIndex}`) ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                                  </Button>
                                  <span className="text-sm font-medium text-indigo-600">{result.assignedSection.modulesdata.length} recursos</span>
                                </div>
                                {expandedResources.has(`assigned-${planIndex}`) && (
                                  <div className="mt-3 border-t pt-3 space-y-1">
                                    {result.assignedSection.modulesdata.map((resource, resIndex) => (
                                      <button key={resIndex} onClick={() => handleResourceClick(resource.moduleUrl)} className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded flex items-center gap-3 transition-colors">
                                        {getResourceIcon(resource.type)}
                                        <span className="flex-1 text-gray-700 truncate">{resource.moduleName}</span>
                                        <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg h-full flex items-center justify-center">No hay ninguna sección asignada.</div>
                            )}
                          </div>
                          
                          {/* Columna Derecha: Opciones Adicionales */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3"><BrainCircuit className="h-5 w-5 text-gray-500" />Opciones Adicionales</h3>
                            {otherSuggestions.length > 0 ? (
                              <div className="space-y-2">
                                <div className="border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-md truncate mb-1">{cleanSectionName(currentSuggestion.sectionname)}</h4>
                                      <div className="flex items-center flex-wrap gap-2">
                                        <Badge className={`text-xs font-medium px-2 py-0.5 ${getSimilarityBadgeColor(currentSuggestion.score)}`}>{Math.round(currentSuggestion.score * 100)}% Similitud</Badge>
                                        {(() => {
                                          const extraTags = [currentSuggestion.ds_curriculum_tag, currentSuggestion.coursename, currentSuggestion.sectionname].filter(Boolean);
                                          if (extraTags.length === 0) return null;
                                          const tagId = `other-tags-${planIndex}-${currentSuggestionIndex}`;
                                          return (
                                            <div className="relative">
                                              <Button variant="link" className="text-xs h-auto p-0 underline text-indigo-600" onClick={(e) => { e.stopPropagation(); toggleTagsExpansion(tagId); }}>
                                                +{extraTags.length} más
                                              </Button>
                                              {expandedTags.has(tagId) && (
                                                <div className="absolute z-10 top-full mt-1 w-max max-w-xs bg-white border rounded-md shadow-lg p-2 text-xs space-y-1">
                                                  {currentSuggestion.ds_curriculum_tag && <p><strong>Fuente:</strong> {currentSuggestion.ds_curriculum_tag}</p>}
                                                  {currentSuggestion.coursename && <p><strong>Curso:</strong> {currentSuggestion.coursename}</p>}
                                                  <p><strong>Tema:</strong> {currentSuggestion.sectionname}</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                      
                                      <p className="text-xs text-gray-600 mt-2 mb-2">
                                        {expandedProfiles.has(`other-profile-${planIndex}-${currentSuggestionIndex}`) || !currentSuggestion.sectionprofile_summary
                                            ? currentSuggestion.sectionprofile
                                            : currentSuggestion.sectionprofile_summary
                                        }
                                        {currentSuggestion.sectionprofile_summary && currentSuggestion.sectionprofile_summary !== currentSuggestion.sectionprofile && (
                                            <button onClick={(e) => { e.stopPropagation(); toggleProfileExpansion(`other-profile-${planIndex}-${currentSuggestionIndex}`); }} className="ml-2 text-indigo-600 hover:text-indigo-800 font-semibold text-xs inline-flex items-center align-middle">
                                                {expandedProfiles.has(`other-profile-${planIndex}-${currentSuggestionIndex}`) ? 'Ver menos' : 'Ver más'}
                                                {expandedProfiles.has(`other-profile-${planIndex}-${currentSuggestionIndex}`) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                        )}
                                      </p>

                                      <div className="flex items-center gap-2 mt-2">
                                        <Button variant="ghost" size="sm" onClick={() => toggleResourceExpansion(`other-${planIndex}-${currentSuggestionIndex}`)} className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-800">
                                          {expandedResources.has(`other-${planIndex}-${currentSuggestionIndex}`) ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                                        </Button>
                                        <span className="text-sm font-medium text-indigo-600">{currentSuggestion.modulesdata.length} recursos</span>
                                      </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => assignSection(planIndex, currentSuggestion)} className="flex items-center gap-2 self-center flex-shrink-0"><Check className="h-4 w-4"/>Elegir</Button>
                                  </div>
                                  {expandedResources.has(`other-${planIndex}-${currentSuggestionIndex}`) && (
                                    <div className="mt-3 border-t pt-3 space-y-1">
                                      {currentSuggestion.modulesdata.map((resource, resIndex) => (
                                        <button key={resIndex} onClick={() => handleResourceClick(resource.moduleUrl)} className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded flex items-center gap-3 transition-colors">
                                          {getResourceIcon(resource.type)}
                                          <span className="flex-1 text-gray-700 truncate">{resource.moduleName}</span>
                                          <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {otherSuggestions.length > 1 && (
                                  <div className="flex items-center justify-center gap-4 mt-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSuggestionChange(planIndex, 'prev', otherSuggestions.length)}>
                                      <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium text-gray-600">{currentSuggestionIndex + 1} / {otherSuggestions.length}</span>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleSuggestionChange(planIndex, 'next', otherSuggestions.length)}>
                                      <ArrowRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ) : (
                               <div className="text-center text-gray-500 py-8 border-2 border-dashed rounded-lg h-full flex items-center justify-center">No hay otras sugerencias.</div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {isConfirmModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl">
                    <h2 className="text-lg font-semibold mb-4">Confirmar Cambio</h2>
                    <p>¿Seguro que desea aplicar este cambio a todos los temas?</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="ghost" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleApplyThreshold}>Aceptar</Button>
                    </div>
                </div>
            </div>
        )}

        {showScrollTop && (
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 h-12 w-12 rounded-full shadow-lg"
            size="icon"
          >
            <ArrowUp className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  )
}
