import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';

interface ParamInfo {
  name: string;
  type: string;
}

// Create a new endpoint that shows the exact parameter structure of HelloWorld.ghx
export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'HelloWorld.ghx');
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'HelloWorld.ghx not found' }, { status: 404 });
    }
    
    // Read and parse the GHX to extract parameter structure
    const ghxContent = fs.readFileSync(filePath, 'utf-8');
    
    // Extract parameter info using XML parsing
    const paramNames: ParamInfo[] = [];
    
    try {
      // Parse the XML content
      const result = await parseStringPromise(ghxContent);
      
      // Log the structure to help with debugging
      console.log('XML Parse Result:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
      
      // You'd need to navigate through the XML structure to find parameters
      // This is a simplified example - you'll need to adjust based on actual structure
      const params = result?.Archive?.chunks?.[0]?.chunk?.find(
        (c: any) => c?.$?.name === 'DefinitionObjects'
      )?.items?.[0]?.item || [];
      
      // Extract parameter info
      params.forEach((param: any) => {
        if (param?.Name?.[0] && param?.TypeHint?.[0]) {
          paramNames.push({
            name: param.Name[0],
            type: param.TypeHint[0]
          });
        }
      });
    } catch (xmlError) {
      console.error('Failed to parse XML:', xmlError);
    }
    
    return NextResponse.json({ 
      success: true,
      parameters: paramNames,
      // Include sample request structure that works
      sampleRequest: {
        "ParamName": "Number", 
        "InnerTree": {
          "0": [{
            "type": "System.Double",
            "data": 42
          }]
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}