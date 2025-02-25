'use client';

import React, { useState, useEffect } from 'react';
import { createGHXDefinition } from '@/utils/ghx';
import type { ViewerGeometryData } from '@/components/viewer';

// Valid component types
const COMPONENT_TYPES = ['wheel', 'pedal', 'handlebar', 'saddle'] as const;
type ComponentType = typeof COMPONENT_TYPES[number];

// Parameter constraints for each component type
const PARAMETER_CONSTRAINTS: Record<ComponentType, Record<string, { min: number; max: number; default: number }>> = {
  wheel: {
    radius: { min: 200, max: 500, default: 350 },
    spokeCount: { min: 16, max: 48, default: 32 },
    rimWidth: { min: 15, max: 40, default: 25 },
    hubRadius: { min: 20, max: 50, default: 30 }
  },
  pedal: {
    length: { min: 80, max: 120, default: 100 },
    width: { min: 60, max: 100, default: 80 },
    height: { min: 15, max: 30, default: 20 },
    threadLength: { min: 30, max: 50, default: 40 }
  },
  handlebar: {
    width: { min: 380, max: 500, default: 440 },
    reach: { min: 50, max: 100, default: 70 },
    drop: { min: 100, max: 160, default: 130 },
    stemLength: { min: 70, max: 130, default: 100 }
  },
  saddle: {
    length: { min: 240, max: 300, default: 270 },
    width: { min: 120, max: 160, default: 140 },
    height: { min: 30, max: 50, default: 40 },
    railLength: { min: 170, max: 230, default: 200 }
  }
};

// Default parameters derived from constraints
const DEFAULT_PARAMETERS: Record<ComponentType, Record<string, number>> = Object.fromEntries(
  Object.entries(PARAMETER_CONSTRAINTS).map(([type, params]) => [
    type,
    Object.fromEntries(Object.entries(params).map(([name, { default: value }]) => [name, value]))
  ])
) as Record<ComponentType, Record<string, number>>;

interface ComponentGeneratorProps {
  onGeometryGenerated: (data: ViewerGeometryData) => void;
  onError: (error: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

export default function ComponentGenerator({ 
  onGeometryGenerated, 
  onError, 
  onLoadingChange 
}: ComponentGeneratorProps) {
  console.log('🚀 [ComponentGenerator] Initializing component');

  // State management
  const [selectedType, setSelectedType] = useState<ComponentType>('wheel');
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [parameters, setParameters] = useState(DEFAULT_PARAMETERS.wheel);
  const [showParameters, setShowParameters] = useState(false);
  const [generatedParameters, setGeneratedParameters] = useState<Record<string, number>>({});

  // Update loading state
  useEffect(() => {
    onLoadingChange(isGenerating);
  }, [isGenerating, onLoadingChange]);

  /**
   * Handles component type selection
   */
  const handleTypeChange = (type: ComponentType) => {
    console.log('🔄 [ComponentGenerator] Changing component type to:', type);
    setSelectedType(type);
    setParameters(DEFAULT_PARAMETERS[type]);
  };

  /**
   * Handles the generation of a new component based on natural language description
   */
  const handleGenerate = async () => {
    console.log('🎯 [ComponentGenerator] Starting component generation');
    setIsGenerating(true);
    setError('');
    onError(''); // Clear any previous errors

    try {
      // First, generate the RhinoPython code from the description
      console.log('📝 [ComponentGenerator] Generating RhinoPython code');
      const generateResponse = await fetch('/api/generateComponent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          componentType: selectedType,
          description,
          parameters
        })
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate component code');
      }

      const { code } = await generateResponse.json();
      console.log('✅ [ComponentGenerator] Successfully generated code');

      // Create a GHX definition from the generated code
      console.log('📦 [ComponentGenerator] Creating GHX definition');
      const ghxDefinition = createGHXDefinition(code, parameters);

      // Send the GHX definition to Rhino Compute
      console.log('🌐 [ComponentGenerator] Sending to Rhino Compute');
      const computeResponse = await fetch('/api/computeGHX', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghx: ghxDefinition,
          parameters
        })
      });

      if (!computeResponse.ok) {
        throw new Error('Failed to compute geometry');
      }

      const geometryData = await computeResponse.json();
      console.log('✨ [ComponentGenerator] Successfully generated geometry');
      
      // Pass the geometry data up to the parent component
      onGeometryGenerated(geometryData);

    } catch (err) {
      console.error('❌ [ComponentGenerator] Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Component type selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Component Type
        </label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {COMPONENT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                selectedType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
              }`}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Natural language input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={`Describe the ${selectedType} you want to create...`}
          className="w-full h-32 px-3 py-2 border rounded-md"
          disabled={isGenerating}
        />
      </div>

      {/* Parameter controls with validation */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Parameters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.entries(parameters).map(([name, value]) => {
            const constraints = PARAMETER_CONSTRAINTS[selectedType][name];
            return (
              <div key={name} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </label>
                <input
                  type="range"
                  min={constraints.min}
                  max={constraints.max}
                  value={value}
                  onChange={(e) => 
                    setParameters(prev => ({
                      ...prev,
                      [name]: Number(e.target.value)
                    }))
                  }
                  className="w-full"
                  disabled={isGenerating}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>{constraints.min}</span>
                  <span>{value}</span>
                  <span>{constraints.max}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !description.trim()}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isGenerating || !description.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isGenerating ? 'Generating...' : 'Generate Component'}
      </button>

      {/* Error display */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
    </div>
  );
} 