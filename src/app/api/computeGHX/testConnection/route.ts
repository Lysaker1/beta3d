import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rhinoComputeUrl = process.env.RHINO_COMPUTE_URL || 'http://13.53.137.42:80';
    const rhinoComputeKey = process.env.RHINO_COMPUTE_KEY || '';
    
    console.log('🔧 Testing connection to Rhino Compute:', rhinoComputeUrl);
    
    // Try both HEAD and GET methods since the server may not support HEAD
    let response;
    let method = 'GET'; // Start with GET instead of HEAD
    
    try {
      response = await fetch(`${rhinoComputeUrl}/system/version`, {
        method,
        headers: {
          ...(rhinoComputeKey ? { 'RhinoComputeKey': rhinoComputeKey } : {})
        }
      });
    } catch (err) {
      console.log('First attempt failed, trying plain endpoint');
      // If that fails, try just the base URL
      response = await fetch(rhinoComputeUrl, {
        method,
        headers: {
          ...(rhinoComputeKey ? { 'RhinoComputeKey': rhinoComputeKey } : {})
        }
      });
    }
    
    const responseData = await response.text();
    
    return NextResponse.json({
      success: response.ok,
      url: rhinoComputeUrl,
      status: response.status,
      responseData: responseData.substring(0, 100), // Show first 100 chars
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 