import { Object3DNode } from '@react-three/fiber';
import { Mesh, BoxGeometry, MeshStandardMaterial } from 'three';

declare module '@react-three/fiber' {
  interface ThreeElements {
    mesh: Object3DNode<Mesh, typeof Mesh>;
    boxGeometry: Object3DNode<BoxGeometry, typeof BoxGeometry>;
    meshStandardMaterial: Object3DNode<MeshStandardMaterial, typeof MeshStandardMaterial>;
    ambientLight: { intensity?: number };
    pointLight: { position?: [number, number, number] };
    primitive: { object: any };
    gridHelper: { args?: [number, number] };
    axesHelper: { args?: [number] };
  }
} 