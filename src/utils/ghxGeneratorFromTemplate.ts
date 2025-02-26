// src/utils/ghxGeneratorFromTemplate.ts
import { v4 as uuidv4 } from 'uuid';
import { ComponentTemplate } from './ghx/componentTemplates';

export function createGHXFromTemplate(template: ComponentTemplate, parameters: Record<string, number>): string {
  console.log('🔄 [createGHXFromTemplate] Creating GHX from template:', template.name);
  console.log('📝 [createGHXFromTemplate] With parameters:', parameters);
  
  // Prepare parameters for the GHX definition
  const parameterList = template.parameterDefinitions.map(paramDef => {
    return {
      name: paramDef.name,
      value: parameters[paramDef.name] !== undefined ? parameters[paramDef.name] : paramDef.defaultValue,
      type: Number.isInteger(parameters[paramDef.name]) ? 'System.Int32' : 'System.Double'
    };
  });
  
  console.log('📦 [createGHXFromTemplate] Converted parameters:', parameterList);
  
  // Create the GHX definition in the required format
  return createGHXDefinition(template, parameterList);
}

function createGHXDefinition(template: ComponentTemplate, parameters: any[]): string {
  console.log('🔄 [createGHXDefinition] Starting GHX definition creation');
  
  // Generate unique GUIDs for components
  const documentId = uuidv4();
  const scriptGuid = uuidv4();
  const bakeGuid = uuidv4();
  
  console.log('🔑 [createGHXDefinition] Generated GUIDs - Document:', documentId, 'Script:', scriptGuid, 'Bake:', bakeGuid);
  
  // Start building the XML structure following HelloWorld.ghx format
  let ghxXml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<Archive name="Root">
  <!--Grasshopper archive-->
  <!--Grasshopper and GH_IO.dll are copyrighted by Robert McNeel & Associates-->
  <!--Archive generated by GH_IO.dll file utility library {0.2.0002}-->
  <items count="1">
    <item name="ArchiveVersion" type_name="gh_version" type_code="80">
      <Major>0</Major>
      <Minor>2</Minor>
      <Revision>2</Revision>
    </item>
  </items>
  <chunks count="2">
    <chunk name="Definition">
      <items count="1">
        <item name="plugin_version" type_name="gh_version" type_code="80">
          <Major>1</Major>
          <Minor>0</Minor>
          <Revision>8</Revision>
        </item>
      </items>
      <chunks count="5">
        <chunk name="DocumentHeader">
          <items count="5">
            <item name="DocumentID" type_name="gh_guid" type_code="9">${documentId}</item>
            <item name="Preview" type_name="gh_string" type_code="10">Shaded</item>
            <item name="PreviewMeshType" type_name="gh_int32" type_code="3">1</item>
            <item name="PreviewNormal" type_name="gh_drawing_color" type_code="36">
              <ARGB>100;150;0;0</ARGB>
            </item>
            <item name="PreviewSelected" type_name="gh_drawing_color" type_code="36">
              <ARGB>100;0;150;0</ARGB>
            </item>
          </items>
        </chunk>
        <chunk name="DefinitionProperties">
          <items count="4">
            <item name="Date" type_name="gh_date" type_code="8">${Date.now()}</item>
            <item name="Description" type_name="gh_string" type_code="10">${template.name} generated by Spinlio</item>
            <item name="KeepOpen" type_name="gh_bool" type_code="1">false</item>
            <item name="Name" type_name="gh_string" type_code="10">${template.name}.ghx</item>
          </items>
          <chunks count="3">
            <chunk name="Revisions">
              <items count="1">
                <item name="RevisionCount" type_name="gh_int32" type_code="3">0</item>
              </items>
            </chunk>
            <chunk name="Projection">
              <items count="2">
                <item name="Target" type_name="gh_drawing_point" type_code="30">
                  <X>-1367</X>
                  <Y>-125</Y>
                </item>
                <item name="Zoom" type_name="gh_single" type_code="5">1.4889727</item>
              </items>
            </chunk>
            <chunk name="Views">
              <items count="1">
                <item name="ViewCount" type_name="gh_int32" type_code="3">0</item>
              </items>
            </chunk>
          </chunks>
        </chunk>`;

  // Add parameter input nodes
  ghxXml += '<chunk name="DefinitionObjects">';
  ghxXml += '<items count="' + (parameters.length + 2) + '">'; // +2 for script and bake components
  
  // Generate parameter input components
  parameters.forEach((param, index) => {
    const paramGuid = uuidv4();
    const posX = index * 150;
    const posY = 100;
    
    ghxXml += `
    <item name="Object" type_name="gh_object" type_code="3">
      <GUID>${paramGuid}</GUID>
      <Name>Number</Name>
      <Attributes>
        <Bounds>
          <X>${posX}</X>
          <Y>${posY}</Y>
          <W>50</W>
          <H>20</H>
        </Bounds>
        <Pivot>
          <X>${posX + 25}</X>
          <Y>${posY + 10}</Y>
        </Pivot>
      </Attributes>
      <param_input index="0">
        <Name>${param.name}</Name>
        <Description>Parameter ${param.name}</Description>
        <Value>${param.value}</Value>
        <TypeHint>${param.type}</TypeHint>
        <Access>1</Access> <!-- 1 = item access -->
      </param_input>
    </item>`;
  });
  
  // Add Python script component
  const scriptPosX = parameters.length * 150 + 50;
  const scriptPosY = 100;
  
  ghxXml += `
  <item name="Object" type_name="gh_object" type_code="3">
    <GUID>${scriptGuid}</GUID>
    <Name>Python Script</Name>
    <Attributes>
      <Bounds>
        <X>${scriptPosX}</X>
        <Y>${scriptPosY}</Y>
        <W>100</W>
        <H>100</H>
      </Bounds>
      <Pivot>
        <X>${scriptPosX + 50}</X>
        <Y>${scriptPosY + 50}</Y>
      </Pivot>
    </Attributes>
    <param_input index="0">
      <Name>x</Name>
      <TypeHint>script</TypeHint>
      <Access>0</Access>
      <Data>
        <![CDATA[${template.pythonCode}]]>
      </Data>
    </param_input>`;
  
  // Add parameter connections to script
  parameters.forEach((param, index) => {
    ghxXml += `
    <param_input index="${index + 1}">
      <Name>${param.name}</Name>
      <TypeHint>double</TypeHint>
      <Access>2</Access> <!-- 2 = list access -->
    </param_input>`;
  });
  
  // Add script output
  ghxXml += `
    <param_output index="0">
      <Name>Out</Name>
      <Description>Script output</Description>
      <TypeHint>mesh</TypeHint>
    </param_output>
  </item>`;
  
  // Add Bake component
  const bakePosX = scriptPosX + 150;
  const bakePosY = 100;
  
  ghxXml += `
  <item name="Object" type_name="gh_object" type_code="3">
    <GUID>${bakeGuid}</GUID>
    <Name>Bake</Name>
    <Attributes>
      <Bounds>
        <X>${bakePosX}</X>
        <Y>${bakePosY}</Y>
        <W>80</W>
        <H>60</H>
      </Bounds>
      <Pivot>
        <X>${bakePosX + 40}</X>
        <Y>${bakePosY + 30}</Y>
      </Pivot>
    </Attributes>
    <param_input index="0">
      <Name>Data</Name>
      <Description>Data to bake</Description>
      <SourceCount>1</SourceCount>
      <Source index="0">${scriptGuid}</Source>
      <TypeHint>auto</TypeHint>
      <Access>2</Access>
    </param_input>
  </item>`;
  
  // Close items and chunks
  ghxXml += `
  </items>
  </chunk>
  <chunk name="DefinitionParametersList">
    <items count="0" />
  </chunk>
  </chunks>
  </chunk>
  <chunk name="Thumbnail">
    <items count="1">
      <item name="Thumbnail" type_name="gh_drawing_bitmap" type_code="37">
        <bitmap length="1000">
        <!-- Base64-encoded thumbnail would go here -->
        </bitmap>
      </item>
    </items>
  </chunk>
  </chunks>
</Archive>`;

  console.log('📄 [createGHXDefinition] Raw XML length:', ghxXml.length);
  console.log('📄 [createGHXDefinition] First 200 chars:', ghxXml.substring(0, 200));

  // Make sure we're encoding a valid XML string
  const encodedGhx = Buffer.from(ghxXml, 'utf-8').toString('base64');

  // Debug the decoded content
  const decodedCheck = Buffer.from(encodedGhx, 'base64').toString('utf-8');
  console.log('🔍 [createGHXDefinition] Decoded check (first 200 chars):', decodedCheck.substring(0, 200));

  console.log('✅ [createGHXDefinition] GHX created and encoded, length:', encodedGhx.length);
  return encodedGhx;
}