export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { isValidGHX } from '@/utils/ghx';

const RHINO_COMPUTE_URL = process.env.RHINO_COMPUTE_URL;
const RHINO_COMPUTE_KEY = process.env.RHINO_COMPUTE_KEY;

interface ComputeGHXRequest {
  ghx: string; // Base64 encoded GHX definition
  parameters: Record<string, number>; // Parameter values for the computation
}

interface ComputeValue {
  type: string;
  data: string | number;
}

interface InnerTree {
  [key: string]: ComputeValue[];
}

interface ComputeResponseValue {
  ParamName: string;
  InnerTree: InnerTree;
}

interface ComputeResponse {
  values: ComputeResponseValue[];
}

export async function POST(request: Request) {
  console.log('📥 [computeGHX] Received compute request');
  
  try {
    const body = await request.json() as ComputeGHXRequest;
    console.log('📦 [computeGHX] Request body received');
    console.log('🔍 [computeGHX] Parameters:', body.parameters);

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

    console.log('🔧 [computeGHX] Preparing compute request');
    
    // Convert parameters to the format expected by Rhino Compute
    const parameterValues = Object.entries(body.parameters).map(([name, value]) => ({
      ParamName: name,
      InnerTree: {
        "0": [{
          "type": Number.isInteger(value) ? "System.Int32" : "System.Double",
          "data": value
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
    console.log('📦 [computeGHX] Compute request body prepared');

    console.log('🌐 [computeGHX] Sending request to Rhino Compute');
    const response = await fetch(`${RHINO_COMPUTE_URL}/grasshopper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RhinoComputeKey': RHINO_COMPUTE_KEY
      },
      body: JSON.stringify(computeBody)
    });

    console.log('📥 [computeGHX] Received response from Rhino Compute');
    console.log('ℹ️ [computeGHX] Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response headers:', response.headers);
      console.error('Response body:', errorText);
      throw new Error(`Rhino Compute error: ${response.status} - ${errorText}`);
    }

    const computeResponse = await response.json();
    console.log('📊 [computeGHX] Compute response:', JSON.stringify(computeResponse, null, 2));
    console.log('✅ [computeGHX] Successfully processed geometry');

    // More flexible geometry validation
    // Check for any output that contains geometry data
    const geometryOutput = computeResponse.values?.find((val: ComputeResponseValue) => {
      // Safely access the first branch using Object.values
      const branches = Object.values(val.InnerTree as InnerTree);
      if (branches.length === 0) return false;
      
      const firstBranch = branches[0];
      if (!Array.isArray(firstBranch) || firstBranch.length === 0) return false;

      const firstValue = firstBranch[0];
      return firstValue?.type === 'Rhino.Geometry.GeometryBase' ||
             firstValue?.type === 'Rhino.Geometry.Mesh' ||
             firstValue?.type === 'Rhino.Geometry.Brep';
    });
    
    if (!geometryOutput) {
      console.error('❌ [computeGHX] No valid geometry output found');
      console.error('❌ [computeGHX] Available outputs:', 
        computeResponse.values?.map((v: ComputeResponseValue) => {
          const firstBranch = Object.values(v.InnerTree)[0];
          return {
            name: v.ParamName,
            type: firstBranch?.[0]?.type ?? 'unknown'
          };
        })
      );
      return NextResponse.json(
        { error: 'No valid geometry output found in computation results' },
        { status: 500 }
      );
    }
    console.log('✅ [computeGHX] Valid geometry output found');

    return NextResponse.json(computeResponse);
    
  } catch (error) {
    console.error('❌ [computeGHX] Error:', error);
    console.error('❌ [computeGHX] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to process geometry',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 