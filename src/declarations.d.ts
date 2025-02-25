/// <reference types="@react-three/fiber" />
import { ThreeElements } from '@react-three/fiber';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: ThreeElements['ambientLight'];
      pointLight: ThreeElements['pointLight'];
      mesh: ThreeElements['mesh'];
      boxGeometry: ThreeElements['boxGeometry'];
      meshStandardMaterial: ThreeElements['meshStandardMaterial'];
      primitive: any;
      gridHelper: ThreeElements['gridHelper'];
      axesHelper: ThreeElements['axesHelper'];
    }
  }
}
