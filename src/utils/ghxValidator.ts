interface GHXValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateGHX(ghxContent: string): GHXValidationResult {
  const result: GHXValidationResult = {
    isValid: true,
    errors: []
  };

  try {
    // Decode base64
    const xmlContent = Buffer.from(ghxContent, 'base64').toString();
    
    // Basic structure checks
    if (!xmlContent.includes('<?xml version="1.0"')) {
      result.errors.push('Missing XML declaration');
    }
    
    if (!xmlContent.includes('<Archive name="Root"')) {
      result.errors.push('Missing Archive root element');
    }

    // Check for required components
    const requiredElements = [
      'GhPython',
      'GH_Bake',
      'Grasshopper.Kernel.Special.GhNumberSlider'
    ];

    requiredElements.forEach(element => {
      if (!xmlContent.includes(element)) {
        result.errors.push(`Missing required component: ${element}`);
      }
    });

    // Validate Python script section
    if (xmlContent.includes('GhPython') && !xmlContent.includes('<Source><![CDATA[')) {
      result.errors.push('Python script component missing CDATA section');
    }

    result.isValid = result.errors.length === 0;
  } catch (error) {
    result.isValid = false;
    result.errors.push(`Invalid base64 or XML structure: ${error}`);
  }

  return result;
}

const ghxContent = createGHXDefinition({
  pythonCode: `
import rhinoscriptsyntax as rs
import ghpythonlib.components as gh

# Your Python code here
geometry = rs.AddSphere([0,0,0], radius)
a = geometry
  `,
  parameters: [
    { name: 'radius', type: 'Number', value: 5, min: 0, max: 10 },
    { name: 'count', type: 'Integer', value: 10, min: 1, max: 100 }
  ]
});

if (isValidGHX(ghxContent)) {
  // Use the GHX content
} 