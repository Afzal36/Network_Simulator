import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Node, Edge } from './NetworkGraph';
import AlgorithmComparison from './AlgorithmComparison';
import TopologyBuilder from './TopologyBuilder';
import NetworkGraph from './NetworkGraph';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, GitCompare, Hammer } from 'lucide-react';
import type { AlgorithmResult } from '@/algorithms/BellmanFord';

const initialNodes: Node[] = [
  { id: 'A', x: 150, y: 100, label: 'A', status: 'default' },
  { id: 'B', x: 350, y: 80, label: 'B', status: 'default' },
  { id: 'C', x: 550, y: 120, label: 'C', status: 'default' },
  { id: 'D', x: 250, y: 280, label: 'D', status: 'default' },
  { id: 'E', x: 450, y: 260, label: 'E', status: 'default' },
  { id: 'F', x: 350, y: 180, label: 'F', status: 'default' },
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

const EnhancedRouterSimulation: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [sourceNode, setSourceNode] = useState<string>('A');
  const [destinationNode, setDestinationNode] = useState<string>('E');
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('simulation');

  const onNodeDrag = useCallback((nodeId: string, x: number, y: number) => {
    setNodes(prev => prev.map(node => 
      node.id === nodeId ? { ...node, x, y } : node
    ));
  }, []);

  const onAddEdge = useCallback((sourceId: string, targetId: string) => {
    const weight = Math.floor(Math.random() * 8) + 1;
    const edgeId = `${sourceId}-${targetId}`;
    
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

  const onVisualizePath = useCallback(async (algorithm: string, result: AlgorithmResult) => {
    setIsRunning(true);
    
    // Reset all nodes and edges to default state
    setNodes(prev => prev.map(node => ({ ...node, status: 'default' })));
    setEdges(prev => prev.map(edge => ({ ...edge, status: 'default' })));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Highlight source and destination
    setNodes(prev => prev.map(node => ({
      ...node,
      status: 
        node.id === sourceNode ? 'source' : 
        node.id === destinationNode ? 'destination' : 'default'
    })));
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Show visited nodes
    const visitedNodes = Object.keys(result.distances).filter(
      nodeId => result.distances[nodeId] !== Infinity && nodeId !== sourceNode && nodeId !== destinationNode
    );
    
    for (const nodeId of visitedNodes) {
      setNodes(prev => prev.map(node => ({
        ...node,
        status: 
          node.id === sourceNode ? 'source' :
          node.id === destinationNode ? 'destination' :
          node.id === nodeId ? 'visited' : node.status
      })));
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    // Highlight shortest path
    if (result.path.length > 0 && result.path.includes(sourceNode)) {
      setNodes(prev => prev.map(node => ({
        ...node,
        status: result.path.includes(node.id) ? 'path' : 
          node.id === sourceNode ? 'source' :
          node.id === destinationNode ? 'destination' : 'visited'
      })));

      setEdges(prev => prev.map(edge => {
        const isPathEdge = result.path.some((node, i) => 
          i < result.path.length - 1 && 
          ((edge.source === node && edge.target === result.path[i + 1]) ||
           (edge.target === node && edge.source === result.path[i + 1]))
        );
        return {
          ...edge,
          status: isPathEdge ? 'path' : 'visited',
        };
      }));
    }
    
    setIsRunning(false);
  }, [sourceNode, destinationNode]);

  const onTopologyChange = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setNodes(newNodes);
    setEdges(newEdges);
    
    // Update source/destination if they no longer exist
    if (newNodes.length > 0) {
      if (!newNodes.find(n => n.id === sourceNode)) {
        setSourceNode(newNodes[0].id);
      }
      if (!newNodes.find(n => n.id === destinationNode)) {
        setDestinationNode(newNodes[newNodes.length - 1]?.id || newNodes[0].id);
      }
    }
  }, [sourceNode, destinationNode]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Advanced Router Simulation
          </h1>
          <p className="text-muted-foreground">
            Compare routing algorithms and build custom network topologies
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="simulation" className="flex items-center gap-2">
              <Network className="w-4 h-4" />
              Network Simulation
            </TabsTrigger>
            <TabsTrigger value="comparison" className="flex items-center gap-2">
              <GitCompare className="w-4 h-4" />
              Algorithm Comparison
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Hammer className="w-4 h-4" />
              Topology Builder
            </TabsTrigger>
          </TabsList>

          <TabsContent value="simulation" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="space-y-4">
                <Card className="glass-panel p-4">
                  <div className="space-y-2">
                    <h3 className="text-md font-semibold text-primary">Network Status</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Routers:</span>
                        <Badge variant="outline">{nodes.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Links:</span>
                        <Badge variant="outline">{edges.length}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Source:</span>
                        <Badge variant="secondary">Router {sourceNode}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Destination:</span>
                        <Badge variant="secondary">Router {destinationNode}</Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

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
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <AlgorithmComparison
                  nodes={nodes}
                  edges={edges}
                  sourceNode={sourceNode}
                  destinationNode={destinationNode}
                  onSourceChange={setSourceNode}
                  onDestinationChange={setDestinationNode}
                  onVisualizePath={onVisualizePath}
                  isRunning={isRunning}
                />
              </div>
              
              <div className="lg:col-span-2">
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
          </TabsContent>

          <TabsContent value="builder" className="space-y-6">
            <TopologyBuilder
              onTopologyChange={onTopologyChange}
              initialNodes={nodes}
              initialEdges={edges}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedRouterSimulation;