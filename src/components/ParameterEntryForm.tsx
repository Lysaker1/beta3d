// src/components/ParameterEntryForm.tsx
import { useState, useEffect } from 'react';
import { ComponentTemplate } from '@/utils/ghx/componentTemplates';

interface ParameterEntryFormProps {
  template: ComponentTemplate;
  onParametersChanged: (parameters: Record<string, number>) => void;
  initialParameters?: Record<string, number>;
}

export default function ParameterEntryForm({ 
  template, 
  onParametersChanged,
  initialParameters = {}
}: ParameterEntryFormProps) {
  const [parameters, setParameters] = useState<Record<string, number>>({});
  
  // Initialize parameters from template defaults and any provided initial values
  useEffect(() => {
    const defaultParams = template.parameterDefinitions.reduce((acc, param) => {
      acc[param.name] = initialParameters[param.name] !== undefined 
        ? initialParameters[param.name] 
        : param.defaultValue;
      return acc;
    }, {} as Record<string, number>);
    
    setParameters(defaultParams);
    onParametersChanged(defaultParams);
  }, [template, initialParameters, onParametersChanged]);
  
  const handleParameterChange = (name: string, value: number) => {
    const updatedParams = {
      ...parameters,
      [name]: value
    };
    
    setParameters(updatedParams);
    onParametersChanged(updatedParams);
  };
  
  return (
    <div className="space-y-4">
      {template.parameterDefinitions.map(param => {
        const value = parameters[param.name] || param.defaultValue;
        return (
          <div key={param.name} className="grid grid-cols-6 gap-2 items-center">
            <label className="font-medium col-span-2">
              {param.name.replace(/_/g, ' ')}:
            </label>
            
            <input
              type="range"
              min={param.min || param.defaultValue / 2}
              max={param.max || param.defaultValue * 2}
              value={value}
              onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
              className="col-span-3"
            />
            
            <div className="text-right">
              <input
                type="number"
                value={value}
                onChange={(e) => handleParameterChange(param.name, parseFloat(e.target.value))}
                className="w-20 py-1 px-2 border rounded text-right"
              />
            </div>
            
            <p className="col-span-6 text-xs text-gray-500">
              {param.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}