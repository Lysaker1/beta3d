import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export interface Viewer3DProps {
  modelData: {
    fileType?: 'gltf' | 'glb';
    fileData?: string; // Base64 data URL
    meshes?: Array<{
      vertices: number[][];
      faces: number[][];
    }>;
  };
  title?: string;
}

export default function Viewer3D(props: Viewer3DProps) {
  const { modelData, title } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  
  console.log("Viewer3D received modelData:", modelData);
  
  console.log('Viewer3D props received:', props);
  
  if (!props.modelData || !props.modelData.meshes) {
    console.warn('Viewer3D: No valid data provided');
    return <div className="bg-gray-100 p-4 rounded">No 3D data available</div>;
  }
  
  useEffect(() => {
    if (!containerRef.current) {
      console.error("Container ref is not available");
      return;
    }
    
    if (!modelData) {
      console.error("No modelData provided");
      return;
    }
    
    console.log("Setting up 3D scene with modelData:", modelData);
    
    // Set up scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x444444);
    
    // Set up camera with better initial position
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      2000
    );
    camera.position.set(100, 100, 100);
    
    // Set up renderer with explicit size
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false
    });
    
    // Force size to make sure it's visible - debugging measure
    const containerWidth = Math.max(containerRef.current.clientWidth, 300);
    const containerHeight = Math.max(containerRef.current.clientHeight, 200);
    
    renderer.setSize(containerWidth, containerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    
    // Add to DOM
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    
    // Add a grid to help with orientation
    const gridHelper = new THREE.GridHelper(100, 10);
    scene.add(gridHelper);
    
    // Add axes helper to visualize XYZ
    const axesHelper = new THREE.AxesHelper(50);
    scene.add(axesHelper);
    
    // Set up controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Load model based on data type
    let modelObject: THREE.Object3D | null = null;
    
    try {
      console.log("Rendering model with data:", modelData);
      
      // If we have a direct file to load
      if (modelData.fileData) {
        console.log("Loading", modelData.fileType || 'gltf', "from direct file data");
        
        const loader = new GLTFLoader();
        
        // Set up Draco decoder if needed
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('/draco/');
        loader.setDRACOLoader(dracoLoader);
        
        const fileType = modelData.fileType || 'glb';
        console.log(`Loading ${fileType} from direct file data`);
        
        try {
          loader.load(
            modelData.fileData, // Data URL
            (gltf) => {
              console.log("GLTF loaded successfully:", gltf);
              const model = gltf.scene;
              scene.add(model);
              modelObject = model;
              
              // Center and fit the model in view
              const box = new THREE.Box3().setFromObject(model);
              const center = box.getCenter(new THREE.Vector3());
              const size = box.getSize(new THREE.Vector3());
              
              // Center the model
              model.position.x = -center.x;
              model.position.y = -center.y;
              model.position.z = -center.z;
              
              // Position camera to see the entire model
              const maxDim = Math.max(size.x, size.y, size.z);
              const fov = camera.fov * (Math.PI / 180);
              const cameraDistance = maxDim / (2 * Math.tan(fov / 2));
              
              camera.position.set(0, 0, cameraDistance * 1.5);
              camera.lookAt(0, 0, 0);
              
              controls.update();
            },
            (progress) => {
              console.log(`Loading progress: ${Math.round(progress.loaded / progress.total * 100)}%`);
            },
            (err: unknown) => {
              console.error("Error loading GLTF:", err);
              setError(`Failed to load model: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          );
        } catch (err) {
          console.error('Error setting up 3D scene:', err);
          setError(err instanceof Error ? err.message : 'Unknown error occurred');
        }
      }
      // If we have mesh data (from server or mock)
      else if (modelData.meshes && modelData.meshes.length > 0) {
        console.log("Loading from mesh data array:", modelData.meshes);
        
        // Group to hold all meshes
        const meshesGroup = new THREE.Group();
        scene.add(meshesGroup);
        modelObject = meshesGroup;
        
        // Create materials
        const material = new THREE.MeshStandardMaterial({
          color: 0x3366cc,
          side: THREE.DoubleSide,
          flatShading: true
        });
        
        // Process each mesh
        modelData.meshes.forEach((meshData, index) => {
          try {
            console.log(`Processing mesh ${index} - Vertices: ${meshData.vertices.length}, Faces: ${meshData.faces.length}`);
            
            // Create geometry
            const geometry = new THREE.BufferGeometry();
            
            // Convert vertices to flat array for BufferGeometry
            const vertices = new Float32Array(meshData.vertices.flat());
            geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
            
            // Convert faces to indices
            const indices: number[] = [];
            meshData.faces.forEach(face => {
              if (face.length >= 3) {
                // Triangle
                indices.push(face[0], face[1], face[2]);
                
                // If quad (or n-gon), triangulate
                for (let i = 3; i < face.length; i++) {
                  indices.push(face[0], face[i-1], face[i]);
                }
              }
            });
            
            // Add indices to geometry
            geometry.setIndex(indices);
            
            // Compute normals
            geometry.computeVertexNormals();
            
            // Create mesh and add to group
            const mesh = new THREE.Mesh(geometry, material);
            meshesGroup.add(mesh);
            
            console.log(`Mesh ${index} added to scene`);
          } catch (meshError) {
            console.error(`Error processing mesh ${index}:`, meshError);
          }
        });
        
        // Center and fit all meshes
        const box = new THREE.Box3().setFromObject(meshesGroup);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        // Center the model
        meshesGroup.position.x = -center.x;
        meshesGroup.position.y = -center.y;
        meshesGroup.position.z = -center.z;
        
        // Position camera to see all meshes
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraDistance = maxDim / (2 * Math.tan(fov / 2));
        
        camera.position.set(0, 0, cameraDistance * 1.5);
        camera.lookAt(0, 0, 0);
        
        controls.update();
      }
      else {
        console.error("Invalid modelData format:", modelData);
        setError("Invalid model data format");
      }
    } catch (err) {
      console.error("Exception in viewer:", err);
      setError(`Error in 3D viewer: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    // Log DOM structure for debugging
    console.log('Container element:', containerRef.current);
    console.log('Renderer domElement appended:', renderer.domElement);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup on unmount
    return () => {
      console.log("Cleaning up 3D viewer");
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      if (modelObject) {
        scene.remove(modelObject);
      }
      
      scene.clear();
      renderer.dispose();
    };
  }, [modelData]);
  
  return (
    <div className="w-full h-full relative" style={{ minHeight: '240px', border: '1px solid red' }}>
      {title && (
        <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white py-1 px-2 text-xs z-10">
          {title}
        </div>
      )}
      <div 
        ref={containerRef} 
        className="w-full h-full absolute inset-0" 
        style={{ minHeight: '240px', background: '#333' }} 
      />
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 text-white">
          <div className="text-center p-4">
            <p>{error}</p>
          </div>
        </div>
      )}
    </div>
  );
} 