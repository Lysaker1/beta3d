import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ghx } = body;
    
    if (!ghx) {
      return NextResponse.json({ error: 'No GHX provided' }, { status: 400 });
    }
    
    // Decode base64 content
    const decodedGhx = Buffer.from(ghx, 'base64').toString('utf-8');
    
    // Save for debugging
    const debugDir = path.join(process.cwd(), 'public', 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const ghxPath = path.join(debugDir, `ghx_diagnose_${timestamp}.ghx`);
    fs.writeFileSync(ghxPath, decodedGhx);
    
    // Basic validation - check if it's XML and contains key GHX elements
    const isXml = decodedGhx.trimStart().startsWith('<?xml');
    const hasArchiveTag = decodedGhx.includes('<Archive');
    const hasParameterInputs = decodedGhx.includes('<param_input');
    
    // Extract param info using regex (simplified approach)
    const paramInputs: any[] = [];
    let paramRegex;
    
    // Try multiple parameter formats to account for different GHX structures
    // Format 1: <param_input>...<Name>...</Name>
    paramRegex = /<param_input[^>]*>\s*<Name>(.*?)<\/Name>[\s\S]*?(?:<TypeHint>(.*?)<\/TypeHint>)?/g;
    let match;
    while ((match = paramRegex.exec(decodedGhx)) !== null) {
      paramInputs.push({
        name: match[1],
        type: match[2] || 'unknown'
      });
    }
    
    // Format 2: <item name="Name">Value</item>
    if (paramInputs.length === 0) {
      paramRegex = /<item\s+name="Name"[^>]*>(.*?)<\/item>[\s\S]*?<item\s+name="TypeHint"[^>]*>(.*?)<\/item>/g;
      while ((match = paramRegex.exec(decodedGhx)) !== null) {
        paramInputs.push({
          name: match[1],
          type: match[2] || 'unknown'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      diagnostics: {
        isXml,
        hasArchiveTag,
        hasParameterInputs,
        fileSize: decodedGhx.length,
        savedTo: ghxPath,
        parameters: paramInputs
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Diagnostic failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 