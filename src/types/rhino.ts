/**
 * Interface for Rhino Compute API response
 */
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
        data: string | number;  // Data can be either string or number
      }>;
    };
  }>;
} 