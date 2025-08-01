"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"

import PlanningResultsView from "@/components/PlanningResultsView"
import ProposedPlanReview from "@/components/ProposedPlanReview"
import PromptInputCard from "@/components/PromptInputCard"

// --- INTERFACES DE DATOS ---
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
  topic: string;
  texto_contenido: string;
  justificacion_pedagogica?: string;
}

interface IndicadorDesglosado {
  habilidad: { texto: string };
  metodo: { texto: string };
  contexto: { texto: string };
}

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

// --- COMPONENTE PRINCIPAL DE LA PÁGINA ---
export default function AcademicPlanner() {
  const [prompt, setPrompt] = useState("El estudiante debe poder comprender textos complejos y, además, ser capaz de redactar un ensayo coherente. También se evaluará la capacidad de analizar la estructura de un texto y, finalmente, de crear narrativas propias.")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [planningResults, setPlanningResults] = useState<PlanningResult[]>([])
  const [currentView, setCurrentView] = useState<'input' | 'results'>('input');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const [tools, setTools] = useState({
    research: false,
    leveling: true,
    difficulty: 'estándar',
    indicatorSize: 'estándar',
  });

  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [tempPromptText, setTempPromptText] = useState("");
  const [isDefiningIndicators, setIsDefiningIndicators] = useState(false);
  const [currentConversationIndex, setCurrentConversationIndex] = useState(0);
  const [highlightedCard, setHighlightedCard] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setPrompt("")
    }
  }

  const mapApiResponseToIndicatorGroups = (apiResponse: any): IndicatorGroup[] => {
    if (!apiResponse || !Array.isArray(apiResponse.silabo_curso_agrupado_por_oa)) {
      console.error("API response is not in the expected format for indicators.");
      return [];
    }

    return apiResponse.silabo_curso_agrupado_por_oa.map((grupo: any) => {
      const mappedIndicators = grupo.indicadores.map((indicador: any) => ({
        id: indicador.id_indicador,
        title: indicador.texto_indicador,
        description: indicador.descripcion,
        texto_indicador: indicador.texto_indicador,
        nombre_modulo: indicador.nombre_modulo,
        texto_contenido: indicador.texto_contenido,
        justificacion_pedagogica: indicador.justificacion_pedagogica,
        indicador_desglosado: indicador.indicador_desglosado,
        status: 'original',
        isManual: false,
      }));

      return {
        groupTitle: grupo.oa,
        indicators: mappedIndicators,
      };
    });
  };

  const generatePlanningData = async (text: string, isUpdate: boolean) => {
    const n8nWebhookUrl = "https://pixarron.app.n8n.cloud/webhook/231fad25-365f-4c57-b2b9-91777892977a";

    try {
      const requestBody = [{
        textoBusqueda: text,
        tipoDeBusqueda: "section",
        tools: tools,
      }];

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Error en la petición a n8n: ${response.statusText}`);
      }

      const responseData = await response.json();
      
      const newReviewData = mapApiResponseToIndicatorGroups(responseData);
      const newIntroduction = Array.isArray(responseData.introduccion_curso) ? responseData.introduccion_curso : [];

      setConversations(prev => {
          const newConversations = [...prev];
          const indexToUpdate = isUpdate ? newConversations.length - 1 : currentConversationIndex;
          if (newConversations[indexToUpdate]) {
            newConversations[indexToUpdate] = { 
                ...newConversations[indexToUpdate], 
                introduction: newIntroduction,
                reviewData: newReviewData 
            };
          }
          return newConversations;
      });

    } catch (error) {
      console.error("Error al generar el análisis inicial:", error);
      alert("Hubo un error al generar el análisis. Por favor, revisa la consola para más detalles.");
      setConversations(prev => prev.filter((_, index) => index !== (isUpdate ? prev.length - 1 : currentConversationIndex)));
    } finally {
      setIsDefiningIndicators(false);
      setIsGenerating(false);
    }
  };

  const handleGenerateReview = () => {
    if (!prompt.trim() && !uploadedFile) return;
    setIsGenerating(true);
    setIsDefiningIndicators(true);
    setConversations([{ prompt: prompt, introduction: [], reviewData: [] }]);
    setCurrentConversationIndex(0);
    generatePlanningData(prompt, false);
  };
  
  const handleUpdatePrompt = () => {
    if (!tempPromptText.trim()) return;

    setIsEditingPrompt(false);
    setConversations(prev => [...prev, { prompt: tempPromptText, introduction: [], reviewData: [] }]);
    setCurrentConversationIndex(prev => prev + 1);

    setIsGenerating(true);
    setIsDefiningIndicators(true);
    
    generatePlanningData(tempPromptText, true);
  }

  const handleStartEdit = () => {
    if (conversations.length > 0) {
      setTempPromptText(conversations[currentConversationIndex].prompt);
      setIsEditingPrompt(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPrompt(false);
    setTempPromptText("");
  };

  const handleCopy = () => {
    if (conversations.length > 0) {
      navigator.clipboard.writeText(conversations[currentConversationIndex].prompt);
    }
  };

  const mapConversationToApiPayload = (conversation: Conversation) => {
    const silabo_curso_agrupado_por_oa = conversation.reviewData.map(group => {
      const indicadores = group.indicators
        .filter(indicator => indicator.status !== 'deleted')
        .map(indicator => ({
          id_indicador: indicator.id,
          nombre_modulo: indicator.nombre_modulo,
          descripcion: indicator.description,
          texto_indicador: indicator.title,
          texto_contenido: indicator.texto_contenido,
          justificacion_pedagogica: indicator.justificacion_pedagogica,
          indicador_desglosado: indicator.indicador_desglosado,
        }));
      
      return {
        oa: group.groupTitle,
        indicadores: indicadores,
      };
    });

    return {
      introduccion_curso: conversation.introduction,
      silabo_curso_agrupado_por_oa: silabo_curso_agrupado_por_oa,
    };
  };

  const handleConfirmAndGenerate = async () => {
    if (conversations.length === 0) return;
    setIsGenerating(true);
    
    const n8nWebhookUrl = "https://pixarron.app.n8n.cloud/webhook/b07ea639-aa4d-42e8-9cf2-b2b4da0fb5a4";

    try {
      const currentConversation = conversations[currentConversationIndex];
      const payload = mapConversationToApiPayload(currentConversation);

      const requestBody = [{
          textoBusqueda: JSON.stringify(payload),
          tipoDeBusqueda: "planning"
      }];

      const response = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error(`Error en la petición a n8n: ${response.statusText}`);

      const responseData = await response.json();
      
      setCurrentView('results');
      const results: PlanningResult[] = responseData.planningdata || [];
      
      const processedResults: PlanningResult[] = results.map((result) => {
        const suggestionsWithCoverage = result.suggestedsections.map(suggestion => {
            const decomposition = suggestion.sectiondescomposition || [];
            const totalDecomp = decomposition.length;
            const coveredDecomp = decomposition.filter(d => d.is_covered).length;
            const coverage_rate = totalDecomp > 0 ? Math.round((coveredDecomp / totalDecomp) * 100) : 0;
            let coverage_label: string;
            if (coverage_rate === 0) {
                coverage_label = 'No cubierto';
            } else if (coverage_rate === 100) {
                coverage_label = 'Cubierto';
            } else {
                coverage_label = 'Parcialmente cubierto';
            }
            const uncovered_reasons = decomposition.filter(d => !d.is_covered).map(d => d.reason).join(' ');
            return { ...suggestion, coverage_rate, coverage_label, uncovered_reasons };
        });

        // --- LÓGICA DE ASIGNACIÓN ACTUALIZADA ---
        const fullyCoveredSuggestions = suggestionsWithCoverage.filter(
            s => s.coverage_label === 'Cubierto'
        );

        let assignedSection: SuggestedSection | null = null;

        if (fullyCoveredSuggestions.length > 0) {
            assignedSection = fullyCoveredSuggestions.reduce((best, current) => 
                current.score > best.score ? current : best
            );
        }
        
        return { 
            ...result, 
            suggestedsections: suggestionsWithCoverage.sort((a, b) => b.score - a.score), 
            assignedSection 
        };
      });
      
      setPlanningResults(processedResults);
    } catch (error) {
      console.error("No se pudo conectar con el servicio de planificación:", error);
      alert("Hubo un error al generar la planificación. Revisa la consola para más detalles.");
    } finally {
      setIsGenerating(false);
    }
  }

  const handleScrollToCard = (cardId: string) => {
    const element = document.getElementById(cardId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedCard(cardId);
        setTimeout(() => setHighlightedCard(null), 2000);
    }
  };

  const canCreatePlanning = (prompt.trim().length > 0 || uploadedFile) && !isGenerating;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <style>{`
            html {
                overflow-y: scroll;
            }
            .annotation-wrapper { position: relative; background-color: #3b82f6; color: #eff6ff; padding: 0.1rem 0.2rem; border-radius: 0.25rem; }
            .annotation-marker { cursor: pointer; font-weight: bold; position: relative; display: inline-block; }
            .annotation-marker sup { color: #93c5fd; }
            .annotation-marker .annotation-tooltip { visibility: hidden; width: 200px; background-color: #1f2937; color: #fff; text-align: center; border-radius: 6px; padding: 5px 10px; position: absolute; z-index: 1; bottom: 125%; left: 50%; margin-left: -100px; opacity: 0; transition: opacity 0.3s; font-size: 0.75rem; font-weight: normal; }
            .annotation-marker:hover .annotation-tooltip { visibility: visible; opacity: 1; }
        `}</style>
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-100 mb-2">Planificador Académico</h1>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto">
            {currentView === 'input' && conversations.length === 0 && "Genera una planificación educativa de forma interactiva."}
            {currentView === 'input' && conversations.length > 0 && "Revisa y ajusta la planificación propuesta antes de confirmar."}
            {currentView === 'results' && "Explora y ajusta las sugerencias para tu planificación."}
          </p>
        </div>

        {currentView === 'input' && (
          <div className="space-y-8">
            <PromptInputCard
              prompt={prompt}
              setPrompt={setPrompt}
              uploadedFile={uploadedFile}
              handleFileUpload={handleFileUpload}
              isGenerating={isGenerating}
              canCreatePlanning={canCreatePlanning}
              handleGenerateReview={handleGenerateReview}
              conversations={conversations}
              isEditingPrompt={isEditingPrompt}
              tempPromptText={tempPromptText}
              setTempPromptText={setTempPromptText}
              handleCancelEdit={handleCancelEdit}
              handleUpdatePrompt={handleUpdatePrompt}
              currentConversationIndex={currentConversationIndex}
              setCurrentConversationIndex={setCurrentConversationIndex}
              handleStartEdit={handleStartEdit}
              handleCopy={handleCopy}
              tools={tools}
              setTools={setTools}
            />

            {conversations.length > 0 && (
              <div className="mt-16">
                <ProposedPlanReview
                  conversation={conversations[currentConversationIndex]}
                  highlightedCard={highlightedCard}
                  onAnnotationClick={handleScrollToCard}
                  onConversationUpdate={(updatedConversation) => {
                    const newConversations = [...conversations];
                    newConversations[currentConversationIndex] = updatedConversation;
                    setConversations(newConversations);
                  }}
                  isGeneratingData={isDefiningIndicators}
                />
                <div className="flex justify-end mt-4">
                  <Button onClick={handleConfirmAndGenerate} size="lg" disabled={isGenerating || isDefiningIndicators}>
                    {isGenerating && !isDefiningIndicators ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>Procesando...</>) : (<><Send className="h-4 w-4 mr-2" />Confirmar y Crear Planificación</>)}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {currentView === 'results' && <PlanningResultsView initialPlanningResults={planningResults} isGeneratingData={isGenerating} />}
      </div>
    </div>
  )
}
