import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Play, RotateCcw, Zap, Plus } from 'lucide-react';
import NetworkGraph, { Node, Edge } from './NetworkGraph';

interface DijkstraState {
  distances: { [key: string]: number };
  previous: { [key: string]: string | null };
  visited: Set<string>;
  path: string[];
  isRunning: boolean;
  currentNode: string | null;
}

const initialNodes: Node[] = [
  {
    id: 'A',
    x: 150,
    y: 100,
    label: 'A',
    status: 'default',
  },
  {
    id: 'B',
    x: 350,
    y: 80,
    label: 'B',
    status: 'default',
  },
  {
    id: 'C',
    x: 550,
    y: 120,
    label: 'C',
    status: 'default',
  },
  {
    id: 'D',
    x: 250,
    y: 280,
    label: 'D',
    status: 'default',
  },
  {
    id: 'E',
    x: 450,
    y: 260,
    label: 'E',
    status: 'default',
  },
  {
    id: 'F',
    x: 350,
    y: 180,
    label: 'F',
    status: 'default',
  },
];

const initialEdges: Edge[] = [
  { id: 'A-B', source: 'A', target: 'B', weight: 4, status: 'default' },
  { id: 'A-D', source: 'A', target: 'D', weight: 2, status: 'default' },
  { id: 'B-C', source: 'B', target: 'C', weight: 3, status: 'default' },
  { id: 'B-F', source: 'B', target: 'F', weight: 1, status: 'default' },
  { id: 'C-E', source: 'C', target: 'E', weight: 2, status: 'default' },
  { id: 'D-F', source: 'D', target: 'F', weight: 5, status: 'default' },
  { id: 'D-E', source: 'D', target: 'E', weight: 7, status: 'default' },
  { id: 'F-E', source: 'F', target: 'E', weight: 3, status: 'default' },
];

