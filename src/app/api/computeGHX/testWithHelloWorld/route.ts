import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// This is a test endpoint to verify Rhino Compute with a known good GHX
export async function GET() {
  try {
    // Read the HelloWorld.ghx file
    const filePath = path.join(process.cwd(), 'public', 'HelloWorld.ghx');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'HelloWorld.ghx not found' }, { status: 404 });
    }
    
    const ghxContent = fs.readFileSync(filePath, 'utf-8');
    const base64Content = Buffer.from(ghxContent).toString('base64');
    
    // Use the same Rhino Compute URL and key from the environment
    const rhinoComputeUrl = process.env.RHINO_COMPUTE_URL || 'http://13.53.137.42:80';
    const rhinoComputeKey = process.env.RHINO_COMPUTE_KEY || '';
    
    // Build a test request with minimal parameters
    const computeBody = {
      algo: base64Content,
      pointer: null,
      values: [
        {
          ParamName: "Number", // Must match what's in HelloWorld.ghx
          InnerTree: {
            "0": [{
              "type": "System.Double",
              "data": 42
            }]
          }
        }
      ],
      files: null
    };
    
    // Send to Rhino Compute
    const response = await fetch(`${rhinoComputeUrl}/grasshopper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(rhinoComputeKey ? { 'RhinoComputeKey': rhinoComputeKey } : {})
      },
      body: JSON.stringify(computeBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Rhino Compute Error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json({ success: true, result });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 