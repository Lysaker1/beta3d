export interface RhinoComputeResponse {
  modelunits: string;
  dataversion: number;
  algo: string;
  filename: string | null;
  pointer: string;
  cachesolve: boolean;
  values: Array<{
    ParamName: string;
    InnerTree: {
      [key: string]: Array<{
        type: string;
        data: string;
      }>;
    };
  }>;
}