const RouterSimulation: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [sourceNode, setSourceNode] = useState<string>('A');
  const [destinationNode, setDestinationNode] = useState<string>('E');
  const [dijkstraState, setDijkstraState] = useState<DijkstraState>({
    distances: {},
    previous: {},
    visited: new Set(),
    path: [],
    isRunning: false,
    currentNode: null,
  });

  const onNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, x, y } : node
    ));
  }, []);

  const onAddEdge = useCallback((sourceId: string, targetId: string) => {
    const weight = Math.floor(Math.random() * 8) + 1;
    const edgeId = `${sourceId}-${targetId}`;
    
    // Check if edge already exists
    if (edges.some(e => 
      (e.source === sourceId && e.target === targetId) ||
      (e.source === targetId && e.target === sourceId)
    )) {
      return;
    }

    setEdges(prev => [...prev, {
      id: edgeId,
      source: sourceId,
      target: targetId,
      weight,
      status: 'default'
    }]);
  }, [edges]);

  const buildGraph = useCallback(() => {
    const graph: { [key: string]: { [key: string]: number } } = {};
    
    nodes.forEach((node) => {
      graph[node.id] = {};
    });

    edges.forEach((edge) => {
      graph[edge.source][edge.target] = edge.weight;
      graph[edge.target][edge.source] = edge.weight; // Undirected graph
    });

    return graph;
  }, [nodes, edges]);

  const runDijkstra = useCallback(async () => {
    if (!sourceNode || !destinationNode || sourceNode === destinationNode) return;

    setDijkstraState((prev) => ({ ...prev, isRunning: true }));
    const graph = buildGraph();
    const distances: { [key: string]: number } = {};
    const previous: { [key: string]: string | null } = {};
    const visited = new Set<string>();
    const unvisited = new Set(Object.keys(graph));

    // Initialize distances
    Object.keys(graph).forEach((node) => {
      distances[node] = node === sourceNode ? 0 : Infinity;
      previous[node] = null;
    });

    // Update source and destination nodes
    setNodes(prev => prev.map(node => ({
      ...node,
      status: node.id === sourceNode ? 'source' : 
               node.id === destinationNode ? 'destination' : 'default',
    })));

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode = Array.from(unvisited).reduce((min, node) =>
        distances[node] < distances[min] ? node : min
      );

      if (distances[currentNode] === Infinity) break;

      setDijkstraState((prev) => ({ ...prev, currentNode }));

      // Visual update - highlight current node
      setNodes(prev => prev.map(node => ({
        ...node,
        status: 
          node.id === sourceNode ? 'source' :
          node.id === destinationNode ? 'destination' :
          node.id === currentNode ? 'visited' :
          visited.has(node.id) ? 'visited' : 'default',
      })));

      // Wait for animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Update neighbors
      Object.keys(graph[currentNode]).forEach((neighbor) => {
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

      if (currentNode === destinationNode) break;
    }

    // Build shortest path
    const path: string[] = [];
    let current: string | null = destinationNode;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    // Highlight shortest path
    if (path.includes(sourceNode)) {
      setNodes(prev => prev.map(node => ({
        ...node,
        status: path.includes(node.id) ? 'path' : 
          node.id === sourceNode ? 'source' :
          node.id === destinationNode ? 'destination' :
          'visited',
      })));

      setEdges(prev => prev.map(edge => {
        const isPathEdge = path.some((node, i) => 
          i < path.length - 1 && 
          ((edge.source === node && edge.target === path[i + 1]) ||
           (edge.target === node && edge.source === path[i + 1]))
        );
        return {
          ...edge,
          status: isPathEdge ? 'path' : 'visited',
        };
      }));
    }

    setDijkstraState({
      distances,
      previous,
      visited,
      path,
      isRunning: false,
      currentNode: null,
    });
  }, [sourceNode, destinationNode, buildGraph]);

  const resetSimulation = useCallback(() => {
    setNodes(prev => prev.map(node => ({
      ...node,
      status: 'default',
    })));
    setEdges(prev => prev.map(edge => ({
      ...edge,
      status: 'default',
    })));
    setDijkstraState({
      distances: {},
      previous: {},
      visited: new Set(),
      path: [],
      isRunning: false,
      currentNode: null,
    });
  }, []);

  const addRandomNode = useCallback(() => {
    const newId = String.fromCharCode(65 + nodes.length); // A, B, C, ...
    const newNode: Node = {
      id: newId,
      x: 200 + Math.random() * 300,
      y: 100 + Math.random() * 200,
      label: newId,
      status: 'default',
    };
    setNodes(prev => [...prev, newNode]);
  }, [nodes.length]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Router Simulation
          </h1>
          <p className="text-muted-foreground">
            Visualize Dijkstra's algorithm for shortest path routing
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Controls Panel */}
          <Card className="glass-panel p-6 space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-primary">Network Controls</h3>
              <Separator />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Source Router</label>
                <Select value={sourceNode} onValueChange={setSourceNode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        Router {node.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Destination Router</label>
                <Select value={destinationNode} onValueChange={setDestinationNode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nodes.map((node) => (
                      <SelectItem key={node.id} value={node.id}>
                        Router {node.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={runDijkstra}
                  disabled={dijkstraState.isRunning || sourceNode === destinationNode}
                  className="w-full"
                  variant="default"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Find Shortest Path
                </Button>
                <Button onClick={resetSimulation} variant="outline" className="w-full">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={addRandomNode} variant="secondary" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Router
                </Button>
              </div>
            </div>

            {/* Algorithm Status */}
            {dijkstraState.isRunning && (
              <div className="space-y-2">
                <Badge variant="secondary" className="w-full justify-center animate-pulse">
                  <Zap className="w-3 h-3 mr-1" />
                  Running Algorithm...
                </Badge>
                {dijkstraState.currentNode && (
                  <p className="text-xs text-center text-muted-foreground">
                    Processing: Router {dijkstraState.currentNode}
                  </p>
                )}
              </div>
            )}

            {/* Results */}
            {dijkstraState.path.length > 0 && !dijkstraState.isRunning && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-primary">Shortest Path</h4>
                <div className="flex flex-wrap gap-1">
                  {dijkstraState.path.map((node, index) => (
                    <React.Fragment key={node}>
                      <Badge variant="outline">{node}</Badge>
                      {index < dijkstraState.path.length - 1 && (
                        <span className="text-xs text-muted-foreground">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total Distance: {dijkstraState.distances[destinationNode] || 'N/A'}
                </p>
              </div>
            )}

            {/* Legend */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Legend</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Source</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Destination</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Visited</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
                  <span>Shortest Path</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Network Graph */}
          <div className="lg:col-span-3">
            <Card className="glass-panel p-4">
              <div style={{ width: '100%', height: '600px' }}>
                <NetworkGraph
                  nodes={nodes}
                  edges={edges}
                  onNodeDrag={onNodeDrag}
                  onAddEdge={onAddEdge}
                />
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouterSimulation;