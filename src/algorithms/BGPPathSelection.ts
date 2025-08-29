import { Node, Edge } from '../components/NetworkGraph';
import { RoutingTableEntry, AlgorithmResult } from './BellmanFord';

interface BGPPath {
  path: string[];
  weight: number;
  localPref: number;
  asPathLength: number;
  med: number;
  igpCost: number;
}

export class BGPPathSelection {
  static execute(
    nodes: Node[],
    edges: Edge[],
    source: string,
    destination: string
  ): AlgorithmResult {
    const startTime = performance.now();
    let iterations = 0;
    
    const allPaths = this.findAllPaths(nodes, edges, source, destination);
    iterations = allPaths.length;
    
    if (allPaths.length === 0) {
      return {
        distances: {},
        previous: {},
        path: [],
        routingTable: [],
        executionTime: performance.now() - startTime,
        iterations
      };
    }
    
    // Convert paths to BGP paths with attributes
    const bgpPaths: BGPPath[] = allPaths.map(path => ({
      path,
      weight: this.calculatePathWeight(path, edges),
      localPref: Math.floor(Math.random() * 100) + 100, // Simulated local preference
      asPathLength: path.length - 1,
      med: Math.floor(Math.random() * 50), // Simulated MED
      igpCost: this.calculatePathWeight(path, edges)
    }));
    
    // BGP path selection algorithm
    const bestPath = this.selectBestPath(bgpPaths);
    
    // Build distances and previous
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    
    nodes.forEach(node => {
      distances[node.id] = Infinity;
      previous[node.id] = null;
    });
    
    if (bestPath) {
      bestPath.path.forEach((nodeId, index) => {
        distances[nodeId] = index === 0 ? 0 : bestPath.weight;
        if (index > 0) {
          previous[nodeId] = bestPath.path[index - 1];
        }
      });
    }
    
    // Generate routing table based on all calculated paths
    const routingTable: RoutingTableEntry[] = [];
    nodes.forEach(node => {
      if (node.id !== source) {
        const pathsToNode = allPaths.filter(path => path[path.length - 1] === node.id);
        if (pathsToNode.length > 0) {
          const bestPathToNode = this.selectBestPath(pathsToNode.map(path => ({
            path,
            weight: this.calculatePathWeight(path, edges),
            localPref: Math.floor(Math.random() * 100) + 100,
            asPathLength: path.length - 1,
            med: Math.floor(Math.random() * 50),
            igpCost: this.calculatePathWeight(path, edges)
          })));
          
          if (bestPathToNode) {
            routingTable.push({
              destination: node.id,
              nextHop: bestPathToNode.path.length > 1 ? bestPathToNode.path[1] : node.id,
              cost: bestPathToNode.weight,
              hops: bestPathToNode.path.length - 1,
              path: bestPathToNode.path
            });
          }
        }
      }
    });
    
    const endTime = performance.now();
    
    return {
      distances,
      previous,
      path: bestPath ? bestPath.path : [],
      routingTable,
      executionTime: endTime - startTime,
      iterations
    };
  }
  
  private static findAllPaths(
    nodes: Node[],
    edges: Edge[],
    start: string,
    end: string,
    maxDepth: number = 10
  ): string[][] {
    const paths: string[][] = [];
    const visited = new Set<string>();
    
    const dfs = (current: string, path: string[], depth: number) => {
      if (depth > maxDepth) return;
      
      if (current === end) {
        paths.push([...path, current]);
        return;
      }
      
      if (visited.has(current)) return;
      
      visited.add(current);
      path.push(current);
      
      // Find neighbors
      edges.forEach(edge => {
        let neighbor: string | null = null;
        if (edge.source === current) neighbor = edge.target;
        else if (edge.target === current) neighbor = edge.source;
        
        if (neighbor && !visited.has(neighbor)) {
          dfs(neighbor, path, depth + 1);
        }
      });
      
      path.pop();
      visited.delete(current);
    };
    
    dfs(start, [], 0);
    return paths;
  }
  
  private static calculatePathWeight(path: string[], edges: Edge[]): number {
    let totalWeight = 0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const edge = edges.find(e => 
        (e.source === path[i] && e.target === path[i + 1]) ||
        (e.target === path[i] && e.source === path[i + 1])
      );
      if (edge) {
        totalWeight += edge.weight;
      }
    }
    
    return totalWeight;
  }
  
  private static selectBestPath(paths: BGPPath[]): BGPPath | null {
    if (paths.length === 0) return null;
    if (paths.length === 1) return paths[0];
    
    // BGP path selection criteria (in order of preference):
    // 1. Highest local preference
    // 2. Shortest AS path
    // 3. Lowest MED
    // 4. Lowest IGP cost
    
    let bestPaths = [...paths];
    
    // 1. Highest local preference
    const maxLocalPref = Math.max(...bestPaths.map(p => p.localPref));
    bestPaths = bestPaths.filter(p => p.localPref === maxLocalPref);
    if (bestPaths.length === 1) return bestPaths[0];
    
    // 2. Shortest AS path
    const minAsPath = Math.min(...bestPaths.map(p => p.asPathLength));
    bestPaths = bestPaths.filter(p => p.asPathLength === minAsPath);
    if (bestPaths.length === 1) return bestPaths[0];
    
    // 3. Lowest MED
    const minMed = Math.min(...bestPaths.map(p => p.med));
    bestPaths = bestPaths.filter(p => p.med === minMed);
    if (bestPaths.length === 1) return bestPaths[0];
    
    // 4. Lowest IGP cost
    const minIgpCost = Math.min(...bestPaths.map(p => p.igpCost));
    bestPaths = bestPaths.filter(p => p.igpCost === minIgpCost);
    
    return bestPaths[0];
  }
}