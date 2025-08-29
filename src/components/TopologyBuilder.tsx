import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Circle, Line, FabricText, FabricObject } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Router, 
  Network, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw,
  Settings,
  Save
} from 'lucide-react';
import { Node, Edge } from './NetworkGraph';
import { TopologyManager } from '@/utils/NetworkTopology';
import { toast } from 'sonner';

interface TopologyBuilderProps {
  onTopologyChange: (nodes: Node[], edges: Edge[]) => void;
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

const TopologyBuilder: React.FC<TopologyBuilderProps> = ({
  onTopologyChange,
  initialNodes = [],
  initialEdges = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [mode, setMode] = useState<'select' | 'router' | 'connect'>('select');
  const [selectedWeight, setSelectedWeight] = useState<number>(5);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [topologyName, setTopologyName] = useState<string>('My Network');

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#1a1a1a',
      selection: true,
    });

    // Grid background
    const gridSize = 20;
    const gridOptions = {
      stroke: '#333',
      strokeWidth: 0.5,
      selectable: false,
      evented: false,
    };

    // Vertical lines
    for (let i = 0; i <= canvas.width!; i += gridSize) {
      const line = new Line([i, 0, i, canvas.height!], gridOptions);
      canvas.add(line);
      canvas.add(line);
    }

    // Horizontal lines
    for (let i = 0; i <= canvas.height!; i += gridSize) {
      const line = new Line([0, i, canvas.width!, i], gridOptions);
      canvas.add(line);
      canvas.add(line);
    }

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load initial topology
  useEffect(() => {
    if (fabricCanvas && initialNodes.length > 0) {
      loadTopologyToCanvas(initialNodes, initialEdges);
    }
  }, [fabricCanvas, initialNodes, initialEdges]);

  // Canvas event handlers
  useEffect(() => {
    if (!fabricCanvas) return;

    const handleCanvasClick = (e: any) => {
      if (mode === 'router') {
        addRouter(e.pointer.x, e.pointer.y);
      }
    };

    const handleObjectDoubleClick = (e: any) => {
      const obj = e.target;
      if (obj && obj.nodeId) {
        if (mode === 'connect') {
          handleNodeClick(obj.nodeId);
        }
      }
    };

    const handleObjectMoved = () => {
      updateTopologyFromCanvas();
    };

    fabricCanvas.on('mouse:down', handleCanvasClick);
    fabricCanvas.on('mouse:dblclick', handleObjectDoubleClick);
    fabricCanvas.on('object:modified', handleObjectMoved);

    return () => {
      fabricCanvas.off('mouse:down', handleCanvasClick);
      fabricCanvas.off('mouse:dblclick', handleObjectDoubleClick);
      fabricCanvas.off('object:modified', handleObjectMoved);
    };
  }, [fabricCanvas, mode, connectingFrom, selectedWeight]);

  const addRouter = useCallback((x: number, y: number) => {
    if (!fabricCanvas) return;

    const nodeId = `R${Date.now()}`;
    const router = new Circle({
      left: x - 20,
      top: y - 20,
      radius: 20,
      fill: 'hsl(220, 24%, 16%)',
      stroke: 'hsl(180, 100%, 50%)',
      strokeWidth: 2,
      selectable: true,
      hasBorders: true,
      hasControls: false,
    });

    // Add custom properties
    (router as any).nodeId = nodeId;
    (router as any).nodeLabel = nodeId;

    const label = new FabricText(nodeId, {
      left: x,
      top: y,
      fontSize: 12,
      fill: 'white',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    fabricCanvas.add(router, label);
    updateTopologyFromCanvas();
    toast(`Router ${nodeId} added`);
  }, [fabricCanvas]);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (mode !== 'connect') return;

    if (!connectingFrom) {
      setConnectingFrom(nodeId);
      toast(`Select destination for connection from ${nodeId}`);
    } else if (connectingFrom !== nodeId) {
      addConnection(connectingFrom, nodeId);
      setConnectingFrom(null);
    } else {
      setConnectingFrom(null);
      toast('Connection cancelled');
    }
  }, [mode, connectingFrom, selectedWeight]);

