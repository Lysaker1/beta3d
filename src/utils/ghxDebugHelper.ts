import fs from 'fs';
import path from 'path';

export async function saveDebugGHX(ghxContent: string, fileName: string = 'debug_ghx'): Promise<string> {
  try {
    // Ensure the debug directory exists
    const debugDir = path.join(process.cwd(), 'public', 'debug');
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    // Create timestamped filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullPath = path.join(debugDir, `${fileName}_${timestamp}.ghx`);
    
    // Save both the base64 and decoded versions
    const base64Path = `${fullPath}.b64`;
    fs.writeFileSync(base64Path, ghxContent);
    
    // Also save decoded version
    try {
      const decoded = Buffer.from(ghxContent, 'base64').toString('utf-8');
      fs.writeFileSync(fullPath, decoded);
      console.log(`✅ [saveDebugGHX] Saved decoded GHX to ${fullPath}`);
    } catch (decodeError) {
      console.error(`❌ [saveDebugGHX] Failed to decode GHX: ${decodeError}`);
    }
    
    console.log(`✅ [saveDebugGHX] Saved base64 GHX to ${base64Path}`);
    return fullPath;
  } catch (error) {
    console.error(`❌ [saveDebugGHX] Error saving debug GHX: ${error}`);
    return '';
  }
} 