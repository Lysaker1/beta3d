// src/utils/componentTemplates.ts
export interface ParameterDefinition {
  name: string;
  displayName: string;
  description: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  parameterDefinitions: ParameterDefinition[];
  pythonCode: string;
}

// Fork component template
export const forkTemplate: ComponentTemplate = {
  id: 'fork',
  name: 'Bicycle Fork',
  description: 'Parametric bicycle fork component',
  parameterDefinitions: [
    {
      name: 'steerer_length',
      displayName: 'Steerer Length',
      description: 'Length of the steerer tube in mm',
      defaultValue: 150,
      min: 100,
      max: 300,
      step: 1
    },
    {
      name: 'steerer_diameter',
      displayName: 'Steerer Diameter',
      description: 'Diameter of the steerer tube in mm',
      defaultValue: 28.6,
      min: 25.4,
      max: 31.8,
      step: 0.1
    },
    {
      name: 'crown_width',
      displayName: 'Crown Width',
      description: 'Width of the fork crown in mm',
      defaultValue: 60,
      min: 40,
      max: 80,
      step: 1
    },
    {
      name: 'blade_length',
      displayName: 'Blade Length',
      description: 'Length of the fork blades in mm',
      defaultValue: 400,
      min: 300,
      max: 500,
      step: 1
    },
    {
      name: 'dropout_width',
      displayName: 'Dropout Width',
      description: 'Width between dropouts in mm',
      defaultValue: 100,
      min: 90,
      max: 120,
      step: 1
    },
    {
      name: 'rake',
      displayName: 'Rake',
      description: 'Fork rake/offset in mm',
      defaultValue: 45,
      min: 30,
      max: 60,
      step: 1
    }
  ],
  // Python code to generate the fork geometry
  pythonCode: `import Rhino.Geometry as rg
import scriptcontext as sc
import math

def create_fork(steerer_length, steerer_diameter, crown_width, blade_length, dropout_width, rake):
    # Convert all input parameters to floats for consistency
    steerer_length = float(steerer_length)
    steerer_diameter = float(steerer_diameter)
    crown_width = float(crown_width)
    blade_length = float(blade_length)
    dropout_width = float(dropout_width)
    rake = float(rake)
    
    # Create a new mesh
    mesh = rg.Mesh()
    
    # Steerer tube
    steerer_radius = steerer_diameter / 2
    tube = rg.Cylinder(
        rg.Circle(rg.Point3d(0, 0, 0), steerer_radius),
        steerer_length
    )
    steerer_mesh = rg.Mesh.CreateFromCylinder(tube, 12, 1)
    mesh.Append(steerer_mesh)
    
    # Crown
    crown_height = 20
    crown = rg.Box(
        rg.Plane.WorldXY,
        rg.Interval(-crown_width/2, crown_width/2),
        rg.Interval(-crown_height/2, crown_height/2),
        rg.Interval(-15, 15)
    )
    crown_mesh = rg.Mesh.CreateFromBox(crown, 2, 2, 2)
    crown_mesh.Translate(rg.Vector3d(0, 0, -crown_height/2))
    mesh.Append(crown_mesh)
    
    # Blades
    blade_radius = 12
    for side in [-1, 1]:
        # Start point at crown
        start = rg.Point3d(side * crown_width/2, 0, 0)
        # End point at dropout with rake
        end = rg.Point3d(side * dropout_width/2, blade_length, rake)
        
        # Create a line between start and end
        blade_line = rg.Line(start, end)
        
        # Create a pipe around the line
        blade_pipe = rg.Cylinder(
            rg.Circle(rg.Plane(start, rg.Vector3d(0,1,0)), blade_radius),
            blade_line.Length
        )
        blade_mesh = rg.Mesh.CreateFromCylinder(blade_pipe, 8, 1)
        
        # Rotate and translate to match the blade line
        angle = math.atan2(blade_line.Direction.Z, blade_line.Direction.Y)
        blade_mesh.Rotate(angle, rg.Vector3d(1,0,0), start)
        mesh.Append(blade_mesh)
    
    # Return the mesh
    return mesh

# Create the fork using the parameters
fork_mesh = create_fork(steerer_length, steerer_diameter, crown_width, blade_length, dropout_width, rake)

# Output the resulting mesh
a = fork_mesh`
};