  const addConnection = useCallback((sourceId: string, targetId: string) => {
    if (!fabricCanvas) return;

    const sourceNode = fabricCanvas.getObjects().find(obj => 
      (obj as any).nodeId === sourceId
    );
    const targetNode = fabricCanvas.getObjects().find(obj => 
      (obj as any).nodeId === targetId
    );

    if (!sourceNode || !targetNode) return;

    // Check if connection already exists
    const existingEdge = fabricCanvas.getObjects().find(obj => 
      (obj as any).edgeId === `${sourceId}-${targetId}` || 
      (obj as any).edgeId === `${targetId}-${sourceId}`
    );

    if (existingEdge) {
      toast('Connection already exists');
      return;
    }

    const sourceCenter = sourceNode.getCenterPoint();
    const targetCenter = targetNode.getCenterPoint();

    const connection = new Line([
      sourceCenter.x, sourceCenter.y,
      targetCenter.x, targetCenter.y
    ], {
      stroke: 'hsl(180, 100%, 50%)',
      strokeWidth: 2,
      selectable: true,
      hasControls: false,
    });

    // Add custom properties
    (connection as any).edgeId = `${sourceId}-${targetId}`;
    (connection as any).weight = selectedWeight;

    // Add weight label
    const midX = (sourceCenter.x + targetCenter.x) / 2;
    const midY = (sourceCenter.y + targetCenter.y) / 2;

    const weightLabel = new FabricText(selectedWeight.toString(), {
      left: midX,
      top: midY,
      fontSize: 10,
      fill: 'yellow',
      backgroundColor: 'rgba(0,0,0,0.5)',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    (connection as any).weightText = weightLabel;

    fabricCanvas.add(connection, weightLabel);
    fabricCanvas.add(connection, weightLabel);
    updateTopologyFromCanvas();
    toast(`Connection added: ${sourceId} ↔ ${targetId} (weight: ${selectedWeight})`);
  }, [fabricCanvas, selectedWeight]);

  const updateTopologyFromCanvas = useCallback(() => {
    if (!fabricCanvas) return;

    const objects = fabricCanvas.getObjects();
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Extract nodes
    objects.forEach(obj => {
      if ((obj as any).nodeId) {
        const center = obj.getCenterPoint();
        nodes.push({
          id: (obj as any).nodeId,
          x: center.x,
          y: center.y,
          label: (obj as any).nodeLabel,
          status: 'default',
        });
      }
    });

    // Extract edges
    objects.forEach(obj => {
      if ((obj as any).edgeId) {
        const [source, target] = (obj as any).edgeId.split('-');
        edges.push({
          id: (obj as any).edgeId,
          source,
          target,
          weight: (obj as any).weight,
          status: 'default',
        });
      }
    });

    onTopologyChange(nodes, edges);
  }, [fabricCanvas, onTopologyChange]);

  const loadTopologyToCanvas = useCallback((nodes: Node[], edges: Edge[]) => {
    if (!fabricCanvas) return;

    // Clear existing objects (except grid)
    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      if ((obj as any).nodeId || (obj as any).edgeId || (obj as FabricText).text) {
        fabricCanvas.remove(obj);
      }
    });

    // Add nodes
    nodes.forEach(node => {
      const router = new Circle({
        left: node.x - 20,
        top: node.y - 20,
        radius: 20,
        fill: 'hsl(220, 24%, 16%)',
        stroke: 'hsl(180, 100%, 50%)',
        strokeWidth: 2,
        selectable: true,
        hasBorders: true,
        hasControls: false,
      });

      // Add custom properties
      (router as any).nodeId = node.id;
      (router as any).nodeLabel = node.label;

      const label = new FabricText(node.label, {
        left: node.x,
        top: node.y,
        fontSize: 12,
        fill: 'white',
        textAlign: 'center',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
      });

      fabricCanvas.add(router, label);
    });

    // Add edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const connection = new Line([
          sourceNode.x, sourceNode.y,
          targetNode.x, targetNode.y
        ], {
          stroke: 'hsl(180, 100%, 50%)',
          strokeWidth: 2,
          selectable: true,
          hasControls: false,
        });

        // Add custom properties
        (connection as any).edgeId = edge.id;
        (connection as any).weight = edge.weight;

        const midX = (sourceNode.x + targetNode.x) / 2;
        const midY = (sourceNode.y + targetNode.y) / 2;

        const weightLabel = new FabricText(edge.weight.toString(), {
          left: midX,
          top: midY,
          fontSize: 10,
          fill: 'yellow',
          backgroundColor: 'rgba(0,0,0,0.5)',
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          selectable: false,
          evented: false,
        });

