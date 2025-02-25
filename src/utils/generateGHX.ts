import { createCompleteGHX } from './ghxTemplate';
import { validateGHX } from './ghxValidator';
import { v4 as uuidv4 } from 'uuid';

export function generateParametricGHX(
  pythonCode: string,
  parameters: Record<string, { type: 'Number' | 'Integer'; value: number }>
): string {
  // Create components array
  const components: GHXComponent[] = [];
  let xPos = 0;

  // Add parameter components
  Object.entries(parameters).forEach(([name, param], index) => {
    components.push({
      guid: uuidv4(),
      name,
      type: param.type,
      position: { x: xPos, y: 0 }
    });
    xPos += 150;
  });

  // Add Python script component
  components.push({
    guid: uuidv4(),
    name: 'PythonScript',
    type: 'Python',
    position: { x: xPos, y: 100 },
    inputs: Object.keys(parameters),
    code: pythonCode
  });

  // Add Bake component
  components.push({
    guid: uuidv4(),
    name: 'OutputBake',
    type: 'Bake',
    position: { x: xPos, y: 200 }
  });

  // Generate and validate GHX
  const ghxContent = createCompleteGHX(components);
  const validation = validateGHX(ghxContent);

  if (!validation.isValid) {
    throw new Error(`Invalid GHX generated: ${validation.errors.join(', ')}`);
  }

  return ghxContent;
} 