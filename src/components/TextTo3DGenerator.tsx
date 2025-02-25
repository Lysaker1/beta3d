import { useState } from 'react';
import { createGHXDefinition } from '@/utils/ghx';
import  Viewer3D  from '@/components/viewer/index';

const WHEEL_PYTHON_SCRIPT = `
import rhinoscriptsyntax as rs
import ghpythonlib.components as gh

def create_wheel(radius, spoke_count):
    # Create the outer rim
    circle = rs.AddCircle([0,0,0], radius)
    
    # Create spokes
    spokes = []
    for i in range(spoke_count):
        angle = (360.0 * i) / spoke_count
        end_pt = [radius * rs.Cos(angle), radius * rs.Sin(angle), 0]
        spoke = rs.AddLine([0,0,0], end_pt)
        spokes.append(spoke)
    
    # Combine geometry
    all_geo = [circle] + spokes
    return all_geo

wheel = create_wheel(radius, spoke_count)
a = wheel  # Output for baking
`;

export default function TextTo3DGenerator() {
  const [userInput, setUserInput] = useState('');
  const [geometryData, setGeometryData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // For now, we'll use a simple regex to extract parameters
      const spokeMatch = userInput.match(/(\d+)\s*spokes?/);
      const radiusMatch = userInput.match(/radius\s*(?:of|:)?\s*(\d+)/);
      
      const parameters = [
        {
          name: 'radius',
          type: 'Number' as const,
          value: radiusMatch ? parseInt(radiusMatch[1]) : 10,
          min: 5,
          max: 20
        },
        {
          name: 'spoke_count',
          type: 'Integer' as const,
          value: spokeMatch ? parseInt(spokeMatch[1]) : 5,
          min: 3,
          max: 12
        }
      ];

      // Generate GHX definition
      const ghxContent = createGHXDefinition({
        pythonCode: WHEEL_PYTHON_SCRIPT,
        parameters
      });

      // Send to compute endpoint
      const response = await fetch('/api/computeGHX', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghx: ghxContent,
          parameters: Object.fromEntries(
            parameters.map(p => [p.name, p.value])
          )
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to compute geometry');
      }

      const data = await response.json();
      setGeometryData(data);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Describe your wheel
        </label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Example: generate a wheel with 5 spokes and radius of 10"
          className="w-full h-32 p-2 border rounded"
        />
      </div>
      
      <button
        onClick={handleGenerate}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
      >
        {isLoading ? 'Generating...' : 'Generate 3D Model'}
      </button>

      {error && (
        <div className="text-red-500 p-2 border border-red-200 rounded">
          {error}
        </div>
      )}

      {geometryData && (
        <div className="h-[500px] border rounded">
          <Viewer3D geometryData={geometryData} />
        </div>
      )}
    </div>
  );
} 