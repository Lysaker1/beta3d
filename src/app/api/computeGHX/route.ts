import { NextResponse } from 'next/server';
import { saveDebugGHX } from '@/utils/ghxDebugHelper';
import path from 'path';
import fs from 'fs';

// Define interfaces for better type safety
interface ComputeGHXRequest {
  ghx: string; // Base64 encoded GHX
  parameters: Record<string, number>; // Key-value pairs of parameters
}

// You need to either create this utility or remove it
// Instead of using saveDebugGHX which doesn't exist:
function saveDebugInfo(ghx: string, requestInfo: string): void {
  try {
    // Optional debugging logic here
    console.log('📄 [Debug] Saving debug info');
  } catch (error) {
    console.error('Failed to save debug info', error);
  }
}

function isValidGHX(ghx: string): boolean {
  try {
    const decoded = Buffer.from(ghx, 'base64').toString('utf-8');
    return decoded.includes('<Archive') && decoded.includes('Grasshopper');
  } catch {
    return false;
  }
}

// Control whether to use real Rhino Compute or the mock implementation
// Set to false to use the mock implementation during development
const useRhinoCompute = process.env.USE_RHINO_COMPUTE === 'true';

console.log(`🔧 [computeGHX] Using Rhino Compute: ${useRhinoCompute ? 'yes' : 'no'}`);

