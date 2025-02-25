'use client';

// Core React imports and component dependencies
import { useState } from 'react';
import ParameterSliders, { GeometryParams } from './ParameterSliders';
import type { RhinoComputeResponse } from '@/types/rhino';
import type { ViewerGeometryData } from '@/components/viewer';

console.log('🚀 [ModelGenerator] Component module initialized');

/**
 * Interface for ModelGenerator props
 */
interface ModelGeneratorProps {
  onGeometryGenerated?: (data: ViewerGeometryData) => void;
  onError?: (error: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * ModelGenerator Component
 * 
 * Main component responsible for:
 * 1. Managing geometry generation parameters
 * 2. Making API calls to compute geometry
 * 3. Displaying parameter controls
 * 4. Handling loading states and errors
 */
export default function ModelGenerator({ 
  onGeometryGenerated, 
  onError, 
  onLoadingChange 
}: ModelGeneratorProps) {
  console.log('📦 [ModelGenerator] Initializing component state and hooks');
  
  // Error handling state
  const [error, setError] = useState('');
  
  // Default parameters for geometry generation
  const [params, setParams] = useState<GeometryParams>({ radius: 5, count: 10, length: 5 });

  /**
   * Handles parameter changes and triggers geometry computation
   * Makes API call to /api/compute with updated parameters
   * Updates geometry data state on success
   * 
   * @param newParams - Updated geometry parameters
   */
  const handleParamsChange = async (newParams: GeometryParams) => {
    console.log('🔄 [handleParamsChange] Processing parameter update:', newParams);
    
    // Update local state and reset error/loading states
    setParams(newParams);
    setError('');
    
    // Notify parent about loading state
    if (onLoadingChange) {
      onLoadingChange(true);
    }

    try {
      console.log('📤 [handleParamsChange] Initiating API call with parameters:', newParams);
      
      // Make compute API request
      const response = await fetch('/api/compute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newParams),
      });

      console.log('📥 [handleParamsChange] API response received - Status:', response.status);
      const responseText = await response.text();
      console.log('📄 [handleParamsChange] Raw response data:', responseText);

      // Parse JSON response with error handling
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ [handleParamsChange] Response successfully parsed');
      } catch (parseError) {
        console.error('❌ [handleParamsChange] Failed to parse JSON response:', parseError);
        const errorMsg = `Failed to parse response: ${responseText}`;
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }

      // Comprehensive error checking
      if (!response.ok) {
        console.error('❌ [handleParamsChange] HTTP error encountered:', response.status);
        const errorMsg = data.error || `HTTP error! status: ${response.status}`;
        setError(errorMsg);
        if (onError) onError(errorMsg);
        return;
      }

      if (data.error) {
        console.error('❌ [handleParamsChange] API returned error:', data.error);
        setError(data.error);
        if (onError) onError(data.error);
        return;
      }

      if (data.Errors && data.Errors.length > 0) {
        console.error('❌ [handleParamsChange] Computation errors found:', data.Errors[0]);
        setError(data.Errors[0]);
        if (onError) onError(data.Errors[0]);
        return;
      }

      console.log('✅ [handleParamsChange] Geometry computation successful');
      
      // Send data to parent component
      if (onGeometryGenerated) {
        onGeometryGenerated(data);
      }
      
    } catch (err) {
      console.error('❌ [handleParamsChange] Error during parameter processing:', err);
      const errorMsg = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      console.log('🏁 [handleParamsChange] Parameter update process completed');
      if (onLoadingChange) {
        onLoadingChange(false);
      }
    }
  };

  console.log('🎨 [ModelGenerator] Rendering component structure');
  return (
    <div className="space-y-4">
      {/* Parameter controls section */}
      <div className="p-4 bg-gray-900 rounded-lg border border-gray-800">
        <h3 className="text-sm font-medium text-gray-300 mb-4">Parameters</h3>
        <ParameterSliders
          onParamsChange={handleParamsChange}
        />
      </div>

      {/* Error message display */}
      {error && (
        <div className="p-4 bg-red-900 bg-opacity-30 text-red-400 rounded-lg border border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}