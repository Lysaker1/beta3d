'use client';

// Core React imports and component dependencies
import { useState } from 'react';
import dynamic from 'next/dynamic';
import ParameterSliders, { GeometryParams } from './ParameterSliders';
import type { RhinoComputeResponse } from '@/types/rhino';

console.log('🚀 [ModelGenerator] Component module initialized');

// Dynamically import Viewer3D to avoid SSR issues with Three.js
// This ensures the component only loads on the client side
const Viewer3D = dynamic(() => import('./viewer'), {
  ssr: false,
  loading: () => {
    console.log('⌛ [ModelGenerator] Loading Viewer3D component dynamically...');
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading 3D Viewer...</div>
      </div>
    );
  },
});

/**
 * ModelGenerator Component
 * 
 * Main component responsible for:
 * 1. Managing geometry generation parameters
 * 2. Making API calls to compute geometry
 * 3. Displaying parameter controls and 3D preview
 * 4. Handling loading states and errors
 */
export default function ModelGenerator() {
  console.log('📦 [ModelGenerator] Initializing component state and hooks');
  
  // State management for geometry data returned from compute API
  const [geometryData, setGeometryData] = useState<RhinoComputeResponse | undefined>(undefined);
  
  // Loading indicator for async operations
  const [isLoading, setIsLoading] = useState(false);
  
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
    setIsLoading(true);
    setError('');

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
        throw new Error(`Failed to parse response: ${responseText}`);
      }

      // Comprehensive error checking
      if (!response.ok) {
        console.error('❌ [handleParamsChange] HTTP error encountered:', response.status);
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.error) {
        console.error('❌ [handleParamsChange] API returned error:', data.error);
        throw new Error(data.error);
      }

      if (data.Errors && data.Errors.length > 0) {
        console.error('❌ [handleParamsChange] Computation errors found:', data.Errors[0]);
        throw new Error(data.Errors[0]);
      }

      console.log('✅ [handleParamsChange] Geometry computation successful');
      setGeometryData(data);
      
    } catch (err) {
      console.error('❌ [handleParamsChange] Error during parameter processing:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      console.log('🏁 [handleParamsChange] Parameter update process completed');
      setIsLoading(false);
    }
  };

  console.log('🎨 [ModelGenerator] Rendering component structure');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left column: Parameters and Error display */}
      <div className="space-y-4">
        {/* Parameter controls section */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium mb-4">Parameters</h3>
          <ParameterSliders
            onParamsChange={handleParamsChange}
          />
        </div>

        {/* Error message display */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Right column: 3D visualization */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">3D Preview</h3>
        <Viewer3D geometryData={geometryData} />
      </div>
    </div>
  );
}