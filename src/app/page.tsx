'use client';

import { useState } from 'react';
import ModelGenerator from '@/components/ModelGenerator';
import ComponentGenerator from '@/components/ComponentGenerator';
import TextTo3DGenerator from '@/components/TextTo3DGenerator';
import Viewer3D from '@/components/viewer';
import type { ViewerGeometryData } from '@/components/viewer';

type GeneratorMode = 'select' | 'basic' | 'advanced' | 'text';

export default function Home() {
  console.log('🏠 [Home] Initializing page');
  
  // State for the selected mode and geometry
  const [mode, setMode] = useState<GeneratorMode>('select');
  const [geometryData, setGeometryData] = useState<ViewerGeometryData>();
  const [viewerError, setViewerError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  // Handler for geometry generation
  const handleGeometryGenerated = (data: ViewerGeometryData) => {
    setViewerError(undefined);
    setGeometryData(data);
  };

  // Handler for geometry errors
  const handleGeometryError = (error: string) => {
    setViewerError(error);
    setGeometryData(undefined);
  };

  // Render mode selector
  if (mode === 'select') {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <main className="max-w-4xl mx-auto">
          <header className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Beta3D</h1>
            <p className="text-gray-600">Choose your generation mode</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Basic Generator Card */}
            <button
              onClick={() => setMode('basic')}
              className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-bold mb-4">Basic Generator</h2>
              <p className="text-gray-600 mb-4">
                Create simple parametric 3D models using sliders and basic parameters.
              </p>
              <div className="text-blue-600">Get Started →</div>
            </button>

            {/* Advanced Generator Card */}
            <button
              onClick={() => setMode('advanced')}
              className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-bold mb-4">Advanced Component Generator</h2>
              <p className="text-gray-600 mb-4">
                Generate complex bicycle components using natural language descriptions.
              </p>
              <div className="text-blue-600">Get Started →</div>
            </button>

            {/* Text to 3D Generator Card */}
            <button
              onClick={() => setMode('text')}
              className="p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow"
            >
              <h2 className="text-2xl font-bold mb-4">Text to 3D Generator</h2>
              <p className="text-gray-600 mb-4">
                Generate 3D models from text descriptions using natural language processing.
              </p>
              <div className="text-blue-600">Get Started →</div>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Beta3D</h1>
          <button
            onClick={() => setMode('select')}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            ← Change Mode
          </button>
        </div>
      </div>

      <main className="p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr,2fr] gap-8">
          {/* Left column: Generator controls */}
          <div className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-6">
              {mode === 'basic' ? 'Basic Generator' : mode === 'advanced' ? 'Advanced Component Generator' : 'Text to 3D Generator'}
            </h2>
            
            {mode === 'basic' ? (
              <ModelGenerator />
            ) : mode === 'advanced' ? (
              <ComponentGenerator 
                onGeometryGenerated={handleGeometryGenerated}
                onError={handleGeometryError}
                onLoadingChange={setIsLoading}
              />
            ) : (
              <TextTo3DGenerator />
            )}
          </div>

          {/* Right column: 3D Viewer */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">3D Preview</h3>
            <div className="relative h-[calc(100vh-12rem)] bg-gray-100 rounded-lg overflow-hidden">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
                  <div className="space-y-4 text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-600">Generating geometry...</p>
                  </div>
                </div>
              )}
              {viewerError ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="max-w-md p-4 text-center text-red-600">
                    <p className="font-medium">Error generating geometry</p>
                    <p className="text-sm mt-2">{viewerError}</p>
                  </div>
                </div>
              ) : (
                <Viewer3D geometryData={geometryData} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
