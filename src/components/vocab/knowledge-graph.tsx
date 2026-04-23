"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Search,
  X,
  Loader2,
  Network,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeGraphDetail } from "./knowledge-graph-detail";
import type { GraphNode, GraphEdge, VocabGraphData } from "@/actions/vocab-graph";

// ─── Types ─────────────────────────────────────────

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number; // fixed x (when dragging)
  fy?: number;
  radius: number;
}

// ─── SRS Mastery Color Mapping ─────────────────────

function getMasteryColor(level: number) {
  if (level === 0) return { bg: "#94a3b8", glow: "#94a3b844", label: "New" };
  if (level <= 25)
    return { bg: "#ef4444", glow: "#ef444444", label: "Weak" };
  if (level <= 50)
    return { bg: "#f97316", glow: "#f9731644", label: "Learning" };
  if (level <= 75)
    return { bg: "#3b82f6", glow: "#3b82f644", label: "Familiar" };
  return { bg: "#22c55e", glow: "#22c55e44", label: "Mastered" };
}

function getEdgeStyle(type: GraphEdge["type"]) {
  switch (type) {
    case "synonym":
      return { stroke: "var(--primary-400)", width: 1.8, dash: "" };
    case "antonym":
      return { stroke: "var(--secondary-400)", width: 1.5, dash: "6 3" };
    case "same-notebook":
      return { stroke: "var(--gray-300)", width: 0.6, dash: "2 4" };
  }
}

// ─── Notebook Color CSS Variables ──────────────────

const NOTEBOOK_COLOR_MAP: Record<string, string> = {
  primary: "var(--primary-500)",
  secondary: "var(--secondary-500)",
  accent: "var(--accent-500)",
  success: "var(--success-200)",
  warning: "var(--warning-200)",
  info: "var(--info-200)",
};

// ─── Force Simulation ──────────────────────────────

function initializePositions(nodes: GraphNode[]): SimNode[] {
  const count = nodes.length;
  const radius = Math.max(300, count * 8);

  return nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / count;
    const r = radius * (0.3 + 0.7 * Math.random());
    const connectionCount = n.synonyms.length + n.antonyms.length;

    return {
      ...n,
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r,
      vx: 0,
      vy: 0,
      radius: Math.max(5, Math.min(12, 6 + connectionCount * 1.5)),
    };
  });
}

function runSimulationStep(
  nodes: SimNode[],
  edges: GraphEdge[],
  alpha: number
): SimNode[] {
  const nodeMap = new Map<string, number>();
  nodes.forEach((n, i) => nodeMap.set(n.id, i));

  const updated = nodes.map((n) => ({
    ...n,
    vx: n.vx * 0.85, // damping
    vy: n.vy * 0.85,
  }));

  // Repulsion (Barnes-Hut simplified: just all pairs for small N)
  const repulsionStrength = 800;
  for (let i = 0; i < updated.length; i++) {
    for (let j = i + 1; j < updated.length; j++) {
      const dx = updated[j].x - updated[i].x;
      const dy = updated[j].y - updated[i].y;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const force = (repulsionStrength * alpha) / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (updated[i].fx === undefined) {
        updated[i].vx -= fx;
        updated[i].vy -= fy;
      }
      if (updated[j].fx === undefined) {
        updated[j].vx += fx;
        updated[j].vy += fy;
      }
    }
  }

  // Attraction along edges
  const attractionStrength = 0.05;
  const idealLength = 120;
  for (const edge of edges) {
    const si = nodeMap.get(edge.source);
    const ti = nodeMap.get(edge.target);
    if (si === undefined || ti === undefined) continue;

    const dx = updated[ti].x - updated[si].x;
    const dy = updated[ti].y - updated[si].y;
    const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
    const force = (dist - idealLength) * attractionStrength * alpha;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    // Stronger attraction for synonym/antonym edges
    const multiplier = edge.type === "same-notebook" ? 0.3 : 1;

    if (updated[si].fx === undefined) {
      updated[si].vx += fx * multiplier;
      updated[si].vy += fy * multiplier;
    }
    if (updated[ti].fx === undefined) {
      updated[ti].vx -= fx * multiplier;
      updated[ti].vy -= fy * multiplier;
    }
  }

  // Center gravity
  const centerForce = 0.01 * alpha;
  for (const n of updated) {
    if (n.fx === undefined) {
      n.vx -= n.x * centerForce;
      n.vy -= n.y * centerForce;
    }
  }

  // Apply velocities
  for (const n of updated) {
    if (n.fx !== undefined) {
      n.x = n.fx;
      n.y = n.fy!;
    } else {
      const maxV = 10;
      n.vx = Math.max(-maxV, Math.min(maxV, n.vx));
      n.vy = Math.max(-maxV, Math.min(maxV, n.vy));
      n.x += n.vx;
      n.y += n.vy;
    }
  }

  return updated;
}

