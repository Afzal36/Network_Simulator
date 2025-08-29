import { Node, Edge } from '../components/NetworkGraph';
import { RoutingTableEntry, AlgorithmResult } from './BellmanFord';

export class DijkstraAlgorithm {
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
    const visited = new Set<string>();
    const unvisited = new Set(nodes.map(n => n.id));
    
    // Initialize distances
    nodes.forEach(node => {
      distances[node.id] = node.id === source ? 0 : Infinity;
      previous[node.id] = null;
    });
    
    // Build adjacency list
    const graph: { [key: string]: { [key: string]: number } } = {};
    nodes.forEach(node => {
      graph[node.id] = {};
    });
    
    edges.forEach(edge => {
      graph[edge.source][edge.target] = edge.weight;
      graph[edge.target][edge.source] = edge.weight;
    });
    
    while (unvisited.size > 0) {
      iterations++;
      
      // Find unvisited node with minimum distance
      let currentNode = Array.from(unvisited).reduce((min, node) =>
        distances[node] < distances[min] ? node : min
      );
      
      if (distances[currentNode] === Infinity) break;
      
      // Update neighbors
      Object.keys(graph[currentNode]).forEach(neighbor => {
        if (!visited.has(neighbor)) {
          const newDistance = distances[currentNode] + graph[currentNode][neighbor];
          if (newDistance < distances[neighbor]) {
            distances[neighbor] = newDistance;
            previous[neighbor] = currentNode;
          }
        }
      });
      
      visited.add(currentNode);
      unvisited.delete(currentNode);
      
      if (currentNode === destination) break;
    }
    
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