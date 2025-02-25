import React, { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';

// Interface for geometry parameters
export interface GeometryParams {
  radius: number;  // Controls the radius of the generated geometry
  count: number;   // Controls the number of elements
  length: number;  // Controls the length of the generated geometry
}

interface ParameterSlidersProps {
  onParamsChange: (params: GeometryParams) => void;
}

export default function ParameterSliders({ onParamsChange }: ParameterSlidersProps) {
  console.log('🎛️ [ParameterSliders] Initializing component');

  // Initialize state values with defaults
  const [radius, setRadius] = useState(5);
  const [count, setCount] = useState(10);
  const [length, setLength] = useState(5);

  console.log(`📊 [ParameterSliders] Initial state - radius: ${radius}, count: ${count}, length: ${length}`);

  // Create debounced parameter change handler to prevent too frequent API calls
  const debouncedParamChange = useCallback(
    debounce((params: GeometryParams) => {
      console.log('🔄 [ParameterSliders] Debounced parameter change:', params);
      onParamsChange(params);
    }, 200),
    []
  );

  // Handler for parameter changes that updates local state and triggers debounced API call
  const handleParamChange = (newValues: Partial<GeometryParams>) => {
    console.log('🎚️ [ParameterSliders] Parameter change detected:', newValues);

    const updatedParams = {
      radius,
      count,
      length,
      ...newValues
    };
    
    // Update local state immediately for responsive UI
    if ('radius' in newValues) {
      console.log(`📏 [ParameterSliders] Updating radius: ${newValues.radius}`);
      setRadius(newValues.radius!);
    }
    if ('count' in newValues) {
      console.log(`🔢 [ParameterSliders] Updating count: ${newValues.count}`);
      setCount(newValues.count!);
    }
    if ('length' in newValues) {
      console.log(`📏 [ParameterSliders] Updating length: ${newValues.length}`);
      setLength(newValues.length!);
    }
    
    // Trigger debounced API call with all parameters
    console.log('📤 [ParameterSliders] Triggering debounced update with:', updatedParams);
    debouncedParamChange(updatedParams);
  };

  // Render slider controls for each parameter
  return (
    <div className="space-y-4">
      {/* Radius slider control */}
      <div className="flex items-center space-x-4">
        <label className="w-16">Radius</label>
        <input
          type="range"
          min="1"
          max="10"
          value={radius}
          onChange={(e) => handleParamChange({ radius: Number(e.target.value) })}
          className="flex-grow"
        />
        <span className="w-8 text-right">{radius}</span>
      </div>

      {/* Count slider control */}
      <div className="flex items-center space-x-4">
        <label className="w-16">Count</label>
        <input
          type="range"
          min="1"
          max="100"
          value={count}
          onChange={(e) => handleParamChange({ count: Number(e.target.value) })}
          className="flex-grow"
        />
        <span className="w-8 text-right">{count}</span>
      </div>

      {/* Length slider control */}
      <div className="flex items-center space-x-4">
        <label className="w-16">Length</label>
        <input
          type="range"
          min="1"
          max="10"
          value={length}
          onChange={(e) => handleParamChange({ length: Number(e.target.value) })}
          className="flex-grow"
        />
        <span className="w-8 text-right">{length}</span>
      </div>
    </div>
  );
}