// ─── Component ─────────────────────────────────────

interface KnowledgeGraphProps {
  data: VocabGraphData;
  isLoading?: boolean;
}

export function KnowledgeGraph({ data, isLoading }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // View state
  const [scale, setScale] = useState(0.75);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);

  // UI state
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotebookEdges, setShowNotebookEdges] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Simulation
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [isSimulating, setIsSimulating] = useState(true);
  const alphaRef = useRef(1);
  const rafRef = useRef<number | null>(null);

  // Filter edges
  const filteredEdges = useMemo(() => {
    let edges = data.edges;
    if (!showNotebookEdges) {
      edges = edges.filter((e) => e.type !== "same-notebook");
    }
    return edges;
  }, [data.edges, showNotebookEdges]);

  // Initialize simulation
  useEffect(() => {
    if (data.nodes.length === 0) return;
    const initialized = initializePositions(data.nodes);
    setSimNodes(initialized);
    alphaRef.current = 1;
    setIsSimulating(true);
  }, [data.nodes]);

  // Run simulation loop
  useEffect(() => {
    if (!isSimulating || simNodes.length === 0) return;

    const tick = () => {
      alphaRef.current *= 0.98;

      if (alphaRef.current < 0.01) {
        setIsSimulating(false);
        return;
      }

      setSimNodes((prev) =>
        runSimulationStep(prev, filteredEdges, alphaRef.current)
      );
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isSimulating, filteredEdges, simNodes.length]);

  // Search filter
  const searchMatch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matchSet = new Set<string>();
    // ⚡ Bolt: Use a single pass to directly populate the Set, avoiding intermediate array allocation from .filter().map()
    for (let i = 0; i < simNodes.length; i++) {
      const n = simNodes[i];
      if (
        n.word.toLowerCase().includes(q) ||
        n.meaning.toLowerCase().includes(q) ||
        n.vietnameseMeaning.toLowerCase().includes(q)
      ) {
        matchSet.add(n.id);
      }
    }
    return matchSet;
  }, [searchQuery, simNodes]);

  // Notebook filter
  const activeNodes = useMemo(() => {
    if (!activeFilter) return null;
    const matchSet = new Set<string>();
    // ⚡ Bolt: Prevent O(N) intermediate array allocation and extra iteration by populating Set directly
    for (let i = 0; i < simNodes.length; i++) {
      if (simNodes[i].notebookName === activeFilter) {
        matchSet.add(simNodes[i].id);
      }
    }
    return matchSet;
  }, [activeFilter, simNodes]);

  // Node lookup
  const nodeMap = useMemo(() => {
    const m = new Map<string, SimNode>();
    simNodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [simNodes]);

  // ─── Handlers ──────────────────────────────────────

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.06 : 0.06;
    setScale((prev) => Math.min(Math.max(0.15, prev + delta), 4));
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".interactive-node")) return;
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    },
    [position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragNodeId) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;
        const cx = containerRect.width / 2;
        const cy = containerRect.height / 2;
        const worldX = (e.clientX - containerRect.left - cx - position.x) / scale;
        const worldY = (e.clientY - containerRect.top - cy - position.y) / scale;

        setSimNodes((prev) =>
          prev.map((n) =>
            n.id === dragNodeId ? { ...n, x: worldX, y: worldY, fx: worldX, fy: worldY } : n
          )
        );
        return;
      }
      if (!isDragging) return;
      setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    },
    [isDragging, dragStart, dragNodeId, position, scale]
  );

  const handleMouseUp = useCallback(() => {
    if (dragNodeId) {
      setSimNodes((prev) =>
        prev.map((n) =>
          n.id === dragNodeId ? { ...n, fx: undefined, fy: undefined } : n
        )
      );
      setDragNodeId(null);
      alphaRef.current = 0.3;
      setIsSimulating(true);
    }
    setIsDragging(false);
  }, [dragNodeId]);

  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDragNodeId(nodeId);
    },
    []
  );

  const handleNodeClick = useCallback(
    (node: GraphNode, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!dragNodeId) {
        setSelectedNode(node);
      }
    },
    [dragNodeId]
  );

  const handleReset = useCallback(() => {
    setScale(0.75);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Check if a node is dimmed out (via search or filter)
  const isNodeDimmed = useCallback(
    (nodeId: string) => {
      if (searchMatch && !searchMatch.has(nodeId)) return true;
      if (activeNodes && !activeNodes.has(nodeId)) return true;
      return false;
    },
    [searchMatch, activeNodes]
  );

  // ─── Render ────────────────────────────────────────

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-background"
    : "relative w-full h-[700px] bg-background/50";

  if (isLoading) {
    return (
      <div className={`${containerClasses} flex items-center justify-center rounded-xl border border-border`}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-sm font-medium">Building knowledge graph...</span>
        </div>
      </div>
    );
  }

  if (data.nodes.length === 0) {
    return (
      <div className={`${containerClasses} flex items-center justify-center rounded-xl border border-border`}>
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Network className="h-10 w-10 opacity-40" />
          <span className="text-sm font-medium">No words in your notebook yet</span>
          <span className="text-xs">
            Save words to your notebook to build the knowledge graph
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${containerClasses} flex flex-col font-sans text-foreground rounded-xl overflow-hidden border border-border`}
      ref={containerRef}
    >
      {/* ─── Stats Bar ─── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border/60 rounded-full shadow-sm text-xs font-medium">
          <span className="text-muted-foreground">{data.stats.totalWords} words</span>
          <div className="w-px h-3 bg-border" />
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
            <span>{data.stats.mastered}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span>{data.stats.learning}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#94a3b8]" />
            <span>{data.stats.unseen}</span>
          </div>
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-56 h-8 pl-8 pr-8 text-xs bg-background/80 backdrop-blur-md border border-border/60 rounded-full shadow-sm outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Controls ─── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1.5 bg-background/80 backdrop-blur-md border border-border/60 rounded-full shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => setScale((s) => Math.max(s - 0.15, 0.15))}
          className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <span className="text-[10px] font-bold w-9 text-center text-foreground tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => setScale((s) => Math.min(s + 0.15, 4))}
          className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <Button
          variant="ghost"
          size="icon"
          aria-label="Reset view"
          title="Reset view"
          onClick={handleReset}
          className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={showNotebookEdges ? "Hide notebook connections" : "Show notebook connections"}
          onClick={() => setShowNotebookEdges(!showNotebookEdges)}
          className={`h-8 w-8 rounded-full hover:bg-muted ${showNotebookEdges ? "text-primary-600" : "text-muted-foreground"}`}
          title={showNotebookEdges ? "Hide notebook connections" : "Show notebook connections"}
        >
          {showNotebookEdges ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-8 w-8 rounded-full hover:bg-muted text-muted-foreground"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </Button>
      </div>

      {/* ─── Notebook Filter ─── */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-1.5 max-w-[50%]">
        <button
          onClick={() => setActiveFilter(null)}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${!activeFilter
              ? "bg-foreground text-background border-foreground"
              : "bg-background/80 text-muted-foreground border-border/60 hover:bg-muted backdrop-blur-md"
            }`}
        >
          All
        </button>
        {data.notebooks.map((nb) => (
          <button
            key={nb.id}
            onClick={() =>
              setActiveFilter(activeFilter === nb.name ? null : nb.name)
            }
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border flex items-center gap-1.5 ${activeFilter === nb.name
                ? "bg-foreground text-background border-foreground"
                : "bg-background/80 text-muted-foreground border-border/60 hover:bg-muted backdrop-blur-md"
              }`}
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: NOTEBOOK_COLOR_MAP[nb.color] || "var(--gray-400)" }}
            />
            {nb.name}
          </button>
        ))}
      </div>

      {/* ─── Legend ─── */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 px-3 py-1.5 bg-background/80 backdrop-blur-md border border-border/60 rounded-full shadow-sm text-[10px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1">
          <div className="w-5 h-[2px] bg-[var(--primary-400)]" />
          synonym
        </span>
        <span className="flex items-center gap-1">
          <div className="w-5 h-[2px] bg-[var(--secondary-400)]" style={{ borderTop: "2px dashed var(--secondary-400)", height: 0 }} />
          antonym
        </span>
      </div>

      {/* ─── Canvas Area ─── */}
      <div
        className={`flex-1 overflow-hidden relative select-none ${isDragging || dragNodeId ? "cursor-grabbing" : "cursor-grab"}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => setSelectedNode(null)}
        style={{
          backgroundImage: "radial-gradient(var(--gray-200) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundPosition: `${position.x}px ${position.y}px`,
        }}
      >
        <div
          className="absolute left-1/2 top-1/2 w-0 h-0 will-change-transform"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging || dragNodeId ? "none" : "transform 0.1s ease-out",
          }}
        >
          {/* SVG Edges */}
          <svg className="overflow-visible pointer-events-none absolute left-0 top-0">
            {filteredEdges.map((edge) => {
              const source = nodeMap.get(edge.source);
              const target = nodeMap.get(edge.target);
              if (!source || !target) return null;

              const style = getEdgeStyle(edge.type);
              const isDimmed =
                isNodeDimmed(edge.source) || isNodeDimmed(edge.target);

              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={style.stroke}
                  strokeWidth={style.width}
                  strokeDasharray={style.dash}
                  opacity={isDimmed ? 0.05 : edge.type === "same-notebook" ? 0.15 : 0.5}
                  className="transition-opacity duration-300"
                />
              );
            })}
          </svg>

          {/* HTML Nodes */}
          {simNodes.map((node) => {
            const mastery = getMasteryColor(node.masteryLevel);
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode?.id === node.id;
            const dimmed = isNodeDimmed(node.id);
            const now = new Date();
            const isDue =
              node.nextReview && new Date(node.nextReview) <= now;

            return (
              <div
                key={node.id}
                className={`interactive-node absolute transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300 ${dimmed ? "opacity-[0.08]" : "opacity-100"
                  }`}
                style={{ left: node.x, top: node.y }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onClick={(e) => handleNodeClick(node, e)}
              >
                {/* Glow ring */}
                {(isHovered || isSelected || isDue) && !dimmed && (
                  <div
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${isDue ? "animate-pulse" : ""}`}
                    style={{
                      width: node.radius * 2 + 16,
                      height: node.radius * 2 + 16,
                      background: mastery.glow,
                    }}
                  />
                )}
                {/* Node circle */}
                <div
                  className={`relative rounded-full cursor-pointer shadow-md transition-transform duration-150 ${isHovered && !dimmed ? "scale-150 z-50" : ""
                    } ${isSelected ? "ring-2 ring-white ring-offset-2 z-50" : ""}`}
                  style={{
                    width: node.radius * 2,
                    height: node.radius * 2,
                    backgroundColor: mastery.bg,
                    border: `2px solid ${isSelected ? "#fff" : "transparent"}`,
                  }}
                />
                {/* Word label (visible on hover or search match) */}
                {(isHovered || (searchMatch?.has(node.id) && !dimmed)) && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full pointer-events-none z-50">
                    <div className="px-2.5 py-1 bg-gray-900 text-white text-[11px] font-bold rounded-lg shadow-lg whitespace-nowrap">
                      {node.word}
                      <span className="ml-1.5 text-[9px] font-normal text-gray-400">
                        {node.pronunciation}
                      </span>
                    </div>
                    <div className="w-2 h-2 bg-gray-900 rotate-45 mx-auto -mt-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Detail Panel ─── */}
      {selectedNode && (
        <KnowledgeGraphDetail
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onNavigate={(wordId: string) => {
            const n = data.nodes.find((nn) => nn.id === wordId);
            if (n) setSelectedNode(n);
          }}
          allNodes={data.nodes}
          edges={data.edges}
        />
      )}

      {/* Simulation indicator */}
      {isSimulating && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 bg-background/80 backdrop-blur-md border border-border/60 rounded-full text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Arranging nodes...
        </div>
      )}
    </div>
  );
}
