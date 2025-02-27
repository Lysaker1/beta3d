import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { ghx } = await request.json();
    
    if (!ghx) {
      return NextResponse.json({ error: 'No GHX content provided' }, { status: 400 });
    }
    
    let decodedGHX: string;
    try {
      decodedGHX = Buffer.from(ghx, 'base64').toString('utf-8');
    } catch (e) {
      return NextResponse.json({ error: 'Invalid base64 GHX content' }, { status: 400 });
    }
    
    // Analyze structure
    const archiveMatch = decodedGHX.match(/<Archive name="Root">/);
    const chunksMatch = decodedGHX.match(/<chunks count="(\d+)">/g);
    const chunkNames = (decodedGHX.match(/<chunk name="([^"]+)">/g) || [])
      .map(match => match.match(/<chunk name="([^"]+)">/)?.[1])
      .filter(Boolean);
    
    // Save debug content
    const debugDir = path.join(process.cwd(), 'public', 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filePath = path.join(debugDir, `ghx_debug_${timestamp}.xml`);
    fs.writeFileSync(filePath, decodedGHX);
    
    return NextResponse.json({
      success: true,
      analysis: {
        hasArchiveTag: Boolean(archiveMatch),
        chunkDefinitions: chunksMatch,
        topLevelChunks: chunkNames.slice(0, 5), // Just the first few
        chunkCount: chunkNames.length,
        fileSaved: filePath,
        fileSize: decodedGHX.length
      }
    });
  } catch (error) {
    console.error('Error in GHX debug:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 