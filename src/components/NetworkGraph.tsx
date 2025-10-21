import React, { useState, useRef, useCallback } from 'react';

export interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  status: 'default' | 'source' | 'destination' | 'visited' | 'path';
}

export interface Edge {
  id: string;
  source: string;
  target: string;
  weight: number;
  status: 'default' | 'visited' | 'path';
}

interface NetworkGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodeDrag: (nodeId: string, x: number, y: number) => void;
  onAddEdge?: (sourceId: string, targetId: string) => void;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({
  nodes,
  edges,
  onNodeDrag,
  onAddEdge,
}) => {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connecting, setConnecting] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback((nodeId: string, event: React.MouseEvent) => {
    event.preventDefault();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (event.shiftKey && onAddEdge) {
      // Connection mode
      if (connecting) {
        if (connecting !== nodeId) {
          onAddEdge(connecting, nodeId);
        }
        setConnecting(null);
      } else {
        setConnecting(nodeId);
      }
    } else {
      // Drag mode
      setDragging(nodeId);
      setDragOffset({
        x: event.clientX - node.x,
        y: event.clientY - node.y,
      });
    }
  }, [nodes, connecting, onAddEdge]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!dragging || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.x;
    const y = event.clientY - rect.top - dragOffset.y;

    onNodeDrag(dragging, Math.max(30, Math.min(x, rect.width - 30)), Math.max(30, Math.min(y, rect.height - 30)));
  }, [dragging, dragOffset, onNodeDrag]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const getNodeClass = (status: string) => {
    switch (status) {
      case 'source': return 'network-node source';
      case 'destination': return 'network-node destination';
      case 'visited': return 'network-node visited';
      case 'path': return 'network-node path';
      default: return 'network-node';
    }
  };

  const getEdgeClass = (status: string) => {
    switch (status) {
      case 'visited': return 'network-edge visited';
      case 'path': return 'network-edge path';
      default: return 'network-edge';
    }
  };

  return (
    <div className="relative w-full h-full bg-background rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Edges */}
        {edges.map((edge) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;

          return (
            <g key={edge.id}>
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                className={getEdgeClass(edge.status)}
                strokeDasharray={edge.status === 'path' ? '5,5' : 'none'}
              />
              {/* Edge weight label */}
              <circle
                cx={midX}
                cy={midY}
                r="12"
                fill="hsl(var(--card))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-semibold fill-foreground"
              >
                {edge.weight}
              </text>
            </g>
          );
        })}

        {/* Connection line preview */}
        {connecting && (
          <line
            x1={nodes.find(n => n.id === connecting)?.x || 0}
            y1={nodes.find(n => n.id === connecting)?.y || 0}
            x2={nodes.find(n => n.id === connecting)?.x || 0}
            y2={nodes.find(n => n.id === connecting)?.y || 0}
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            strokeDasharray="4,4"
            opacity="0.6"
          />
        )}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r="25"
              className={getNodeClass(node.status)}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              style={{ cursor: dragging === node.id ? 'grabbing' : 'grab' }}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-sm font-bold fill-foreground pointer-events-none select-none"
            >
              {node.label}
            </text>
            {connecting === node.id && (
              <circle
                cx={node.x}
                cy={node.y}
                r="30"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="4,4"
                className="animate-pulse"
              />
            )}
          </g>
        ))}
      </svg>

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 space-y-1">
        <p className="text-xs text-muted-foreground">• Drag nodes to move them</p>
        <p className="text-xs text-muted-foreground">• Shift + click to connect nodes</p>
      </div>
    </div>
  );
};

export default NetworkGraph;