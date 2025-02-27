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
    const ghxPath = path.join(debugDir, `ghx_verify_${timestamp}.ghx`);
    fs.writeFileSync(ghxPath, decodedGhx);
    
    // Simple structural analysis
    const analysis = {
      fileSize: decodedGhx.length,
      hasArchiveTag: decodedGhx.includes('<Archive'),
      hasGrasshopperRefs: decodedGhx.includes('Grasshopper'),
      paramInputCount: (decodedGhx.match(/<param_input/g) || []).length,
      pythonCodePresent: decodedGhx.includes('GhPython') || decodedGhx.includes('Python'),
      diagnosticSections: {
        objectSection: decodedGhx.includes('<chunk name="DefinitionObjects">'),
        paramSection: decodedGhx.includes('<chunk name="DefinitionParameters">'),
        thumbnailSection: decodedGhx.includes('<chunk name="Thumbnail">')
      },
      savedTo: ghxPath
    };
    
    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 