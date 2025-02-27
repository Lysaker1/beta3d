import { NextResponse } from 'next/server';
import { createGHXFromTemplate } from '@/utils/ghxGeneratorFromTemplate';
import { getComponentTemplate } from '@/utils/ghx/componentTemplates';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const componentType = formData.get('componentType') as string || 'fork';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Get the template for the component type
    const template = getComponentTemplate(componentType);
    if (!template) {
      return NextResponse.json(
        { error: 'Invalid component type' },
        { status: 400 }
      );
    }
    
    // For now, we'll use default parameters from the template
    // In a real implementation, you would analyze the 3D model to extract parameters
    const parameters = template.parameterDefinitions.reduce((acc, param) => {
      acc[param.name] = param.defaultValue;
      return acc;
    }, {} as Record<string, number>);
    
    // Generate GHX from template and parameters
    const ghxContent = createGHXFromTemplate(template, parameters);
    
    return NextResponse.json({
      componentType,
      parameters,
      ghx: ghxContent,
      confidence: 0.8, // Mock confidence value
      warnings: ['Using default parameters - no analysis performed yet']
    });
    
  } catch (error) {
    console.error('Error analyzing component:', error);
    return NextResponse.json(
      { error: 'Failed to analyze component', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 