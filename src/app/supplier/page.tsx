// src/app/supplier/upload/page.tsx
'use client';

import ComponentUploader from '@/components/ComponentUploader';

export default function SupplierUploadPage() {
  const runDiagnostics = () => {
    // Add diagnostic logic here
    console.log('Running diagnostics...');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Supplier Component Upload</h1>
      <ComponentUploader />
      
      <button 
        onClick={runDiagnostics} 
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Diagnose GHX Issues
      </button>
    </div>
  );
}