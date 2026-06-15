export interface User {
  username: string;
  role: string;
}

export interface DiagramResult {
  diagram_b64: string;
  analysis: {
    accident_summary: string;
    fault_assessment: {
      at_fault_vehicle_id: string;
      rationale: string;
    };
    involvement: Array<{
      id: string;
      role: string;
      description: string;
    }>;
  };
}