        (connection as any).weightText = weightLabel;
        fabricCanvas.add(connection, weightLabel);
        fabricCanvas.add(connection, weightLabel);
      }
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas]);

  const clearCanvas = useCallback(() => {
    if (!fabricCanvas) return;

    const objects = fabricCanvas.getObjects();
    objects.forEach(obj => {
      if ((obj as any).nodeId || (obj as any).edgeId || (obj as FabricText).text) {
        fabricCanvas.remove(obj);
      }
    });

    fabricCanvas.renderAll();
    onTopologyChange([], []);
    toast('Canvas cleared');
  }, [fabricCanvas, onTopologyChange]);

  const deleteSelected = useCallback(() => {
    if (!fabricCanvas) return;

    const activeObjects = fabricCanvas.getActiveObjects();
    activeObjects.forEach(obj => {
      // If deleting a node, also delete connected edges
      if ((obj as any).nodeId) {
        const nodeId = (obj as any).nodeId;
        const connectedEdges = fabricCanvas.getObjects().filter(o => 
          (o as any).edgeId && 
          ((o as any).edgeId.includes(nodeId))
        );
        connectedEdges.forEach(edge => {
          if ((edge as any).weightText) {
            fabricCanvas.remove((edge as any).weightText);
          }
          fabricCanvas.remove(edge);
        });
        
        // Remove node label
        const label = fabricCanvas.getObjects().find(o => 
          o instanceof FabricText && Math.abs(o.left! - (obj.left! + 20)) < 5 && Math.abs(o.top! - (obj.top! + 20)) < 5
        );
        if (label) fabricCanvas.remove(label);
      }
      
      // If deleting an edge, remove its weight label
      if ((obj as any).edgeId && (obj as any).weightText) {
        fabricCanvas.remove((obj as any).weightText);
      }
      
      fabricCanvas.remove(obj);
    });

    fabricCanvas.discardActiveObject();
    fabricCanvas.renderAll();
    updateTopologyFromCanvas();
    toast('Selected objects deleted');
  }, [fabricCanvas, updateTopologyFromCanvas]);

  const exportTopology = useCallback(() => {
    const objects = fabricCanvas?.getObjects() || [];
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Extract current topology
    objects.forEach(obj => {
      if ((obj as any).nodeId) {
        const center = obj.getCenterPoint();
        nodes.push({
          id: (obj as any).nodeId,
          x: center.x,
          y: center.y,
          label: (obj as any).nodeLabel,
          status: 'default',
        });
      }
    });

    objects.forEach(obj => {
      if ((obj as any).edgeId) {
        const [source, target] = (obj as any).edgeId.split('-');
        edges.push({
          id: (obj as any).edgeId,
          source,
          target,
          weight: (obj as any).weight,
          status: 'default',
        });
      }
    });

    const topology = TopologyManager.exportTopology(nodes, edges, topologyName);
    TopologyManager.downloadTopology(topology, `${topologyName.replace(/\s+/g, '-').toLowerCase()}.json`);
    toast('Topology exported successfully');
  }, [fabricCanvas, topologyName]);

  const importTopology = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonString = e.target?.result as string;
        const topology = TopologyManager.importTopology(jsonString);
        
        loadTopologyToCanvas(topology.nodes, topology.edges);
        setTopologyName(topology.metadata.name);
        toast('Topology imported successfully');
      } catch (error) {
        toast.error(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    
    // Reset file input
    event.target.value = '';
  }, [loadTopologyToCanvas]);

  const loadSampleTopology = useCallback(() => {
    const sample = TopologyManager.generateSampleTopology();
    loadTopologyToCanvas(sample.nodes, sample.edges);
    setTopologyName(sample.metadata.name);
    toast('Sample topology loaded');
  }, [loadTopologyToCanvas]);

  return (
    <div className="space-y-6">
      <Card className="glass-panel p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-primary">Interactive Topology Builder</h3>
            <Badge variant="outline">Cisco Packet Tracer Style</Badge>
          </div>
          <Separator />
          
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === 'select' ? 'default' : 'outline'}
              onClick={() => setMode('select')}
              size="sm"
            >
              <Settings className="w-4 h-4 mr-1" />
              Select
            </Button>
            <Button
              variant={mode === 'router' ? 'default' : 'outline'}
              onClick={() => setMode('router')}
              size="sm"
            >
              <Router className="w-4 h-4 mr-1" />
              Add Router
            </Button>
            <Button
              variant={mode === 'connect' ? 'default' : 'outline'}
              onClick={() => setMode('connect')}
              size="sm"
            >
              <Network className="w-4 h-4 mr-1" />
              Connect
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button onClick={deleteSelected} variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
            <Button onClick={clearCanvas} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>

          {/* Connection Weight */}
          {mode === 'connect' && (
            <div className="flex items-center gap-2">
              <Label htmlFor="weight" className="text-sm">Link Weight:</Label>
              <Input
                id="weight"
                type="number"
                value={selectedWeight}
                onChange={(e) => setSelectedWeight(Number(e.target.value))}
                className="w-20"
                min="1"
                max="100"
              />
              {connectingFrom && (
                <Badge variant="secondary">
                  Connecting from {connectingFrom}
                </Badge>
              )}
            </div>
          )}

          {/* Topology Management */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="topology-name" className="text-sm">Topology Name:</Label>
              <Input
                id="topology-name"
                value={topologyName}
                onChange={(e) => setTopologyName(e.target.value)}
                className="flex-1"
                placeholder="Enter topology name"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button onClick={exportTopology} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export JSON
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                Import JSON
              </Button>
              <Button onClick={loadSampleTopology} variant="secondary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Load Sample
              </Button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={importTopology}
            className="hidden"
          />
        </div>
      </Card>

      {/* Canvas */}
      <Card className="glass-panel p-4">
        <div className="text-center mb-2">
          <Badge variant="outline">
            {mode === 'router' ? 'Click to add routers' : 
             mode === 'connect' ? 'Double-click routers to connect' : 
             'Select and drag to modify'}
          </Badge>
        </div>
        <div className="border border-border rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="w-full" />
        </div>
      </Card>
    </div>
  );
};

export default TopologyBuilder;