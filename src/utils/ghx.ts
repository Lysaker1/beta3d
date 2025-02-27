/**
 * Utility functions for working with Grasshopper (GHX) files
 */

interface GHXParameter {
  name: string;
  type: 'Number' | 'Integer';
  value: number;
  min?: number;
  max?: number;
}

interface GHXDefinitionOptions {
  pythonCode: string;
  parameters: GHXParameter[];
  outputName?: string;
}

/**
 * Creates a GHX template with embedded RhinoPython code and parameter inputs
 * @param pythonCode - The RhinoPython code to embed
 * @param parameters - Parameter definitions for creating input sliders
 * @returns Base64 encoded GHX content
 */
export function createGHXDefinition({ 
  pythonCode, 
  parameters,
  outputName = 'OutputBake' 
}: GHXDefinitionOptions): string {
  // Normalize Python code
  const normalizedCode = pythonCode.trim().replace(/\r\n/g, '\n');
  
  // Generate unique GUIDs for components
  const scriptGuid = '110d0a9d-3ef9-4159-9200-66b7c5228b6e';
  const bakeGuid = '220d0a9d-3ef9-4159-9200-66b7c5228b6e';
  
  // Create parameter nodes with proper positioning
  const parameterNodes = parameters.map((param, index) => {
    const paramGuid = `${scriptGuid}-param-${index}`;
    const xPos = index * 150; // Space parameters horizontally
    
    return `
      <item name="${param.name}" type="Grasshopper.Kernel.Special.Gh${param.type}Slider">
        <InstanceGuid>${paramGuid}</InstanceGuid>
        <Name>${param.name}</Name>
        <NickName>${param.name}</NickName>
        <Description>Parameter for ${param.name}</Description>
        <ReferenceCount>1</ReferenceCount>
        <Exposure>1</Exposure>
        <Value>${param.value}</Value>
        <MinValue>${param.min ?? 0}</MinValue>
        <MaxValue>${param.max ?? param.value * 2}</MaxValue>
        <Bounds>
          <X>${xPos}</X>
          <Y>0</Y>
        </Bounds>
        <Connection>
          <Source guid="${paramGuid}" />
          <Destination guid="${scriptGuid}" param="${param.name}" />
        </Connection>
      </item>`;
  }).join('\n');

  // Calculate script component position
  const scriptX = parameters.length * 150;
  const scriptY = 100;

  // Build the complete GHX content with Python script and Bake component
  const ghxContent = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<Archive>
  <items>
    <item name="ArchiveVersion" type="System.String">1.0</item>
    <item name="Grasshopper">
      <chunks count="2">
        <chunk name="Definition">
          <items count="2">
            <item name="Python" type="Grasshopper.Kernel.Special.GhPython.GhPythonScript,GrasshopperPython" guid="${scriptGuid}">
              <InstanceGuid>${scriptGuid}</InstanceGuid>
              <Name>Python Script</Name>
              <NickName>Python</NickName>
              <Description>A Python script component</Description>
              <ReferenceCount>0</ReferenceCount>
              <Exposure>2</Exposure>
              <Source>script</Source>
              <Bounds>
                <X>${scriptX}</X>
                <Y>${scriptY}</Y>
              </Bounds>
              <Script><![CDATA[${normalizedCode}]]></Script>
              <OutputNames>${outputName}</OutputNames>
            </item>
            <item name="Bake" type="Grasshopper.Kernel.Components.GH_Bake" guid="${bakeGuid}">
              <InstanceGuid>${bakeGuid}</InstanceGuid>
              <Name>Bake</Name>
              <NickName>Bake</NickName>
              <Description>Bakes geometry</Description>
              <ReferenceCount>0</ReferenceCount>
              <Bounds>
                <X>${scriptX}</X>
                <Y>${scriptY + 100}</Y>
              </Bounds>
              <Connection>
                <Source guid="${scriptGuid}" param="${outputName}" />
                <Destination guid="${bakeGuid}" param="Geometry" />
              </Connection>
            </item>
          </items>
        </chunk>
        <chunk name="ParameterData">
          <items count="${parameters.length}">
            ${parameterNodes}
          </items>
        </chunk>
      </chunks>
    </item>
  </items>
</Archive>`;

  return Buffer.from(ghxContent, 'utf-8').toString('base64');
}

/**
 * Extracts RhinoPython code from a base64 encoded GHX file
 * @param base64GHX - Base64 encoded GHX content
 * @returns The embedded RhinoPython code
 */
export function extractPythonCode(base64GHX: string): string {
  console.log('🔍 [extractPythonCode] Starting Python code extraction');
  console.log('📊 [extractPythonCode] Input base64 length:', base64GHX.length);
  
  console.log('🔄 [extractPythonCode] Decoding base64 content');
  const ghxContent = Buffer.from(base64GHX, 'base64').toString('utf-8');
  console.log('✅ [extractPythonCode] Successfully decoded base64 content');
  
  // Extract code between CDATA tags
  console.log('🔍 [extractPythonCode] Searching for CDATA section');
  const match = ghxContent.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  if (!match) {
    console.error('❌ [extractPythonCode] No CDATA section found');
    throw new Error('No Python code found in GHX file');
  }
  
  const extractedCode = match[1].trim();
  console.log('✨ [extractPythonCode] Successfully extracted Python code');
  console.log('📊 [extractPythonCode] Extracted code length:', extractedCode.length);
  
  return extractedCode;
}

/**
 * Validates that a string is a valid base64 encoded GHX file
 * @param base64GHX - String to validate
 * @returns boolean indicating if valid
 */
export function isValidGHX(base64GHX: string): boolean {
  try {
    const decoded = Buffer.from(base64GHX, 'base64').toString('utf-8');
    
    // Check for required XML structure
    const hasValidStructure = 
      decoded.includes('<?xml version="1.0"') &&
      decoded.includes('<Archive>') &&
      decoded.includes('<chunks count="2"') &&
      decoded.includes('<Script>') &&
      decoded.includes('<![CDATA[') &&
      decoded.includes(']]>') &&
      decoded.includes('<chunk name="ParameterData">')
    
    // Check for valid base64 encoding
    const isValidBase64 = /^[A-Za-z0-9+/=]+$/.test(base64GHX);
    
    return hasValidStructure && isValidBase64;
  } catch (error) {
    return false;
  }
}

export function validateGHXContent(ghxContent: string): boolean {
  try {
    // Determine if content is base64-encoded
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(ghxContent.trim());
    
    // If base64, decode first
    const decodedContent = isBase64 
      ? Buffer.from(ghxContent, 'base64').toString('utf-8') 
      : ghxContent;
    
    // Check for essential GHX elements
    const requiredElements = [
      '<?xml version="1.0"',
      '<Archive',
      '<item name="ArchiveVersion"',
      'grasshopper'
    ];
    
    return requiredElements.every(element => 
      decodedContent.toLowerCase().includes(element.toLowerCase())
    );
  } catch (error) {
    console.error('🔍 [validateGHXContent] Validation error:', error);
    return false;
  }
}