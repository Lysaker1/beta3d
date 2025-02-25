'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './Scene';

// Define a more flexible type that accepts both string and number data
export interface ViewerGeometryData {
  modelunits: string;
  dataversion: number;
  algo: string;
  filename: string | null;
  pointer: string;
  cachesolve: boolean;
  values: Array<{
    ParamName: string;
    InnerTree: {
      [key: string]: Array<{
        type: string;
        data: string | number;
      }>;
    };
  }>;
}

/**
 * Props interface for the Viewer3D component
 * @property {ViewerGeometryData} geometryData - Optional geometry data from Rhino Compute
 */
export interface Viewer3DProps {
  geometryData?: ViewerGeometryData;
}

/**
 * Viewer3D Component
 * Main 3D viewer component that sets up the Three.js canvas and scene
 * Handles:
 * - Canvas setup with proper camera positioning and rendering settings
 * - Scene component integration with geometry data
 * - Suspense boundary for async loading
 */
export default function Viewer3D({ geometryData }: Viewer3DProps) {
  console.log('🎥 [Viewer3D] Component initialization');
  console.log('📦 [Viewer3D] Received geometry data:', 
    geometryData ? 'Present' : 'Not provided');
  
  if (geometryData) {
    console.log('🔍 [Viewer3D] Geometry data details:', 
      JSON.stringify(geometryData, null, 2));
  }

  console.log('🎨 [Viewer3D] Setting up Canvas with rendering configuration');
  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg">
      <Canvas
        // Position camera at isometric view angle with 75° field of view
        camera={{ position: [5, 5, 5], fov: 75 }}
        // Enable antialiasing for smoother edges
        gl={{ antialias: true }}
        // Set device pixel ratio for retina displays
        dpr={[1, 2]}
        // Enable shadow mapping
        shadows
        style={{ width: '100%', height: '100%', backgroundColor: 'grey' }}
      >
        <Suspense fallback={null}>
          {/* Scene component handles the actual 3D geometry rendering */}
          <Scene geometryData={geometryData} />
        </Suspense>
      </Canvas>
    </div>
  );
}