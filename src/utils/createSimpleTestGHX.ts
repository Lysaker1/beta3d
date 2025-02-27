import fs from 'fs';
import path from 'path';

export function createSimpleTestGHX() {
  // Create a minimal GHX with just a Number Slider and a Panel
  const simpleGHX = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<Archive name="Root">
  <!-- Simplified GHX with just a number slider and panel -->
  <!-- Only basic structure -->
  <items count="1">
    <item name="ArchiveVersion" type_name="gh_version" type_code="80">
      <Major>0</Major>
      <Minor>2</Minor>
      <Revision>2</Revision>
    </item>
  </items>
  <chunks count="2">
    <chunk name="Definition">
      <!-- Add a number slider -->
      <!-- Add a panel to display the value -->
    </chunk>
  </chunks>
</Archive>`;

  // Save to public/debug folder
  const debugDir = path.join(process.cwd(), 'public', 'debug');
  if (!fs.existsSync(debugDir)) {
    fs.mkdirSync(debugDir, { recursive: true });
  }
  
  const filePath = path.join(debugDir, 'simple_test.ghx');
  fs.writeFileSync(filePath, simpleGHX);
  
  return filePath;
} 