export async function POST(request: Request) {
  console.log('📥 [computeGHX] Received compute request');
  
  try {
    const body = await request.json() as ComputeGHXRequest;
    console.log('📦 [computeGHX] Request body received');
    console.log('🔍 [computeGHX] Parameters:', body.parameters);
    
    // Save debug info (optional)
    saveDebugInfo(body.ghx, JSON.stringify(body.parameters));

    // Validate the GHX definition
    if (!body.ghx || !isValidGHX(body.ghx)) {
      console.error('❌ [computeGHX] Invalid GHX definition');
      return NextResponse.json(
        { error: 'Invalid GHX definition provided' },
        { status: 400 }
      );
    }
    console.log('✅ [computeGHX] GHX definition validated');

    // Validate parameters
    if (!body.parameters || typeof body.parameters !== 'object') {
      console.error('❌ [computeGHX] Invalid parameters');
      return NextResponse.json(
        { error: 'Invalid parameters provided' },
        { status: 400 }
      );
    }
    console.log('✅ [computeGHX] Parameters validated');

    // Define Rhino Compute URL and key
    const rhinoComputeUrl = process.env.RHINO_COMPUTE_URL || 'http://13.53.137.42:80';
    const rhinoComputeKey = process.env.RHINO_COMPUTE_KEY || '';
    
    console.log('🔧 [computeGHX] Preparing compute request');
    
    // FIX #1: Always use System.Double for all parameters regardless of actual value
    // FIX #2: Format parameters to match the GHX file's expectations (list access)
    const parameterValues = Object.entries(body.parameters).map(([name, value]) => ({
      ParamName: name,
      InnerTree: {
        "0": [{
          "type": "System.Double", // Always use Double instead of Int32
          "data": Number(value)    // Ensure it's a number
        }]
      }
    }));
    
    console.log('📊 [computeGHX] Formatted parameters:', JSON.stringify(parameterValues, null, 2));

    // Build the request body with proper encoding
    const computeBody = {
      algo: body.ghx,
      pointer: null,
      values: parameterValues,
      files: null
    };
    
    // Send to Rhino Compute
    console.log('🌐 [computeGHX] Sending request to Rhino Compute');
    const response = await fetch(`${rhinoComputeUrl}/grasshopper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(rhinoComputeKey ? { 'RhinoComputeKey': rhinoComputeKey } : {})
      },
      body: JSON.stringify(computeBody)
    });
    
    if (!response.ok) {
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (err) {
        errorText = 'Could not read error response';
      }

      console.error(`❌ [computeGHX] Rhino Compute Error: ${response.status}`, errorText);
      
      // Save the failing request details
      const debugTimestamp = new Date().toISOString().replace(/:/g, '-');
      const debugPath = path.join(process.cwd(), 'public', 'debug', `failing_ghx_${debugTimestamp}.json`);
      
      try {
        fs.writeFileSync(debugPath, JSON.stringify({
          parameters: body.parameters,
          computeBody: {
            ...computeBody,
            algo: computeBody.algo.substring(0, 500) + '...' // Truncate the GHX to save space
          },
          error: errorText,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        }, null, 2));
      } catch (e) {
        console.error('Failed to save debug info', e);
      }
      
      return NextResponse.json(
        { 
          error: `Rhino Compute Error: ${response.status}`, 
          details: errorText,
          requestBody: {
            parameterCount: parameterValues.length,
            algorithmPreview: body.ghx.substring(0, 100) + '...'
          },
          debugSavedTo: debugPath
        },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    console.log('✅ [computeGHX] Received successful response from Rhino Compute');
    
    // Extract meshes and return
    const meshes: any[] = extractMeshesFromComputeResult(result);
    return NextResponse.json({ meshes });
    
  } catch (error) {
    console.error('❌ [computeGHX] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process compute request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to extract meshes from Rhino Compute response
function extractMeshesFromComputeResult(result: any): any[] {
  try {
    // Logic to extract meshes from the compute result
    const meshes: any[] = [];
    
    // Process the result to extract meshes
    if (result.values && Array.isArray(result.values)) {
      const meshOutput = result.values.find((v: any) => 
        v && v.ParamName === 'Out' || v.ParamName.toLowerCase().includes('mesh')
      );
      
      if (meshOutput && meshOutput.InnerTree) {
        // Process all mesh data in the tree
        Object.values(meshOutput.InnerTree).forEach((branch: any) => {
          if (Array.isArray(branch)) {
            branch.forEach((item: any) => {
              if (item && item.data) {
                meshes.push(item.data);
              }
            });
          }
        });
      }
    }
    
    console.warn('⚠️ [extractMeshesFromComputeResult] No meshes found in compute result');
    return meshes;
  } catch (err) {
    console.error('❌ [extractMeshesFromComputeResult] Error extracting meshes:', err);
    return [];
  }
}

// Mock geometry function for testing without Rhino Compute
function createMockGeometry(parameters: Record<string, number>): any[] {
  // Create a mock fork or handlebar geometry based on parameters
  const componentType = 'fork'; // You would determine this from somewhere
  
  if (componentType === 'fork') {
    return createMockForkGeometry(parameters);
  } else if (componentType === 'handlebar') {
    return createMockHandlebarGeometry(parameters);
  }
  
  return [];
}

function createMockForkGeometry(parameters: Record<string, number>): any[] {
  // Steerer tube length and diameter
  const steererLength = parameters.steerer_length || 150;
  const steererDiameter = parameters.steerer_diameter || 28.6;
  
  // Crown width
  const crownWidth = parameters.crown_width || 60;
  
  // Blade length
  const bladeLength = parameters.blade_length || 400;
  
  // Dropout width
  const dropoutWidth = parameters.dropout_width || 100;
  
  // Create a simple fork model with vertices and faces
  return [{
    vertices: [
      // Steerer tube vertices (top)
      [0, 0, 0],
      [steererDiameter, 0, 0],
      [steererDiameter, steererDiameter, 0],
      [0, steererDiameter, 0],
      
      // Steerer tube vertices (bottom)
      [0, 0, steererLength],
      [steererDiameter, 0, steererLength],
      [steererDiameter, steererDiameter, steererLength],
      [0, steererDiameter, steererLength],
      
      // Crown vertices (left)
      [-crownWidth/2, 0, steererLength],
      [-crownWidth/2, steererDiameter, steererLength],
      
      // Crown vertices (right)
      [steererDiameter + crownWidth/2, 0, steererLength],
      [steererDiameter + crownWidth/2, steererDiameter, steererLength],
      
      // Left blade (top)
      [-crownWidth/2, 0, steererLength],
      [-crownWidth/2, steererDiameter, steererLength],
      
      // Left blade (bottom)
      [-dropoutWidth/2, 0, steererLength + bladeLength],
      [-dropoutWidth/2, steererDiameter, steererLength + bladeLength],
      
      // Right blade (top)
      [steererDiameter + crownWidth/2, 0, steererLength],
      [steererDiameter + crownWidth/2, steererDiameter, steererLength],
      
      // Right blade (bottom)
      [steererDiameter + dropoutWidth/2, 0, steererLength + bladeLength],
      [steererDiameter + dropoutWidth/2, steererDiameter, steererLength + bladeLength],
    ],
    faces: [
      // Steerer tube faces
      [0, 1, 2], [0, 2, 3], // top
      [4, 5, 6], [4, 6, 7], // bottom
      [0, 3, 7], [0, 7, 4], // front
      [1, 2, 6], [1, 6, 5], // back
      [0, 1, 5], [0, 5, 4], // left
      [2, 3, 7], [2, 7, 6], // right
      
      // Left blade faces
      [8, 9, 15], [8, 15, 14],
      [9, 13, 15],
      [8, 12, 14],
      
      // Right blade faces
      [10, 11, 19], [10, 19, 18],
      [11, 17, 19],
      [10, 16, 18],
    ]
  }];
}

function createMockHandlebarGeometry(parameters: Record<string, number>): any[] {
  // Mock implementation for handlebar
  const width = parameters.width || 420;
  const gripDiameter = parameters.grip_diameter || 22;
  const dropDiameter = parameters.drop_diameter || 23.8;
  
  // Create a simple handlebar model
  return [{
    vertices: [
      // Basic handlebar vertices would go here
      [-width/2, 0, 0],
      [width/2, 0, 0],
      [-width/2, gripDiameter, 0],
      [width/2, gripDiameter, 0],
      [-width/2, 0, gripDiameter],
      [width/2, 0, gripDiameter],
      [-width/2, gripDiameter, gripDiameter],
      [width/2, gripDiameter, gripDiameter],
    ],
    faces: [
      // Basic handlebar faces would go here
      [0, 1, 3], [0, 3, 2],
      [4, 5, 7], [4, 7, 6],
      [0, 2, 6], [0, 6, 4],
      [1, 3, 7], [1, 7, 5],
      [0, 1, 5], [0, 5, 4],
      [2, 3, 7], [2, 7, 6],
    ]
  }];
} 