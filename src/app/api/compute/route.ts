export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import rhino3dm from 'rhino3dm'

const RHINO_COMPUTE_URL = process.env.RHINO_COMPUTE_URL
const RHINO_COMPUTE_KEY = process.env.RHINO_COMPUTE_KEY

// read the base64 GH def from disk
function getGrasshopperDefinition(): string {
  console.log('🔍 [getGrasshopperDefinition] Reading Grasshopper definition file...')
  const filePath = path.join(process.cwd(), 'public', 'hops1_base64_v10.txt')
  if (!fs.existsSync(filePath)) {
    console.error('❌ [getGrasshopperDefinition] Grasshopper definition file not found at:', filePath)
    throw new Error('Grasshopper definition file not found')
  }
  const definition = fs.readFileSync(filePath, 'utf-8').trim()
  console.log('✅ [getGrasshopperDefinition] Successfully loaded Grasshopper definition')
  console.log('📊 [getGrasshopperDefinition] Definition length:', definition.length)
  return definition
}

async function initRhino() {
  console.log('🚀 [initRhino] Starting Rhino3dm initialization...')
  const rhino3dmAny = rhino3dm as any
  console.log('⚙️ [initRhino] Configuring WASM loader...')
  
  // Build a local file path to the WASM file
  const wasmPath = path.join(process.cwd(), 'public', 'rhino3dm.wasm')
  console.log('📍 [initRhino] WASM file path:', wasmPath)

  const rhino = await rhino3dmAny({
    locateFile: (file: string): string => {
      // Always return the full local path to your WASM file.
      return wasmPath
    }
  })

  console.log('✅ [initRhino] Rhino3dm initialized successfully')
  return rhino
}

export async function POST(request: Request) {
  console.log('📥 [POST] Incoming request received')
  try {
    const body = await request.json()
    console.log('📦 [POST] Request body:', JSON.stringify(body, null, 2))

    if (!body.radius || !body.count || !body.length) {
      console.error('❌ [POST] Missing required parameters')
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    console.log('✅ [POST] All required parameters present')
    const { radius, count, length } = body
    console.log(`📊 [POST] Parameters extracted - radius: ${radius}, count: ${count}, length: ${length}`)

    console.log('📄 [POST] Loading Grasshopper definition...')
    const base64Definition = getGrasshopperDefinition()
    console.log('✅ [POST] Grasshopper definition loaded successfully')
    
    console.log('🌐 [POST] Preparing request to Rhino.Compute...')
    const requestBody = {
      algo: base64Definition,
      pointer: null,
      values: [
        { ParamName: "Radius", InnerTree: { "0": [{ "type": "System.Double", "data": radius }] } },
        { ParamName: "Count", InnerTree: { "0": [{ "type": "System.Int32", "data": count }] } },
        { ParamName: "Length", InnerTree: { "0": [{ "type": "System.Double", "data": length }] } }
      ]
    }
    console.log('📤 [POST] Request payload:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${RHINO_COMPUTE_URL}/grasshopper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'RhinoComputeKey': RHINO_COMPUTE_KEY
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📥 [POST] Rhino.Compute response received')
    console.log('ℹ️ [POST] Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [POST] Rhino.Compute error response:', errorText)
      console.error('❌ [POST] Response status:', response.status)
      console.error('❌ [POST] Response statusText:', response.statusText)
      throw new Error(`Rhino.Compute error: ${response.status} ${response.statusText}`)
    }

    const computeResponse = await response.json();
    console.log('📥 [POST] Rhino.Compute response received', computeResponse);

    // Optionally validate that the OutputBake parameter exists:
    const outputBakeEntry = computeResponse.values?.find(
      (val: any) => val.ParamName === 'OutputBake'
    );
    if (!outputBakeEntry) {
      return NextResponse.json({ error: 'Missing baked output.' }, { status: 500 });
    }

    // Instead of constructing a simplified object, return the full computeResponse:
    return NextResponse.json(computeResponse);
  } catch (error) {
    console.error('❌ [POST] Compute error:', error)
    console.error('❌ [POST] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Failed to process geometry', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}