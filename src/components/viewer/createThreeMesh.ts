import { BufferGeometry, BufferAttribute, Mesh, MeshStandardMaterial, DoubleSide } from 'three';
import type { RhinoMesh } from './RhinoMeshLoader';

/**
 * Converts a Rhino3dm mesh into a Three.js mesh
 * Handles:
 * - Extracting vertex positions and face indices from Rhino mesh
 * - Creating Three.js BufferGeometry with positions and indices
 * - Computing vertex normals for proper lighting
 * - Setting up material properties
 * 
 * @param rhinoMesh - Source Rhino mesh containing vertex and face data
 * @returns Three.js Mesh ready for rendering
 */
export function createThreeMesh(rhinoMesh: RhinoMesh): Mesh {
  console.log('🔄 [createThreeMesh] Starting conversion of Rhino mesh to Three.js mesh');

  // Get vertex and face data from Rhino mesh
  console.log('📊 [createThreeMesh] Accessing Rhino mesh data');
  const vertices = rhinoMesh.vertices();
  const faces = rhinoMesh.faces();
  console.log(`📐 [createThreeMesh] Found ${vertices.count} vertices and ${faces.count} faces`);

  // Create new Three.js geometry to hold the mesh data
  console.log('🏗️ [createThreeMesh] Creating Three.js BufferGeometry');
  const geometry = new BufferGeometry();

  // Create vertex position buffer
  // Each vertex has 3 components (x,y,z), so array length is vertex count * 3
  console.log('📍 [createThreeMesh] Processing vertex positions');
  const positions = new Float32Array(vertices.count * 3);
  for (let i = 0; i < vertices.count; i++) {
    const v = vertices.get(i);
    positions[i * 3 + 0] = v[0]; // x coordinate
    positions[i * 3 + 1] = v[1]; // y coordinate
    positions[i * 3 + 2] = v[2]; // z coordinate
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  console.log('✅ [createThreeMesh] Vertex positions added to geometry');

  // Create face indices buffer
  // Each triangular face has 3 vertex indices
  console.log('🔺 [createThreeMesh] Processing face indices');
  const indices = new Uint32Array(faces.count * 3);
  for (let i = 0; i < faces.count; i++) {
    const f = faces.get(i);
    indices[i * 3 + 0] = f[0]; // first vertex index
    indices[i * 3 + 1] = f[1]; // second vertex index
    indices[i * 3 + 2] = f[2]; // third vertex index
  }
  geometry.setIndex(new BufferAttribute(indices, 1));
  console.log('✅ [createThreeMesh] Face indices added to geometry');

  // Compute vertex normals for proper lighting
  console.log('💡 [createThreeMesh] Computing vertex normals');
  geometry.computeVertexNormals();

  // Create material with standard properties
  console.log('🎨 [createThreeMesh] Creating mesh material');
  const material = new MeshStandardMaterial({
    color: 0x00aaff,
    side: DoubleSide,
    wireframe: false,
    metalness: 0.2,
    roughness: 0.5,
    emissive: 0x222222,
    flatShading: true
  });

  // Create final mesh combining geometry and material
  console.log('🎭 [createThreeMesh] Creating final Three.js mesh');
  const threeMesh = new Mesh(geometry, material);

  console.log('✨ [createThreeMesh] Mesh creation complete');
  return threeMesh;
} 