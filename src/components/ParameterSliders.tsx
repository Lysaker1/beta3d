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

  // Generate custom CSS for slider
  const sliderCss = `
    .slider-container {
      margin-bottom: 24px;
    }
    
    .slider-label-container {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      color: white;
    }
    
    .slider-label {
      font-size: 14px;
    }
    
    .slider-value {
      font-weight: bold;
      color: white;
    }
    
    .slider-wrapper {
      position: relative;
      height: 24px;
    }
    
    .slider-track {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 100%;
      height: 6px;
      background-color: #333;
      border-radius: 3px;
      overflow: hidden;
    }
    
    .slider-progress {
      position: absolute;
      height: 100%;
      background: linear-gradient(to right, #7de766, #82ff8b);
      border-radius: 3px;
    }
    
    input[type=range] {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      -webkit-appearance: none;
      z-index: 2;
      cursor: pointer;
      margin: 0;
    }
    
    .slider-thumb {
      position: absolute;
      top: 50%;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1;
    }
  `;

  return (
    <div>
      <style>{sliderCss}</style>
      
      {/* Radius Slider */}
      <div className="slider-container">
        <div className="slider-label-container">
          <span className="slider-label">Radius</span>
          <span className="slider-value">{radius}</span>
        </div>
        <div className="slider-wrapper">
          <div className="slider-track">
            <div 
              className="slider-progress" 
              style={{ width: `${(radius - 1) / 9 * 100}%` }}
            ></div>
          </div>
          <div 
            className="slider-thumb" 
            style={{ left: `${(radius - 1) / 9 * 100}%` }}
          ></div>
          <input
            type="range"
            min="1"
            max="10"
            value={radius}
            onChange={(e) => handleParamChange({ radius: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Count Slider */}
      <div className="slider-container">
        <div className="slider-label-container">
          <span className="slider-label">Count</span>
          <span className="slider-value">{count}</span>
        </div>
        <div className="slider-wrapper">
          <div className="slider-track">
            <div 
              className="slider-progress" 
              style={{ width: `${(count - 1) / 99 * 100}%` }}
            ></div>
          </div>
          <div 
            className="slider-thumb" 
            style={{ left: `${(count - 1) / 99 * 100}%` }}
          ></div>
          <input
            type="range"
            min="1"
            max="100"
            value={count}
            onChange={(e) => handleParamChange({ count: Number(e.target.value) })}
          />
        </div>
      </div>

      {/* Length Slider */}
      <div className="slider-container">
        <div className="slider-label-container">
          <span className="slider-label">Length</span>
          <span className="slider-value">{length}</span>
        </div>
        <div className="slider-wrapper">
          <div className="slider-track">
            <div 
              className="slider-progress" 
              style={{ width: `${(length - 1) / 9 * 100}%` }}
            ></div>
          </div>
          <div 
            className="slider-thumb" 
            style={{ left: `${(length - 1) / 9 * 100}%` }}
          ></div>
          <input
            type="range"
            min="1"
            max="10"
            value={length}
            onChange={(e) => handleParamChange({ length: Number(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}