import rhino3dm from 'rhino3dm';
import type { ViewerGeometryData } from './index';

/**
 * Interface representing a Rhino mesh with vertices and faces
 * Provides methods to access vertex positions and face indices
 */
export interface RhinoMesh {
  vertices: () => {
    count: number; // Total number of vertices
    get: (index: number) => [number, number, number]; // Get vertex position at index
  };
  faces: () => {
    count: number; // Total number of faces
    get: (index: number) => [number, number, number]; // Get face vertex indices at index
  };
}

/**
 * Decodes a RhinoComputeResponse into a RhinoMesh object
 * Handles parsing the response data and initializing rhino3dm to decode the mesh
 * 
 * @param geometryData - Response data from Rhino Compute containing encoded mesh
 * @returns Promise resolving to RhinoMesh if successful, null if any step fails
 */
export async function decodeRhinoMesh(
  geometryData: ViewerGeometryData
): Promise<RhinoMesh | null> {
  console.log('🔄 [decodeRhinoMesh] Starting mesh decoding process');

  // 1) First validate and extract the InnerTree branch containing our mesh data
  const innerTree = geometryData.values?.[0]?.InnerTree;
  if (!innerTree) {
    console.warn('⚠️ [decodeRhinoMesh] No InnerTree found in geometry data');
    return null;
  }

  const branchKey = Object.keys(innerTree)[0];
  if (!branchKey) {
    console.warn('⚠️ [decodeRhinoMesh] InnerTree is empty - no branches found');
    return null;
  }

  const dataItem = innerTree[branchKey][0]?.data;
  if (!dataItem) {
    console.warn('⚠️ [decodeRhinoMesh] No data found in first branch item');
    return null;
  }

  try {
    console.log('📦 [decodeRhinoMesh] Successfully extracted data from InnerTree');

    // 2) Parse the JSON string containing the baked mesh object
    const meshDataStr = dataItem as string;
    const bakedObj = JSON.parse(meshDataStr);
    if (!bakedObj.data) {
      console.warn('⚠️ [decodeRhinoMesh] Parsed object missing required "data" property');
      return null;
    }

    console.log('✅ [decodeRhinoMesh] Successfully parsed mesh data JSON');

    // 3) Initialize rhino3dm library with WebAssembly module
    console.log('🔧 [decodeRhinoMesh] Initializing rhino3dm...');
    const rm: any = await rhino3dm({
      locateFile: (filename: string) => `/rhino3dm.wasm`,
    });
    console.log('✅ [decodeRhinoMesh] rhino3dm initialized successfully');

    // 4) Use rhino3dm to decode the baked object into a mesh
    console.log('🔄 [decodeRhinoMesh] Decoding baked object...');
    const decodedObj = rm.CommonObject.decode(bakedObj);
    if (!decodedObj || decodedObj.objectType !== rm.ObjectType.Mesh) {
      console.warn('⚠️ [decodeRhinoMesh] Decoded object is not a valid mesh');
      return null;
    }

    console.log('✅ [decodeRhinoMesh] Successfully decoded Rhino mesh');

    const faces = decodedObj.faces();
    const vertices = decodedObj.vertices();

    console.log('Face count:', faces.count);
    console.log('Sample face:', faces.get(0));
    console.log('Vertex count:', vertices.count);
    console.log('Sample vertex:', vertices.get(0));

    console.log('Face samples:', 
      [...Array(Math.min(5, faces.count))].map((_, i) => faces.get(i)));
    console.log('Vertex samples:', 
      [...Array(Math.min(5, vertices.count))].map((_, i) => vertices.get(i)));

    return decodedObj as RhinoMesh;

  } catch (error) {
    console.error('❌ [decodeRhinoMesh] Error during mesh decoding:', error);
    return null;
  }
} 