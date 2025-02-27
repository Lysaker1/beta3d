// src/components/ComponentUploader.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ComponentTemplate, getComponentTemplate } from '@/utils/ghx/componentTemplates';
import { createGHXFromTemplate } from '@/utils/ghxGeneratorFromTemplate';
import Viewer3D from '@/components/viewerUpload';
import { validateGHXContent } from '@/utils/ghx';
import setErrorClass from 'set-error-class';
// Steps in the upload workflow
const STEPS = {
  UPLOAD: 1,
  PARAMETERS: 2,
  PREVIEW: 3
};

// Define the shape of parameter data
interface ParameterData {
  [key: string]: number;
}

// Define the shape of model data for the viewer
interface ModelData {
  meshes: any[];
  [key: string]: any;
}

function debugModelData(label: string, data: any) {
  console.log(`[DEBUG] ${label}:`, data);
  if (data?.fileData) {
    console.log(`[DEBUG] fileData starts with: ${data.fileData.substring(0, 50)}...`);
  }
  if (data?.meshes) {
    console.log(`[DEBUG] Number of meshes: ${data.meshes.length}`);
  }
}

function debugStep(step: string, data?: any) {
  console.log(`🔍 [ComponentUploader] ${step}`);
  if (data) {
    console.log(data);
    
    // For GHX data, log the first and last 100 characters to check validity
    if (typeof data === 'string' && data.startsWith('<?xml')) {
      console.log(`GHX starts with: ${data.substring(0, 100)}`);
      console.log(`GHX ends with: ${data.substring(data.length - 100)}`);
    }
  }
}

// Helper functions for parameter ranges
function getMinValue(param: string, componentType: string): number {
  // Default ranges by parameter and component type
  const ranges: Record<string, Record<string, [number, number]>> = {
    fork: {
      steerer_length: [50, 300],
      steerer_diameter: [20, 40],
      crown_width: [40, 100],
      blade_length: [300, 500],
      dropout_width: [80, 150],
      rake: [20, 70]
    },
    handlebar: {
      width: [300, 800],
      rise: [0, 150],
      sweep: [0, 45],
      drop: [0, 150],
      reach: [50, 150],
      diameter: [20, 35]
    }
  };

  return ranges[componentType]?.[param]?.[0] || 0;
}

function getMaxValue(param: string, componentType: string): number {
  // Default ranges by parameter and component type
  const ranges: Record<string, Record<string, [number, number]>> = {
    fork: {
      steerer_length: [50, 300],
      steerer_diameter: [20, 40],
      crown_width: [40, 100],
      blade_length: [300, 500],
      dropout_width: [80, 150],
      rake: [20, 70]
    },
    handlebar: {
      width: [300, 800],
      rise: [0, 150],
      sweep: [0, 45],
      drop: [0, 150],
      reach: [50, 150],
      diameter: [20, 35]
    }
  };

  return ranges[componentType]?.[param]?.[1] || 100;
}

// Add this function to validate GHX before sending to Rhino Compute
const validateAndLogGHX = (ghxContent: string) => {
  try {
    // Check for basic GHX structure
    const decodedGHX = atob(ghxContent);
    
    const isValidGHX = decodedGHX.includes('<Archive name="Root">')
      && decodedGHX.includes('Grasshopper archive')
      && decodedGHX.includes('<chunks count="');
    
    if (!isValidGHX) {
      console.error('❌ Invalid GHX structure!');
      setError('The generated GHX file has invalid structure');
      return false;
    }
    
    // Check for essential chunks
    const hasDef = decodedGHX.includes('<chunk name="Definition">');
    const hasDocHeader = decodedGHX.includes('<chunk name="DocumentHeader">');
    const hasDefProps = decodedGHX.includes('<chunk name="DefinitionProperties">');
    const hasDefObjs = decodedGHX.includes('<chunk name="DefinitionObjects">');
    
    if (!hasDef || !hasDocHeader || !hasDefProps || !hasDefObjs) {
      console.error('❌ Missing essential GHX chunks!');
      setError('The generated GHX file is missing essential chunks');
      return false;
    }
    
    // Validate chunk counts
    // This is a common issue - chunk counts not matching actual chunks
    const defChunkMatch = decodedGHX.match(/<chunks count="(\d+)">/g);
    if (defChunkMatch) {
      console.log('📊 Chunk definitions:', defChunkMatch);
    }
    
    // Log successful validation
    console.log('✅ GHX validation passed');
    return true;
  } catch (err) {
    console.error('❌ GHX validation error:', err);
    setError('Failed to validate GHX file: ' + (err instanceof Error ? err.message : String(err)));
    return false;
  }
};

