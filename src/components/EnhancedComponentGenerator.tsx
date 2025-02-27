// src/components/EnhancedComponentGenerator.tsx
import { useState } from 'react';
import { getComponentTemplate } from '@/utils/ghx/componentTemplates';
import ParameterEntryForm from './ParameterEntryForm';
import { createGHXFromTemplate } from '@/utils/ghxGeneratorFromTemplate';
import Viewer3D from '@/components/viewerUpload';

const COMPONENT_TYPES = [
  { id: 'fork', label: 'Bicycle Fork' },
  { id: 'handlebar', label: 'Handlebar' },
  // Add more component types as they become available
];

export default function EnhancedComponentGenerator() {
  const [selectedType, setSelectedType] = useState('fork');
  const [parameters, setParameters] = useState<Record<string, number>>({});
  const [geometryData, setGeometryData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  // Get the template for the selected component type
  const template = getComponentTemplate(selectedType);
  
  const handleGenerate = async () => {
    if (!template) return;
    
    setIsGenerating(true);
    setError('');
    
    try {
      // Create GHX from template and parameters
      const ghxDefinition = createGHXFromTemplate(template, parameters);
      
      // Send to Rhino Compute
      const computeResponse = await fetch('/api/computeGHX', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghx: ghxDefinition,
          parameters: parameters
        })
      });
      
      if (!computeResponse.ok) {
        const errorData = await computeResponse.json();
        throw new Error(errorData.error || 'Failed to compute geometry');
      }
      
      const data = await computeResponse.json();
      setGeometryData(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Generate Bike Component</h2>
        <p className="text-gray-600">
          Select a component type and adjust parameters to generate a 3D model
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Component Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-2 border rounded"
              disabled={isGenerating}
            >
              {COMPONENT_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {template && (
            <ParameterEntryForm
              template={template}
              onParametersChanged={setParameters}
            />
          )}
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !template}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isGenerating ? 'Generating...' : 'Generate Component'}
          </button>
          
          {error && (
            <div className="p-3 text-red-700 bg-red-100 rounded">
              {error}
            </div>
          )}
        </div>
        
        <div className="h-[500px] border rounded relative">
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto"></div>
                <p className="mt-2">Generating component...</p>
              </div>
            </div>
          )}
          
          {geometryData && (
            <Viewer3D modelData={geometryData} />
          )}
          
          {!geometryData && !isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
              Generate a component to view it here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}