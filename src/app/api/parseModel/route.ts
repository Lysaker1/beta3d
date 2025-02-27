import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Check file type
    if (!file.name.toLowerCase().endsWith('.gltf') && !file.name.toLowerCase().endsWith('.glb')) {
      return NextResponse.json({ error: 'Only GLTF/GLB files are supported' }, { status: 400 });
    }
    
    // Read the file as an array buffer
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');
    
    // Determine file type
    const fileType = file.name.toLowerCase().endsWith('.gltf') ? 'gltf' : 'glb';
    
    // Create data URL
    const dataURL = `data:application/${fileType};base64,${base64Data}`;
    
    return NextResponse.json({
      fileType: fileType,
      fileData: dataURL,
      componentType: guessComponentType(file.name)
    });
    
  } catch (error) {
    console.error('Error parsing model:', error);
    return NextResponse.json(
      { error: 'Failed to parse model', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Guess component type from filename
function guessComponentType(fileName: string) {
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes('handlebar')) return 'handlebar';
  if (lowerName.includes('fork')) return 'fork';
  if (lowerName.includes('stem')) return 'stem';
  if (lowerName.includes('saddle')) return 'saddle';
  return 'fork'; // Default
} 