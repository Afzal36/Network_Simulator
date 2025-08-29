import { Node, Edge } from '../components/NetworkGraph';

export interface RoutingTableEntry {
  destination: string;
  nextHop: string;
  cost: number;
  hops: number;
  path: string[];
}

export interface AlgorithmResult {
  distances: { [key: string]: number };
  previous: { [key: string]: string | null };
  path: string[];
  routingTable: RoutingTableEntry[];
  executionTime: number;
  iterations: number;
}

export class BellmanFordAlgorithm {
  static execute(
    nodes: Node[],
    edges: Edge[],
    source: string,
    destination: string
  ): AlgorithmResult {
    const startTime = performance.now();
    let iterations = 0;
    
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    
    // Initialize distances
    nodes.forEach(node => {
      distances[node.id] = node.id === source ? 0 : Infinity;
      previous[node.id] = null;
    });
    
    // Relax edges repeatedly
    for (let i = 0; i < nodes.length - 1; i++) {
      iterations++;
      let hasUpdate = false;
      
      edges.forEach(edge => {
        // Check both directions for undirected graph
        const directions = [
          { from: edge.source, to: edge.target },
          { from: edge.target, to: edge.source }
        ];
        
        directions.forEach(({ from, to }) => {
          if (distances[from] !== Infinity && 
              distances[from] + edge.weight < distances[to]) {
            distances[to] = distances[from] + edge.weight;
            previous[to] = from;
            hasUpdate = true;
          }
        });
      });
      
      if (!hasUpdate) break;
    }
    
    // Check for negative cycles
    edges.forEach(edge => {
      const directions = [
        { from: edge.source, to: edge.target },
        { from: edge.target, to: edge.source }
      ];
      
      directions.forEach(({ from, to }) => {
        if (distances[from] !== Infinity && 
            distances[from] + edge.weight < distances[to]) {
          throw new Error('Graph contains negative cycle');
        }
      });
    });
    
    // Build path
    const path: string[] = [];
    let current: string | null = destination;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    
    // Generate routing table
    const routingTable: RoutingTableEntry[] = [];
    nodes.forEach(node => {
      if (node.id !== source && distances[node.id] !== Infinity) {
        const nodePath: string[] = [];
        let curr: string | null = node.id;
        while (curr !== null) {
          nodePath.unshift(curr);
          curr = previous[curr];
        }
        
        routingTable.push({
          destination: node.id,
          nextHop: nodePath.length > 1 ? nodePath[1] : node.id,
          cost: distances[node.id],
          hops: nodePath.length - 1,
          path: nodePath
        });
      }
    });
    
    const endTime = performance.now();
    
    return {
      distances,
      previous,
      path: path.includes(source) ? path : [],
      routingTable,
      executionTime: endTime - startTime,
      iterations
    };
  }
}