import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, RotateCcw, GitCompare, Zap } from 'lucide-react';
import { Node, Edge } from './NetworkGraph';
import RoutingTable from './RoutingTable';
import { DijkstraAlgorithm } from '@/algorithms/DijkstraAlgorithm';
import { BellmanFordAlgorithm } from '@/algorithms/BellmanFord';
import { BGPPathSelection } from '@/algorithms/BGPPathSelection';
import type { AlgorithmResult } from '@/algorithms/BellmanFord';

interface AlgorithmComparisonProps {
  nodes: Node[];
  edges: Edge[];
  sourceNode: string;
  destinationNode: string;
  onSourceChange: (nodeId: string) => void;
  onDestinationChange: (nodeId: string) => void;
  onVisualizePath: (algorithm: string, result: AlgorithmResult) => void;
  isRunning: boolean;
}

const AlgorithmComparison: React.FC<AlgorithmComparisonProps> = ({
  nodes,
  edges,
  sourceNode,
  destinationNode,
  onSourceChange,
  onDestinationChange,
  onVisualizePath,
  isRunning,
}) => {
  const [results, setResults] = useState<{
    [key: string]: AlgorithmResult;
  }>({});
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>('Dijkstra');
  const [comparing, setComparing] = useState(false);

  const algorithms = [
    { 
      name: 'Dijkstra', 
      description: 'OSPF-like: Shortest path first, link-state routing',
      execute: DijkstraAlgorithm.execute,
      color: 'blue'
    },
    { 
      name: 'Bellman-Ford', 
      description: 'RIP-like: Distance vector, handles negative weights',
      execute: BellmanFordAlgorithm.execute,
      color: 'green'
    },
    { 
      name: 'BGP', 
      description: 'Path vector: Policy-based routing with multiple criteria',
      execute: BGPPathSelection.execute,
      color: 'purple'
    },
  ];

  const runSingleAlgorithm = async (algorithmName: string) => {
    if (sourceNode === destinationNode) return;
    
    const algorithm = algorithms.find(alg => alg.name === algorithmName);
    if (!algorithm) return;

    try {
      const result = algorithm.execute(nodes, edges, sourceNode, destinationNode);
      setResults(prev => ({ ...prev, [algorithmName]: result }));
      onVisualizePath(algorithmName, result);
    } catch (error) {
      console.error(`${algorithmName} algorithm error:`, error);
    }
  };

  const runAllAlgorithms = async () => {
    if (sourceNode === destinationNode) return;
    
    setComparing(true);
    const newResults: { [key: string]: AlgorithmResult } = {};

    for (const algorithm of algorithms) {
      try {
        const result = algorithm.execute(nodes, edges, sourceNode, destinationNode);
        newResults[algorithm.name] = result;
        
        // Show each algorithm's visualization briefly
        onVisualizePath(algorithm.name, result);
        await new Promise(resolve => setTimeout(resolve, 1500));
      } catch (error) {
        console.error(`${algorithm.name} algorithm error:`, error);
      }
    }

    setResults(newResults);
    setComparing(false);
  };

  const resetResults = () => {
    setResults({});
  };

  const getResultSummary = (algorithmName: string) => {
    const result = results[algorithmName];
    if (!result) return null;

    return {
      pathLength: result.path.length,
      totalCost: result.path.length > 0 ? result.distances[destinationNode] : Infinity,
      executionTime: result.executionTime,
      iterations: result.iterations,
    };
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="glass-panel p-6 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-primary">Algorithm Comparison</h3>
          <Separator />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Router</label>
            <Select value={sourceNode} onValueChange={onSourceChange}>
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
            <Select value={destinationNode} onValueChange={onDestinationChange}>
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
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={runAllAlgorithms}
            disabled={isRunning || comparing || sourceNode === destinationNode}
            className="flex-1"
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare All Algorithms
          </Button>
          <Button onClick={resetResults} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>

        {/* Individual Algorithm Controls */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Run Individual Algorithm</label>
          <div className="flex gap-2">
            <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {algorithms.map((alg) => (
                  <SelectItem key={alg.name} value={alg.name}>
                    {alg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => runSingleAlgorithm(selectedAlgorithm)}
              disabled={isRunning || comparing || sourceNode === destinationNode}
              variant="secondary"
            >
              <Play className="w-4 h-4 mr-2" />
              Run
            </Button>
          </div>
        </div>

        {/* Status */}
        {comparing && (
          <Badge variant="secondary" className="w-full justify-center animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            Comparing algorithms...
          </Badge>
        )}
      </Card>

      {/* Algorithm Descriptions */}
      <Card className="glass-panel p-6">
        <h4 className="text-md font-semibold mb-4">Routing Protocols</h4>
        <div className="space-y-3">
          {algorithms.map((alg) => (
            <div key={alg.name} className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1 bg-${alg.color}-500`} />
              <div>
                <div className="font-medium">{alg.name}</div>
                <div className="text-sm text-muted-foreground">{alg.description}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Results Comparison */}
      {Object.keys(results).length > 0 && (
        <Card className="glass-panel p-6">
          <h4 className="text-md font-semibold mb-4">Performance Comparison</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2">Algorithm</th>
                  <th className="text-left py-2">Path Length</th>
                  <th className="text-left py-2">Total Cost</th>
                  <th className="text-left py-2">Execution Time</th>
                  <th className="text-left py-2">Iterations</th>
                </tr>
              </thead>
              <tbody>
                {algorithms.map((alg) => {
                  const summary = getResultSummary(alg.name);
                  return (
                    <tr key={alg.name} className="border-b border-border/50">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full bg-${alg.color}-500`} />
                          {alg.name}
                        </div>
                      </td>
                      <td className="py-2">
                        {summary ? `${summary.pathLength} nodes` : 'N/A'}
                      </td>
                      <td className="py-2">
                        {summary ? (
                          <Badge variant="outline">
                            {summary.totalCost === Infinity ? '∞' : summary.totalCost}
                          </Badge>
                        ) : 'N/A'}
                      </td>
                      <td className="py-2">
                        {summary ? `${summary.executionTime.toFixed(2)}ms` : 'N/A'}
                      </td>
                      <td className="py-2">
                        {summary ? summary.iterations : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Routing Tables */}
      {Object.keys(results).length > 0 && (
        <Tabs defaultValue={algorithms[0].name} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            {algorithms.map((alg) => (
              <TabsTrigger 
                key={alg.name} 
                value={alg.name}
                disabled={!results[alg.name]}
              >
                {alg.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {algorithms.map((alg) => (
            <TabsContent key={alg.name} value={alg.name}>
              {results[alg.name] && (
                <RoutingTable
                  algorithm={alg.name}
                  routingTable={results[alg.name].routingTable}
                  executionTime={results[alg.name].executionTime}
                  iterations={results[alg.name].iterations}
                  sourceNode={sourceNode}
                />
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

export default AlgorithmComparison;