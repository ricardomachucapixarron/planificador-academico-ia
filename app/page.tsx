"use client"

import React, { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, BookOpen, Target, BrainCircuit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"

// --- INTERFACES ADAPTADAS AL RESULTADO DE N8N ---

// Representa un tema individual encontrado por la búsqueda vectorial
interface Tema {
  sectionname: string
  sectionprofile: string
  score: number
}

// Representa el resultado completo para una búsqueda
interface Plan {
  chatInput_clean: string
  temas: Tema[]
}

// --- COMPONENTE PRINCIPAL ---

export default function AcademicPlanner() {
  const [prompt, setPrompt] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  // El estado ahora almacenará una lista de planes, uno por cada resultado de n8n
  const [plans, setPlans] = useState<Plan[]>([])
  const [hasGenerated, setHasGenerated] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      setPrompt("") // Limpiar el prompt si se sube un archivo
    }
  }

  // --- FUNCIÓN CLAVE PARA CONECTAR CON N8N ---
  const handleCreatePlanning = async () => {
    setIsGenerating(true)
    setHasGenerated(false)
    setPlans([])

    // ¡IMPORTANTE! Reemplaza esto con tu URL de producción real.
    const n8nWebhookUrl = "https://pixarron.app.n8n.cloud/webhook/4d5d060a-50ce-4d82-9208-1f7baae747cc";

    try {
      let response;

      // Lógica para enviar el archivo si existe
      if (uploadedFile) {
        const formData = new FormData();
        // El nombre 'data' debe coincidir con la Binary Property en n8n
        formData.append('data', uploadedFile);

        response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          body: formData, // El navegador establece el Content-Type automáticamente
        });

      // Lógica para enviar el texto si no hay archivo
      } else if (prompt.trim()) {
        const requestBody = [{
          textoBusqueda: prompt,
          tipoDeBusqueda: "section" // o 'topic', según tu lógica
        }];

        response = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        alert("Por favor, describe tu planificación o sube un archivo.");
        setIsGenerating(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Error en la petición a n8n: ${response.statusText}`);
      }

      // n8n debe estar configurado para responder con el resultado final.
      const resultData: Plan[] = await response.json();
      
      // Actualizamos el estado con los planes recibidos de n8n
      setPlans(resultData);
      setHasGenerated(true);

    } catch (error) {
      console.error("No se pudo conectar con el servicio de planificación:", error);
      alert("Hubo un error al generar la planificación. Revisa la consola para más detalles.");
    } finally {
      setIsGenerating(false);
    }
  }

  const toggleCardExpansion = (cardId: string) => {
    const newExpanded = new Set(expandedCards)
    if (newExpanded.has(cardId)) {
      newExpanded.delete(cardId)
    } else {
      newExpanded.add(cardId)
    }
    setExpandedCards(newExpanded)
  }

  const getSimilarityBadgeColor = (similarity: number) => {
    const score = Math.round(similarity * 100);
    if (score > 60) {
      return "bg-green-100 text-green-800 border-green-300"
    } else if (score >= 40) {
      return "bg-yellow-100 text-yellow-800 border-yellow-300"
    } else {
      return "bg-red-100 text-red-800 border-red-300"
    }
  }

  const canCreatePlanning = (prompt.trim().length > 0 || uploadedFile) && !isGenerating

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Planificador Académico IA</h1>
          <p className="text-lg text-gray-600">
            Conecta tu contenido con prototipos de proyectos y recursos educativos.
          </p>
        </div>

        {/* --- VISTA INICIAL PARA CREAR PLANIFICACIÓN --- */}
        {!hasGenerated ? (
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Crear Nueva Planificación
              </CardTitle>
              <CardDescription>
                Describe tu curso o sube un archivo con el contenido para generar una planificación personalizada.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="prompt" className="text-sm font-medium text-gray-700">
                  Describe tu planificación académica
                </label>
                <Textarea
                  id="prompt"
                  placeholder="Ejemplo: UNIDAD I. Sistemas de Referencia y Vectores. Sistemas de coordenadas cartesianas y polares..."
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value)
                    if (e.target.value) setUploadedFile(null);
                  }}
                  className="min-h-[120px] resize-none"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex items-center justify-center">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="h-px bg-gray-300 flex-1"></div>
                  <span>o</span>
                  <div className="h-px bg-gray-300 flex-1"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isGenerating}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Subir archivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {uploadedFile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      {uploadedFile.name}
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleCreatePlanning}
                  disabled={!canCreatePlanning}
                  className="flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4" />
                      Crear planificación
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          // --- VISTA DE RESULTADOS ---
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Resultados de la Búsqueda</h2>
                <p className="text-gray-600">{plans.length} resultados encontrados.</p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setHasGenerated(false)
                  setPlans([])
                  setPrompt("")
                  setUploadedFile(null)
                }}
              >
                Nueva planificación
              </Button>
            </div>

            {/* Iteramos sobre cada Plan devuelto por n8n */}
            <div className="space-y-8">
              {plans.map((plan, planIndex) => (
                <Card key={planIndex} className="bg-white shadow-md rounded-lg">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      Búsqueda Original:
                    </CardTitle>
                    <CardDescription className="italic">
                      {/* --- ESTA ES LA LÍNEA CORREGIDA --- */}
                      {`"${plan.chatInput_clean}"`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <h3 className="text-md font-semibold mb-4 text-gray-700 border-t pt-4">Temas Sugeridos:</h3>
                    <div className="space-y-4">
                      {/* Iteramos sobre los temas de cada plan */}
                      {plan.temas.map((tema, temaIndex) => {
                        const cardId = `${planIndex}-${temaIndex}`;
                        const isExpanded = expandedCards.has(cardId);
                        return (
                          <div key={cardId} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <BrainCircuit className="h-5 w-5 text-indigo-500" />
                                  <h4 className="font-semibold text-md">{tema.sectionname}</h4>
                                  <Badge
                                    className={`text-xs font-medium px-2 py-0.5 ${getSimilarityBadgeColor(tema.score)}`}
                                  >
                                    {Math.round(tema.score * 100)}% Similitud
                                  </Badge>
                                </div>
                                {isExpanded && (
                                  <p className="text-sm text-gray-600 mt-2">
                                    {tema.sectionprofile}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleCardExpansion(cardId)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