// Handlebar component template
export const handlebarTemplate: ComponentTemplate = {
  id: 'handlebar',
  name: 'Bicycle Handlebar',
  description: 'Parametric bicycle handlebar component',
  parameterDefinitions: [
    {
      name: 'width',
      displayName: 'Width',
      description: 'Total width of the handlebar in mm',
      defaultValue: 440,
      min: 380,
      max: 480,
      step: 10
    },
    {
      name: 'rise',
      displayName: 'Rise',
      description: 'Vertical rise in mm',
      defaultValue: 20,
      min: 0,
      max: 60,
      step: 5
    },
    {
      name: 'reach',
      displayName: 'Reach',
      description: 'Horizontal reach in mm',
      defaultValue: 70,
      min: 50,
      max: 100,
      step: 5
    },
    {
      name: 'drop',
      displayName: 'Drop',
      description: 'Drop measurement in mm',
      defaultValue: 130,
      min: 100,
      max: 160,
      step: 5
    },
    {
      name: 'diameter',
      displayName: 'Tube Diameter',
      description: 'Diameter of the handlebar tube in mm',
      defaultValue: 31.8,
      min: 25.4,
      max: 35,
      step: 0.1
    }
  ],
  // Python code to generate the handlebar geometry
  pythonCode: `import Rhino.Geometry as rg
import scriptcontext as sc
import math

def create_handlebar(width, rise, reach, drop, diameter):
    # Convert all input parameters to floats for consistency
    width = float(width)
    rise = float(rise)
    reach = float(reach)
    drop = float(drop)
    diameter = float(diameter)
    
    # Create a new mesh
    mesh = rg.Mesh()
    
    # Center section (for stem clamp)
    center_length = 80
    center = rg.Cylinder(
        rg.Circle(rg.Point3d(0, 0, 0), diameter/2),
        center_length
    )
    center_mesh = rg.Mesh.CreateFromCylinder(center, 16, 1)
    center_mesh.Rotate(rg.Math.ToRadians(90), rg.Vector3d(0,0,1), rg.Point3d(0,0,0))
    center_mesh.Translate(rg.Vector3d(-center_length/2, 0, 0))
    mesh.Append(center_mesh)
    
    # Calculate dimensions
    half_width = width / 2
    bar_radius = diameter / 2
    
    # Side extensions
    extension_length = (half_width - center_length/2 - reach)
    
    for side in [-1, 1]:
        # Straight section
        start_x = side * center_length/2
        end_x = side * (half_width - reach)
        
        extension = rg.Cylinder(
            rg.Circle(rg.Point3d(start_x, 0, 0), bar_radius),
            extension_length
        )
        extension_mesh = rg.Mesh.CreateFromCylinder(extension, 16, 1)
        extension_mesh.Rotate(rg.Math.ToRadians(90), rg.Vector3d(0,0,1), rg.Point3d(start_x,0,0))
        extension_mesh.Translate(rg.Vector3d(side * extension_length/2, 0, 0))
        mesh.Append(extension_mesh)
        
        # Curved section for reach and drop
        curve_pts = []
        curve_pts.append(rg.Point3d(end_x, 0, 0))
        curve_pts.append(rg.Point3d(end_x + side * reach, 0, 0))
        curve_pts.append(rg.Point3d(end_x + side * reach, -drop, 0))
        
        curve = rg.NurbsCurve.Create(False, 3, curve_pts)
        curve_pipe = rg.Mesh.CreateFromCurvePipe(curve, bar_radius, 16, 1, 1)
        mesh.Append(curve_pipe)
        
        # Add rise if specified
        if rise > 0:
            rise_pipe = rg.Cylinder(
                rg.Circle(rg.Point3d(end_x, 0, 0), bar_radius),
                rise
            )
            rise_mesh = rg.Mesh.CreateFromCylinder(rise_pipe, 16, 1)
            rise_mesh.Translate(rg.Vector3d(0, 0, rise/2))
            mesh.Append(rise_mesh)
    
    # Return the mesh
    return mesh

# Create the handlebar using the parameters
handlebar_mesh = create_handlebar(width, rise, reach, drop, diameter)

# Output the resulting mesh
a = handlebar_mesh`
};

export function getComponentTemplate(componentType: string): ComponentTemplate | null {
  switch (componentType.toLowerCase()) {
    case 'fork':
      return forkTemplate;
    case 'handlebar':
      return handlebarTemplate;
    default:
      console.error(`Unknown component type: ${componentType}`);
      return null;
  }
}