"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, BookOpen, Target, BrainCircuit, Star, ExternalLink, Folder, FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"

// --- INTERFACES ADAPTADAS A LA NUEVA ESTRUCTURA DE N8N ---

interface ModuleData {
  type: string
  moduleUrl: string
  moduleName: string
}

interface SuggestedSection {
  sectionname: string
  sectionprofile: string
  modulesdata: ModuleData[]
  score: number
}

interface PlanningResult {
  requiredsection: string
  suggestedsections: SuggestedSection[]
}

// --- COMPONENTE PRINCIPAL ---

export default function AcademicPlanner() {
  const [prompt, setPrompt] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [planningResults, setPlanningResults] = useState<PlanningResult[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setPrompt("") // Limpiar el prompt si se sube un archivo
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
      const results: PlanningResult[] = responseData.planningdata || [];
      setPlanningResults(results);
      setHasGenerated(true);

    } catch (error) {
      console.error("No se pudo conectar con el servicio de planificación:", error);
      alert("Hubo un error al generar la planificación. Revisa la consola para más detalles.");
    } finally {
      setIsGenerating(false);
    }
  }

  const getSimilarityBadgeColor = (similarity: number) => {
    const score = Math.round(similarity * 100);
    if (score > 60) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "quiz": return "❓";
      case "url": return "📄";
      default: return "🔗";
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Planificador Académico IA</h1>
          <p className="text-lg text-gray-600">
            Conecta tu contenido con prototipos de proyectos y recursos educativos.
          </p>
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

            <div className="space-y-8">
              {planningResults.map((result, planIndex) => {
                const sortedSuggestions = [...result.suggestedsections].sort((a, b) => b.score - a.score);
                const bestMatch = sortedSuggestions[0];
                const otherSuggestions = sortedSuggestions.slice(1);

                return (
                  <Card key={planIndex} className="bg-white shadow-md rounded-lg overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b">
                      <CardTitle className="text-md font-semibold text-gray-500 uppercase tracking-wide">Tema Requerido</CardTitle>
                      <CardDescription className="text-base text-gray-800 pt-1">
                        {result.requiredsection}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      {bestMatch && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3"><Star className="h-5 w-5 text-yellow-500" />Asignación Principal</h3>
                          <div className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-md text-indigo-600">{bestMatch.sectionname}</h4>
                              <Badge className={`text-xs font-medium px-2 py-0.5 ${getSimilarityBadgeColor(bestMatch.score)}`}>{Math.round(bestMatch.score * 100)}% Similitud</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2 mb-4">{bestMatch.sectionprofile}</p>
                             <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={() => toggleResourceExpansion(`best-${planIndex}`)} className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800">
                                    {expandedResources.has(`best-${planIndex}`) ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                                </Button>
                               <span className="text-sm font-medium text-indigo-600">{bestMatch.modulesdata.length} recursos disponibles</span>
                            </div>
                            {expandedResources.has(`best-${planIndex}`) && (
                                <div className="mt-3 border-t pt-3 space-y-1">
                                {bestMatch.modulesdata.map((resource, resIndex) => (
                                    <button key={resIndex} onClick={() => handleResourceClick(resource.moduleUrl)} className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded flex items-center gap-3 transition-colors">
                                    <span className="text-lg">{getResourceIcon(resource.type)}</span>
                                    <span className="flex-1 text-gray-700">{resource.moduleName}</span>
                                    <ExternalLink className="h-4 w-4 text-gray-400" />
                                    </button>
                                ))}
                                </div>
                            )}
                          </div>
                        </div>
                      )}

                      {otherSuggestions.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-3"><BrainCircuit className="h-5 w-5 text-gray-500" />Opciones Adicionales</h3>
                           <div className="space-y-2">
                            {otherSuggestions.map((tema, temaIndex) => {
                                const cardId = `other-${planIndex}-${temaIndex}`;
                                const isExpanded = expandedResources.has(cardId);
                                return (
                                <div key={cardId} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-semibold text-md">{tema.sectionname}</h4>
                                            <Badge className={`text-xs font-medium px-2 py-0.5 ${getSimilarityBadgeColor(tema.score)}`}>{Math.round(tema.score * 100)}% Similitud</Badge>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => toggleResourceExpansion(cardId)} className="h-6 w-6 p-0 text-indigo-600 hover:text-indigo-800">
                                                    {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
                                                </Button>
                                                <span className="text-xs text-gray-500">{tema.modulesdata.length} recursos</span>
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="mt-3 border-t pt-3 space-y-1">
                                        {tema.modulesdata.map((resource, resIndex) => (
                                            <button key={resIndex} onClick={() => handleResourceClick(resource.moduleUrl)} className="w-full text-left p-2 text-sm hover:bg-gray-50 rounded flex items-center gap-3 transition-colors">
                                            <span className="text-lg">{getResourceIcon(resource.type)}</span>
                                            <span className="flex-1 text-gray-700">{resource.moduleName}</span>
                                            <ExternalLink className="h-4 w-4 text-gray-400" />
                                            </button>
                                        ))}
                                        </div>
                                    )}
                                </div>
                                );
                            })}
                           </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
