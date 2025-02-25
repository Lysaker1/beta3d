interface GHXComponent {
  guid: string;
  name: string;
  nickname?: string;
  type: 'Number' | 'Integer' | 'Python' | 'Bake';
  position: { x: number; y: number };
  inputs?: string[];
  code?: string;
}

export function createCompleteGHX(components: GHXComponent[]): string {
  const xmlTemplate = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<Archive name="Root">
  <items count="${components.length}">
    ${components.map(createComponentXML).join('\n')}
  </items>
  <chunks count="1">
    <chunk name="Definition">
      <items count="${components.length}">
        ${components.map(createComponentXML).join('\n')}
      </items>
    </chunk>
  </chunks>
</Archive>`;

  return Buffer.from(xmlTemplate).toString('base64');
}

function createComponentXML(component: GHXComponent): string {
  switch (component.type) {
    case 'Number':
    case 'Integer':
      return `
        <item name="${component.name}" type="Grasshopper.Kernel.Special.GH${component.type}Slider">
          <InstanceGuid>${component.guid}</InstanceGuid>
          <Name>${component.name}</Name>
          <NickName>${component.nickname || component.name}</NickName>
          <Description>Input parameter</Description>
          <Bounds>
            <X>${component.position.x}</X>
            <Y>${component.position.y}</Y>
          </Bounds>
          <MinValue>0</MinValue>
          <MaxValue>100</MaxValue>
        </item>`;

    case 'Python':
      return `
        <item name="Python" type="Grasshopper.Kernel.Components.GhPython">
          <InstanceGuid>${component.guid}</InstanceGuid>
          <Name>Python Script</Name>
          <Source><![CDATA[${component.code}]]></Source>
          <Bounds>
            <X>${component.position.x}</X>
            <Y>${component.position.y}</Y>
          </Bounds>
          ${component.inputs?.map(input => `<Input name="${input}" />`).join('\n')}
        </item>`;

    case 'Bake':
      return `
        <item name="Bake" type="Grasshopper.Kernel.Components.GH_Bake">
          <InstanceGuid>${component.guid}</InstanceGuid>
          <Name>Bake</Name>
          <NickName>Bake</NickName>
          <Bounds>
            <X>${component.position.x}</X>
            <Y>${component.position.y}</Y>
          </Bounds>
        </item>`;
  }
} 