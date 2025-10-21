import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RoutingTableEntry } from '@/algorithms/BellmanFord';
import { Clock, Route, Target } from 'lucide-react';

interface RoutingTableProps {
  algorithm: string;
  routingTable: RoutingTableEntry[];
  executionTime: number;
  iterations: number;
  sourceNode: string;
}

const RoutingTable: React.FC<RoutingTableProps> = ({
  algorithm,
  routingTable,
  executionTime,
  iterations,
  sourceNode,
}) => {
  const getAlgorithmColor = (alg: string) => {
    switch (alg) {
      case 'Dijkstra': return 'bg-blue-500';
      case 'Bellman-Ford': return 'bg-green-500';
      case 'BGP': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="glass-panel p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getAlgorithmColor(algorithm)}`} />
            <h3 className="text-lg font-semibold">{algorithm} Routing Table</h3>
          </div>
          <Badge variant="outline">From Router {sourceNode}</Badge>
        </div>
        
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{executionTime.toFixed(2)}ms</span>
          </div>
          <div className="flex items-center gap-1">
            <Route className="w-4 h-4" />
            <span>{iterations} iterations</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span>{routingTable.length} destinations</span>
          </div>
        </div>
        
        {routingTable.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Next Hop</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Hops</TableHead>
                  <TableHead>Path</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routingTable.map((entry) => (
                  <TableRow key={entry.destination}>
                    <TableCell className="font-medium">
                      Router {entry.destination}
                    </TableCell>
                    <TableCell>Router {entry.nextHop}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{entry.cost}</Badge>
                    </TableCell>
                    <TableCell>{entry.hops}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {entry.path.map((node, index) => (
                          <React.Fragment key={node}>
                            <span className="text-xs bg-muted px-1 rounded">
                              {node}
                            </span>
                            {index < entry.path.length - 1 && (
                              <span className="text-xs text-muted-foreground">→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No reachable destinations</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default RoutingTable;