import { Node, Edge } from '../components/NetworkGraph';

export interface NetworkTopology {
  nodes: Node[];
  edges: Edge[];
  metadata: {
    name: string;
    description: string;
    createdAt: string;
    version: string;
  };
}

export class TopologyManager {
  static exportTopology(nodes: Node[], edges: Edge[], name: string = 'Network Topology'): string {
    const topology: NetworkTopology = {
      nodes: nodes.map(node => ({
        ...node,
        status: 'default' // Reset status for export
      })),
      edges: edges.map(edge => ({
        ...edge,
        status: 'default' // Reset status for export
      })),
      metadata: {
        name,
        description: `Network topology with ${nodes.length} routers and ${edges.length} connections`,
        createdAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    return JSON.stringify(topology, null, 2);
  }

  static importTopology(jsonString: string): NetworkTopology {
    try {
      const topology = JSON.parse(jsonString) as NetworkTopology;
      
      // Validate structure
      if (!topology.nodes || !topology.edges || !Array.isArray(topology.nodes) || !Array.isArray(topology.edges)) {
        throw new Error('Invalid topology structure');
      }

      // Validate nodes
      topology.nodes.forEach((node, index) => {
        if (!node.id || typeof node.x !== 'number' || typeof node.y !== 'number' || !node.label) {
          throw new Error(`Invalid node at index ${index}`);
        }
        if (!node.status) node.status = 'default';
      });

      // Validate edges
      topology.edges.forEach((edge, index) => {
        if (!edge.id || !edge.source || !edge.target || typeof edge.weight !== 'number') {
          throw new Error(`Invalid edge at index ${index}`);
        }
        if (!edge.status) edge.status = 'default';
      });

      return topology;
    } catch (error) {
      throw new Error(`Failed to import topology: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static downloadTopology(topology: string, filename: string = 'network-topology.json') {
    const blob = new Blob([topology], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static generateSampleTopology(): NetworkTopology {
    const nodes: Node[] = [
      { id: 'R1', x: 150, y: 100, label: 'R1', status: 'default' },
      { id: 'R2', x: 350, y: 80, label: 'R2', status: 'default' },
      { id: 'R3', x: 550, y: 120, label: 'R3', status: 'default' },
      { id: 'R4', x: 250, y: 280, label: 'R4', status: 'default' },
      { id: 'R5', x: 450, y: 260, label: 'R5', status: 'default' },
      { id: 'SW1', x: 350, y: 180, label: 'SW1', status: 'default' },
    ];

    const edges: Edge[] = [
      { id: 'R1-R2', source: 'R1', target: 'R2', weight: 10, status: 'default' },
      { id: 'R1-R4', source: 'R1', target: 'R4', weight: 5, status: 'default' },
      { id: 'R2-R3', source: 'R2', target: 'R3', weight: 8, status: 'default' },
      { id: 'R2-SW1', source: 'R2', target: 'SW1', weight: 2, status: 'default' },
      { id: 'R3-R5', source: 'R3', target: 'R5', weight: 6, status: 'default' },
      { id: 'R4-SW1', source: 'R4', target: 'SW1', weight: 4, status: 'default' },
      { id: 'R4-R5', source: 'R4', target: 'R5', weight: 12, status: 'default' },
      { id: 'SW1-R5', source: 'SW1', target: 'R5', weight: 3, status: 'default' },
    ];

    return {
      nodes,
      edges,
      metadata: {
        name: 'Sample Enterprise Network',
        description: 'A sample enterprise network topology with routers and switches',
        createdAt: new Date().toISOString(),
        version: '1.0',
      },
    };
  }

  static validateTopology(nodes: Node[], edges: Edge[]): string[] {
    const errors: string[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    // Check for duplicate node IDs
    const duplicateNodes = nodes.filter((node, index, arr) => 
      arr.findIndex(n => n.id === node.id) !== index
    );
    if (duplicateNodes.length > 0) {
      errors.push('Duplicate node IDs found');
    }

    // Check edge references
    edges.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
      if (edge.weight <= 0) {
        errors.push(`Edge ${edge.id} has invalid weight: ${edge.weight}`);
      }
    });

    // Check for isolated nodes
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });
    
    const isolatedNodes = nodes.filter(node => !connectedNodes.has(node.id));
    if (isolatedNodes.length > 0) {
      errors.push(`Isolated nodes found: ${isolatedNodes.map(n => n.id).join(', ')}`);
    }

    return errors;
  }
}