export default function ComponentUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [originalModelData, setOriginalModelData] = useState<ModelData | null>(null);
  const [parameterizedModelData, setParameterizedModelData] = useState<ModelData | null>(null);
  const [parameters, setParameters] = useState<ParameterData>({});
  const [componentType, setComponentType] = useState<string>('fork');
  const [currentStep, setCurrentStep] = useState(STEPS.UPLOAD);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file extension
      const fileName = selectedFile.name.toLowerCase();
      const isModelFile = fileName.endsWith('.gltf') || fileName.endsWith('.glb') || 
                           fileName.endsWith('.obj') || fileName.endsWith('.stl');
      
      if (!isModelFile) {
        setError('Please select a valid 3D model file (.gltf, .glb, .obj, .stl)');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      
      // Read the file for preview in the 3D viewer
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileData = event.target?.result?.toString() || '';
        
        // Set the original model data for display
        setOriginalModelData({
          fileType: fileName.endsWith('.gltf') ? 'gltf' : 
                   fileName.endsWith('.glb') ? 'glb' : 'obj',
          fileData: fileData,
          meshes: []
        });
        
        // Move to parameters step after successful upload
        setCurrentStep(STEPS.PARAMETERS);
      };
      
      reader.readAsDataURL(selectedFile);
    }
  };
  
  // Add a new function to handle file uploads through the Choose File button
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Add a function to clear the current selection
  const clearSelection = () => {
    setFile(null);
    setOriginalModelData(null);
    setParameterizedModelData(null);
    setError(null);
    setCurrentStep(STEPS.UPLOAD);
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // For direct rendering without server processing:
      if (file.type.includes('gltf') || file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        console.log("Processing GLTF/GLB file locally");
        
        // Create a data URL from the file for direct rendering
        const reader = new FileReader();
        
        // Create a promise to handle the FileReader async operation
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
        
        console.log("File read as data URL, length:", dataUrl.length);
        
        // Set the original model data directly for the viewer
        setOriginalModelData({
          fileType: file.name.endsWith('.glb') ? 'glb' : 'gltf',
          fileData: dataUrl,
          meshes: [] // Empty for direct file rendering
        });
        
        debugModelData("Original model data (direct file)", {
          fileType: file.name.endsWith('.glb') ? 'glb' : 'gltf', 
          fileData: dataUrl.substring(0, 50) + "..."
        });
        
        setCurrentStep(STEPS.PARAMETERS);
        return;
      }
      
      // For server processing (if still needed):
      const formData = new FormData();
      formData.append('file', file);
      
      console.log("Sending file to server for processing:", file.name);
      
      // Upload the file for processing
      const response = await fetch('/api/uploadModel', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setUploadedData(data);
      
      // Set the original model data for the viewer
      setOriginalModelData({
        meshes: data.meshes || []
      });
      
      debugModelData("Original model data (server processed)", {
        meshes: data.meshes || []
      });
      
      setCurrentStep(STEPS.PARAMETERS);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err instanceof Error ? err.message : 'File upload failed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle analysis of the component
  const handleAnalyzeComponent = async () => {
    if (!file) {
      setError('No file available for analysis');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('componentType', componentType);
      
      // Send the file for component analysis
      const response = await fetch('/api/analyzeComponent', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update parameters with extracted values
      setParameters(data.parameters || {});
      
      // Update component type if recognized
      if (data.componentType) {
        setComponentType(data.componentType);
      }
      
    } catch (err) {
      console.error("Error analyzing component:", err);
      setError(err instanceof Error ? err.message : 'Component analysis failed');
      
      // If analysis fails, pre-fill with default values
      const template = getComponentTemplate(componentType);
      if (template) {
        const defaultParams: ParameterData = {};
        template.parameterDefinitions.forEach(param => {
          defaultParams[param.name] = param.defaultValue;
        });
        setParameters(defaultParams);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle parameter change
  const handleParameterChange = (name: string, value: number) => {
    setParameters(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle component type change
  const handleComponentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setComponentType(newType);
    
    // Reset parameters to default values for the new component type
    const template = getComponentTemplate(newType);
    if (template) {
      const defaultParams: ParameterData = {};
      template.parameterDefinitions.forEach(param => {
        defaultParams[param.name] = param.defaultValue;
      });
      setParameters(defaultParams);
    }
  };
  // Generate preview based on parameters
  const handleGeneratePreview = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      debugStep('Starting preview generation');
      
      // Get component template
      const template = getComponentTemplate(componentType);
      if (!template) {
        throw new Error(`No template found for component type: ${componentType}`);
      }
      
      debugStep(`Using template for ${componentType}`);
      
      // Format parameters for GHX generation
      const formattedParams: ParameterData = { ...parameters };
      
      // Generate GHX content from template and parameters
      debugStep('Generating GHX from template', formattedParams);
      const ghxContent = createGHXFromTemplate(template, formattedParams);
      
      // Validate GHX before sending
      if (!validateAndLogGHX(ghxContent)) {
        throw new Error('GHX validation failed');
      }
      
      // Send to Rhino Compute
      debugStep('Sending to Rhino Compute API');
      const response = await fetch('/api/computeGHX', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ghx: ghxContent,
          parameters: formattedParams
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      console.log('[DEBUG] Parameterized model data:', result);
      console.log('[DEBUG] Number of meshes:', result.meshes?.length || 0);
      
      // Set the parameterized model data for display
      setParameterizedModelData({
        fileType: 'mesh',
        meshes: result.meshes || []
      });
      
      setCurrentStep(STEPS.PREVIEW);
      
    } catch (err) {
      console.error('❌ Error generating preview:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate preview');
    } finally {
      setIsProcessing(false);
    }
  };
  // Handle component submission
  const handleSubmitComponent = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Get the current template
      const template = getComponentTemplate(componentType);
      if (!template) {
        throw new Error(`Invalid component type: ${componentType}`);
      }
      
      // Format parameters for submission
      const submissionParams: Record<string, number> = {};
      template.parameterDefinitions.forEach(param => {
        submissionParams[param.name] = parameters[param.name] !== undefined 
          ? Number(parameters[param.name]) 
          : param.defaultValue;
      });
      
      // Create request body
      const requestBody = {
        componentType,
        parameters: submissionParams,
      };
      
      // Submit the component
      const response = await fetch('/api/submitComponent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Submission failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Show success message
      alert('Component successfully submitted!');
      
      // Reset the form
      setFile(null);
      setUploadedData(null);
      setOriginalModelData(null);
      setParameterizedModelData(null);
      setParameters({});
      setCurrentStep(STEPS.UPLOAD);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (err) {
      console.error("Error submitting component:", err);
      setError(err instanceof Error ? err.message : 'Component submission failed');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const runDiagnostics = async () => {
    try {
      setIsProcessing(true);
      
      // 1. Test HelloWorld.ghx works
      console.log('🔍 Testing HelloWorld.ghx connection...');
      const helloTest = await fetch('/api/computeGHX/testWithHelloWorld');
      const helloResult = await helloTest.json();
      
      if (!helloResult.success) {
        console.error('❌ HelloWorld test failed:', helloResult);
        setError('Connection to Rhino Compute failed. Please check the server.');
        return;
      }
      
      console.log('✅ HelloWorld test succeeded:', helloResult);
      
      // 2. Diagnose the current GHX file
      if (!file) {
        setError('No file uploaded to diagnose');
        return;
      }
      
      // Read the file content
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          // Get base64 content
          const base64Content = event.target?.result?.toString().split(',')[1];
          if (!base64Content) {
            throw new Error('Failed to read file content');
          }
          
          // Send to diagnose endpoint
          const diagResponse = await fetch('/api/computeGHX/diagnose', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ghx: base64Content })
          });
          
          const diagnosis = await diagResponse.json();
          console.log('📊 GHX Diagnosis:', diagnosis);
          
          if (diagnosis.success) {
            // Extract parameters from diagnosis
            const diagParams = diagnosis.diagnostics.parameters;
            
            // Use the same parameters object you already have
            // This should be the variable you use in your handleGeneratePreview function
            const currentParams = parameters || {};
            
            // Compare parameters
            const issues: string[] = [];
            
            // Check for parameter name matches
            const diagParamNames = diagParams.map((p: {name: string}) => p.name);
            const ourParamNames = Object.keys(currentParams);
            
            const missingParams = diagParamNames.filter((name: string) => !ourParamNames.includes(name));
            const extraParams = ourParamNames.filter(name => !diagParamNames.includes(name));
            
            if (missingParams.length > 0) {
              issues.push(`Missing parameters: ${missingParams.join(', ')}`);
            }
            
            if (extraParams.length > 0) {
              issues.push(`Extra parameters: ${extraParams.join(', ')}`);
            }
            
            // Display results
            if (issues.length > 0) {
              setError(`GHX Diagnosis found issues: \n${issues.join('\n')}`);
            } else {
              setError(null);
              alert(`Diagnosis complete. Found ${diagParams.length} parameters, all names match!`);
            }
          } else {
            setError(`GHX Diagnosis failed: ${diagnosis.error}`);
          }
        } catch (err) {
          console.error('❌ Error in file reading:', err);
          setError(err instanceof Error ? err.message : 'Failed to process file');
        } finally {
          setIsProcessing(false);
        }
      };
      
      reader.onerror = () => {
        setError('Failed to read file');
        setIsProcessing(false);
      };
      
      reader.readAsDataURL(file);
      
    } catch (err) {
      console.error('❌ Diagnostic error:', err);
      setError(err instanceof Error ? err.message : 'Failed to run diagnostics');
      setIsProcessing(false);
    }
  };
  
  const verifyGHXStructure = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Content = event.target?.result?.toString().split(',')[1];
        if (!base64Content) {
          throw new Error('Failed to read file content');
        }
        
        const response = await fetch('/api/computeGHX/verifyGHXStructure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ghx: base64Content })
        });
        
        const result = await response.json();
        console.log('GHX Structure Analysis:', result);
        
        if (result.success) {
          alert(`GHX Analysis: \n` +
            `- File size: ${result.analysis.fileSize} bytes\n` +
            `- Parameter inputs found: ${result.analysis.paramInputCount}\n` +
            `- Has Python code: ${result.analysis.pythonCodePresent ? 'Yes' : 'No'}\n` +
            `- Structure valid: ${result.analysis.hasArchiveTag && result.analysis.hasGrasshopperRefs ? 'Yes' : 'No'}`
          );
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error verifying GHX:', err);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const testRhinoComputeConnection = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Use a simple fetch to test connection
      const response = await fetch('/api/computeGHX/testConnection', {
        method: 'GET'
      });
      
      const result = await response.json();
      console.log('Compute Connection Test:', result);
      
      if (result.success) {
        alert(`✅ Rhino Compute is accessible!\nURL: ${result.url}\nResponse Time: ${result.responseTime}ms`);
      } else {
        setError(`❌ Rhino Compute connection failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Connection test error:', err);
      setError(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const testWithHelloWorld = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const response = await fetch('/api/computeGHX/testWithHelloWorld');
      const result = await response.json();
      
      if (result.success) {
        alert('✅ HelloWorld test succeeded! Rhino Compute is working correctly.');
      } else {
        setError(`❌ HelloWorld test failed: ${result.error || 'Unknown error'}`);
      }
      
      console.log('HelloWorld test result:', result);
    } catch (err) {
      setError(`Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const debugGHX = async () => {
    try {
      setIsProcessing(true);
      
      // Get component template
      const template = getComponentTemplate(componentType);
      if (!template) {
        throw new Error(`No template found for component type: ${componentType}`);
      }
      
      // Generate GHX content from template and parameters
      const ghxContent = createGHXFromTemplate(template, parameters);
      
      // Send to debug endpoint
      const response = await fetch('/api/computeGHX/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ghx: ghxContent })
      });
      
      const result = await response.json();
      console.log('GHX Debug Results:', result);
      
      alert(`GHX Analysis Complete:\n${JSON.stringify(result.analysis, null, 2)}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to debug GHX');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Component Uploader</h1>
      
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h2 className="font-bold text-blue-700">How this works:</h2>
        <ol className="list-decimal ml-5 mt-2 space-y-1 text-blue-800">
          <li>Upload a 3D model (glTF, GLB, etc.) to view it in the viewer</li>
          <li>Select the component type that best matches your model</li>
          <li>Adjust parameters to create a similar component in Grasshopper</li>
          <li>Generate a preview of the parametric version using Rhino Compute</li>
        </ol>
      </div>
      
      {/* Step Navigation */}
      <div className="flex border-b">
        {Object.entries(STEPS).map(([key, value]) => (
          <div 
            key={key}
            className={`px-4 py-2 cursor-pointer border-b-2 ${
              currentStep === value 
                ? 'border-blue-500 text-blue-500 font-bold' 
                : 'border-transparent hover:text-blue-500'
            }`}
            onClick={() => currentStep >= value && setCurrentStep(value)}
          >
            {value}. {key}
          </div>
        ))}
      </div>
      
      {/* Upload Step */}
      {currentStep === STEPS.UPLOAD && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-4">1. Upload Component</h2>
          
          <div className="mb-4">
            <p className="text-gray-700">
              Upload a 3D model file to start the process. We'll display it in the viewer
              and use it as a reference for generating a parametric version.
            </p>
          </div>
          
          <div className="flex flex-col space-y-4">
            <label className="flex items-center space-x-2">
              <span>Component Type:</span>
              <select 
                value={componentType}
                onChange={handleComponentTypeChange}
                className="border p-2 rounded"
              >
                <option value="fork">Fork</option>
                <option value="handlebar">Handlebar</option>
              </select>
            </label>
            
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".gltf,.glb,.obj,.stl"
                className="hidden" // Hide the actual input
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Choose File
              </button>
              {file && (
                <span className="text-gray-700">
                  {file.name} ({Math.round(file.size / 1024)} KB)
                </span>
              )}
            </div>
            
            {file && (
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep(STEPS.PARAMETERS)}
                  disabled={!originalModelData}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  Continue to Parameters
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Parameter Step */}
      {currentStep === STEPS.PARAMETERS && parameters && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-4">2. Configure Parameters</h2>
          
          <div className="mb-4">
            <p className="text-gray-700">
              Adjust the parameters below to customize your {componentType}. 
              These parameters will be used to generate a parametric 3D model.
            </p>
          </div>
          
          <div className="bg-white p-4 rounded border mb-4">
            {Object.entries(parameters).map(([key, value]) => (
              <div key={key} className="mb-4">
                <label className="block text-sm font-medium mb-1">{key}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={getMinValue(key, componentType)}
                    max={getMaxValue(key, componentType)}
                    value={value}
                    onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
                    className="flex-grow"
                  />
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleParameterChange(key, parseFloat(e.target.value))}
                    className="w-20 border rounded p-1"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <h3 className="font-bold mb-2">Original Model</h3>
            <div className="border p-4 rounded bg-gray-50">
              {originalModelData ? (
                <Viewer3D 
                  modelData={{
                    fileType: originalModelData.fileType as 'gltf' | 'glb',
                    fileData: originalModelData.fileData || '',
                    meshes: originalModelData.meshes || []
                  }}
                  title="Original Model"
                />
              ) : (
                <div className="text-center p-8 text-gray-500">
                  No model data available
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(STEPS.UPLOAD)}
              className="px-4 py-2 text-blue-500 border border-blue-500 rounded hover:bg-blue-50"
            >
              ← Back to Upload
            </button>
            
            <button
              type="button"
              onClick={handleGeneratePreview}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Generate Preview →'}
            </button>
          </div>
        </div>
      )}
      
      {/* Preview Step */}
      {currentStep === STEPS.PREVIEW && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-4">3. Component Preview</h2>
          
          <div className="mb-4">
            <p className="text-gray-700">
              Below you can see both your original model and the parametrically generated version.
              You can adjust parameters and regenerate, or submit the component.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 border p-4 rounded bg-gray-50">
              <h3 className="font-bold">Original Model</h3>
              <div className="h-[400px] w-full">
                <Viewer3D 
                  modelData={originalModelData || {
                    fileType: 'gltf',
                    fileData: '',
                    meshes: []
                  }}
                  title="Original Model" 
                />
              </div>
            </div>
            
            <div className="flex-1 border p-4 rounded bg-gray-50">
              <h3 className="font-bold">Generated Model</h3>
              <div className="h-[400px] w-full">
                <Viewer3D 
                  modelData={parameterizedModelData || {
                    fileType: 'gltf',
                    fileData: '',
                    meshes: []
                  }}
                  title="Generated Model" 
                />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <button
              type="button"
              onClick={() => setCurrentStep(STEPS.PARAMETERS)}
              className="px-4 py-2 text-blue-500 border border-blue-500 rounded hover:bg-blue-50"
            >
              ← Back to Parameters
            </button>
            
            <button
              type="button"
              onClick={handleSubmitComponent}
              disabled={isProcessing}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Submit Component'}
            </button>
          </div>
        </div>
      )}
      
      {/* Diagnostic Buttons - Group them in a separate section */}
      <div className="mt-8 pt-4 border-t">
        <h3 className="font-bold mb-2">Diagnostics & Testing</h3>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runDiagnostics}
            disabled={!file || isProcessing}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
          >
            Diagnose GHX Issues
          </button>
          
          <button
            type="button"
            onClick={verifyGHXStructure}
            disabled={!file || isProcessing}
            className="px-4 py-2 bg-purple-500 text-white rounded disabled:opacity-50"
          >
            Verify GHX Structure
          </button>
          
          <button
            type="button"
            onClick={testRhinoComputeConnection}
            className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
          >
            Test Compute Connection
          </button>
          
          <button
            type="button"
            onClick={testWithHelloWorld}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Test HelloWorld
          </button>
          
          <button
            type="button"
            onClick={debugGHX}
            className="px-4 py-2 bg-yellow-500 text-white rounded"
          >
            Debug GHX Structure
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      )}
    </div>
  );
}