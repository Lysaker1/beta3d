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
  const [mode, setMode] = useState<GeneratorMode>('basic');
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
    <div style={{ 
      display: 'flex', 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      overflow: 'hidden',
      flexDirection: 'column',
      backgroundColor: '#000'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '24px', 
          fontWeight: 'bold',
          color: 'white' 
        }}>Beta3D</h1>
        
        <button
          onClick={() => setMode('select')}
          style={{ 
            padding: '6px 14px', 
            background: '#333',
            border: '1px solid #555',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ fontSize: '18px' }}>←</span> Change Mode
        </button>
      </div>
      
      {/* Main content */}
      <div style={{ 
        display: 'flex', 
        flex: 1, 
        height: 'calc(100vh - 43px)', /* Subtract header height */
        overflow: 'hidden'
      }}>
        {/* Left sidebar */}
        <div style={{ 
          width: '25%', 
          padding: '16px',
          borderRight: '1px solid #333',
          overflowY: 'auto',
          backgroundColor: '#000',
          color: 'white'
        }}>
          <h2 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold', 
            marginBottom: '16px' 
          }}>
            {mode === 'basic' ? 'Basic Generator' : 
             mode === 'advanced' ? 'Advanced Component Generator' : 
             'Text to 3D Generator'}
          </h2>
          
          {mode === 'basic' ? (
            <ModelGenerator 
              onGeometryGenerated={handleGeometryGenerated}
              onError={handleGeometryError}
              onLoadingChange={setIsLoading}
            />
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
        
        {/* Right area - 3D Viewer */}
        <div style={{ 
          width: '75%', 
          position: 'relative',
          height: '100%'
        }}>
          {isLoading && (
            <div style={{
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.7)',
              zIndex: 10
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  border: '4px solid #3b82f6',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }}></div>
                <p style={{ 
                  marginTop: '16px', 
                  color: '#60a5fa' 
                }}>Generating 3D model...</p>
              </div>
            </div>
          )}
          
          {viewerError ? (
            <div style={{
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0,0,0,0.8)',
              zIndex: 10
            }}>
              <div style={{
                maxWidth: '400px',
                padding: '24px',
                textAlign: 'center',
                color: '#f87171',
                border: '1px solid #991b1b',
                borderRadius: '8px',
                backgroundColor: '#000'
              }}>
                <p style={{ 
                  fontWeight: 'bold', 
                  fontSize: '18px' 
                }}>Error Generating Model</p>
                <p style={{ 
                  marginTop: '8px', 
                  fontSize: '14px' 
                }}>{viewerError}</p>
              </div>
            </div>
          ) : null}
          
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0
          }}>
            <Viewer3D geometryData={geometryData} />
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          height: 100%;
        }
      `}</style>
    </div>
  );
}
