import React, { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Box3, Vector3, PerspectiveCamera as ThreePerspectiveCamera } from 'three';
import { decodeRhinoMesh, type RhinoMesh } from './RhinoMeshLoader';
import { createThreeMesh } from './createThreeMesh';
import type { ViewerGeometryData } from './index';

/**
 * Props interface for Scene component
 * @property {ViewerGeometryData} geometryData - Optional geometry data from Rhino Compute
 */
interface SceneProps {
  geometryData?: ViewerGeometryData;
}

/**
 * Scene component that handles 3D visualization of Rhino geometry
 * Manages scene setup, mesh loading, camera positioning and lighting
 */
export function Scene({ geometryData }: SceneProps) {
  console.log('🎭 [Scene] Initializing with geometry data:', geometryData ? 'present' : 'absent');
  
  // Get access to Three.js scene and camera
  const { scene, camera } = useThree();

  useEffect(() => {
    console.log('🔄 [Scene] Effect triggered with new geometry data');
    
    // Clear any existing objects from scene
    console.log('🧹 [Scene] Clearing previous scene contents');
    scene.clear();

    // Early return if no geometry data provided
    if (!geometryData) {
      console.log('⚠️ [Scene] No geometry data provided, skipping mesh creation');
      return;
    }

    // Process the Rhino geometry data
    console.log('🔍 [Scene] Beginning geometry processing');
    decodeRhinoMesh(geometryData)
      .then((rhinoMesh: RhinoMesh | null) => {
        if (!rhinoMesh) {
          console.warn('⚠️ [Scene] Failed to decode Rhino mesh');
          return;
        }

        console.log('✅ [Scene] Successfully decoded Rhino mesh');

        // Create Three.js mesh from Rhino mesh
        console.log('🔨 [Scene] Converting to Three.js mesh');
        const threeMesh = createThreeMesh(rhinoMesh);

        // Add mesh to scene
        console.log('➕ [Scene] Adding mesh to scene');
        scene.add(threeMesh);

        // Calculate bounding box and center the mesh
        console.log('📏 [Scene] Calculating mesh bounds and centering');
        const box = new Box3().setFromObject(threeMesh);
        const size = box.getSize(new Vector3());
        const center = box.getCenter(new Vector3());
        threeMesh.position.sub(center); // Center the mesh at origin

        // Adjust camera position based on mesh size
        if (camera instanceof ThreePerspectiveCamera) {
          console.log('🎥 [Scene] Adjusting camera position');
          const maxDim = Math.max(size.x, size.y, size.z);
          const fovInRadians = camera.fov * (Math.PI / 180);
          // Position camera far enough to see entire mesh with some padding
          const cameraDistance = Math.abs(maxDim / Math.sin(fovInRadians / 2)) * 1.5;
          
          camera.position.set(cameraDistance, cameraDistance, cameraDistance);
          camera.lookAt(0, 0, 0);
          camera.updateProjectionMatrix();
          console.log('📸 [Scene] Camera positioned at distance:', cameraDistance);
        }


      })
      .catch((error: Error) => {
        console.error('❌ [Scene] Error processing mesh:', error);
      });

    // Cleanup function to clear scene on unmount
    return () => {
      console.log('🧹 [Scene] Cleanup: clearing scene');
      scene.clear();
    };
  }, [geometryData, scene, camera]); // Re-run effect when these dependencies change

  return (
    <>
      {/* Setup default camera */}
      <PerspectiveCamera makeDefault />
      
      {/* Scene lighting */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} />
      <directionalLight position={[-10, -10, -5]} intensity={1} />
      
      {/* Controls and helpers */}
      <OrbitControls 
        makeDefault 
        enableDamping 
        dampingFactor={0.1} 
      />
      {/* Maybe comment out grid and axes helpers for testing */}
      {/* <gridHelper args={[20, 20]} />
      <axesHelper args={[10]} /> */}
    </>
  );
} 