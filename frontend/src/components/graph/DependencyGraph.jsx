import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { getGraph, getNode, getImpact } from '../../services/api';
import NodeInspector from './NodeInspector';
import GraphControls from './GraphControls';
import { Search, X, Filter, Circle } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';

const NODE_COLORS = {
  file: '#6366f1',
  external: '#f59e0b',
  class: '#10b981',
  function: '#8b5cf6'
};

export default function DependencyGraph({ projectId, initialSelectedNode, onNodeSelect }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(initialSelectedNode);
  const [nodeDetails, setNodeDetails] = useState(null);
  const [impactData, setImpactData] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: 'all', language: 'all', edgeType: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('2D');
  const [hoverNode, setHoverNode] = useState(null);

  const fgRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerNodeRef = useRef(null);
  const containerRef = useCallback(node => {
    if (containerNodeRef.current && containerNodeRef.current._ro) {
      containerNodeRef.current._ro.disconnect();
    }
    containerNodeRef.current = node;
    
    if (node) {
      const updateDimensions = () => {
        const { clientWidth, clientHeight } = node;
        if (clientWidth > 0 && clientHeight > 0) {
          setDimensions(prev => 
            (prev.width !== clientWidth || prev.height !== clientHeight)
              ? { width: clientWidth, height: clientHeight }
              : prev
          );
        }
      };
      
      // Instantly capture dimensions to ensure immediate graph initialization
      updateDimensions();
      
      const ro = new ResizeObserver(() => {
        window.requestAnimationFrame(updateDimensions);
      });
      ro.observe(node);
      node._ro = ro;
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await getGraph(projectId);
        setGraphData(res.data);
      } catch (err) {
        console.error('Failed to load graph:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  // Effect 1: Configure D3 Physics
  useEffect(() => {
    if (fgRef.current && viewMode === '2D' && dimensions.width > 0 && dimensions.height > 0) {
      fgRef.current.d3Force('charge').strength(-400).distanceMax(800);
      fgRef.current.d3Force('link').distance(80);
      
      const collideForce = fgRef.current.d3Force('collide');
      if (collideForce) {
        collideForce.radius(node => {
          const labelWidth = (node.label?.length || 10) * 6 + 24;
          return labelWidth / 2 + 10;
        }).iterations(2);
      }
    }
  }, [viewMode, graphData, dimensions.width, dimensions.height]);

  // Effect 2: Reheat Simulation and Center Camera
  useEffect(() => {
    if (graphData && dimensions.width > 0 && dimensions.height > 0 && fgRef.current) {
      let timer;
      const frame = requestAnimationFrame(() => {
        if (fgRef.current && fgRef.current.d3ReheatSimulation && viewMode === '2D') {
          fgRef.current.d3ReheatSimulation();
        }
        
        if (fgRef.current && fgRef.current.zoomToFit) {
          timer = setTimeout(() => {
            if (fgRef.current && fgRef.current.zoomToFit) {
              fgRef.current.zoomToFit(800, 50);
            }
          }, 300);
        }
      });

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(timer);
      };
    }
  }, [graphData, dimensions.width, dimensions.height, viewMode]);

  async function handleNodeClick(node) {
    if (node) {
      setSelectedNode(node);
      setImpactData(null);
      
      // Camera animation
      if (fgRef.current) {
        if (viewMode === '2D') {
          fgRef.current.centerAt(node.x, node.y, 1000);
          fgRef.current.zoom(3, 1000); // aggressive zoom to trigger labels
        } else if (viewMode === '3D' && node.x !== undefined) {
          const distance = 80;
          const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z || 0);
          fgRef.current.cameraPosition(
            { x: node.x * distRatio, y: node.y * distRatio, z: (node.z || 0) * distRatio },
            node,
            1000
          );
        }
      }

      try {
        const res = await getNode(projectId, node.id);
        setNodeDetails(res.data);
      } catch {
        setNodeDetails(node);
      }
      onNodeSelect?.(node);
    }
  }

  async function handleImpactAnalysis() {
    if (!selectedNode) return;
    try {
      const res = await getImpact(projectId, selectedNode.id);
      setImpactData(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  const filteredNodes = useMemo(() => {
    if (!graphData) return [];
    let nodes = graphData.nodes;
    if (filters.type !== 'all') nodes = nodes.filter(n => n.type === filters.type);
    if (filters.language !== 'all') nodes = nodes.filter(n => n.language === filters.language);
    if (search) {
      const q = search.toLowerCase();
      nodes = nodes.filter(n => n.label?.toLowerCase().includes(q) || n.id?.toLowerCase().includes(q));
    }
    return nodes;
  }, [graphData, filters, search]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.filter(e => {
      const srcId = e.source.id || e.source;
      const tgtId = e.target.id || e.target;
      if (!filteredNodeIds.has(srcId) || !filteredNodeIds.has(tgtId)) return false;
      if (filters.edgeType !== 'all' && e.type !== filters.edgeType) return false;
      return true;
    });
  }, [graphData, filteredNodeIds, filters.edgeType]);

  const forceGraphData = useMemo(() => {
    const nodeDegrees = new Map();
    const inDegrees = new Map();
    const outDegrees = new Map();

    filteredEdges.forEach(e => {
      const src = e.source.id || e.source;
      const tgt = e.target.id || e.target;
      
      nodeDegrees.set(src, (nodeDegrees.get(src) || 0) + 1);
      nodeDegrees.set(tgt, (nodeDegrees.get(tgt) || 0) + 1);
      
      outDegrees.set(src, (outDegrees.get(src) || 0) + 1);
      inDegrees.set(tgt, (inDegrees.get(tgt) || 0) + 1);
    });

    let maxDegree = 0;
    nodeDegrees.forEach(deg => { if (deg > maxDegree) maxDegree = deg; });
    const criticalThreshold = Math.max(5, maxDegree * 0.5); // Top percentile

    // Enrich existing node objects rather than mapping to clones.
    // This preserves react-force-graph internal state (x, y, vx, vy)
filteredNodes.forEach(n => {
  const degree = nodeDegrees.get(n.id) || 0;
  n.degree = degree;
  n.inDegree = inDegrees.get(n.id) || 0;
  n.outDegree = outDegrees.get(n.id) || 0;
  n.isCritical = degree >= criticalThreshold;
});

    return {
      nodes: filteredNodes,
      links: filteredEdges
    };
  }, [filteredNodes, filteredEdges]);

  const impactNodeIds = useMemo(() => {
    if (!impactData) return new Set();
    return new Set([impactData.nodeId, ...impactData.directImpact, ...impactData.indirectImpact]);
  }, [impactData]);

  const { highlightNodes, highlightLinks, selectedNeighbors, selectedNeighborLinks } = useMemo(() => {
    const hNodes = new Set();
    const hLinks = new Set();
    const sNodes = new Set();
    const sLinks = new Set();
    
    forceGraphData.links.forEach(link => {
      const src = link.source.id || link.source;
      const tgt = link.target.id || link.target;
      const linkId = `${src}->${tgt}`;
      
      if (hoverNode) {
        if (src === hoverNode.id || tgt === hoverNode.id) {
          hNodes.add(src);
          hNodes.add(tgt);
          hLinks.add(linkId);
        }
      }
      
      if (selectedNode) {
        if (src === selectedNode.id || tgt === selectedNode.id) {
          sNodes.add(src);
          sNodes.add(tgt);
          sLinks.add(linkId);
        }
      }
    });

    return { highlightNodes: hNodes, highlightLinks: hLinks, selectedNeighbors: sNodes, selectedNeighborLinks: sLinks };
  }, [hoverNode, selectedNode, forceGraphData]);

  const searchResults = useMemo(() => {
    if (!search || !graphData) return [];
    const q = search.toLowerCase();
    return graphData.nodes
      .filter(n => n.label?.toLowerCase().includes(q) || n.id?.toLowerCase().includes(q))
      .slice(0, 10);
  }, [search, graphData]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[#6b7280] text-sm">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-[#6b7280]">No graph data available</div>;
  }

  const handleNodeHover = node => setHoverNode(node || null);

  // Focus and styling logic
  const isNodeFaded = (nodeId) => {
    if (impactData && !impactNodeIds.has(nodeId)) return true;
    if (selectedNode && !selectedNeighbors.has(nodeId) && selectedNode.id !== nodeId) return true;
    if (!selectedNode && hoverNode && !highlightNodes.has(nodeId) && hoverNode.id !== nodeId) return true;
    return false;
  };

  const isLinkFaded = (linkId, sourceId, targetId) => {
    if (impactData && (!impactNodeIds.has(sourceId) || !impactNodeIds.has(targetId))) return true;
    if (selectedNode && !selectedNeighborLinks.has(linkId)) return true;
    if (!selectedNode && hoverNode && !highlightLinks.has(linkId)) return true;
    return false;
  };

  const getEdgeColor = (linkId, sourceId, targetId) => {
    if (impactData && impactNodeIds.has(sourceId) && impactNodeIds.has(targetId)) return '#f59e0b';
    if (selectedNode && selectedNeighborLinks.has(linkId)) return '#ffffff';
    if (hoverNode && highlightLinks.has(linkId)) return '#38bdf8';
    return isLinkFaded(linkId, sourceId, targetId) ? '#11111a' : '#4a4a5a88'; // Subtly visible for normal edges
  };

  const commonProps = {
    ref: fgRef,
    width: dimensions.width,
    height: dimensions.height,
    graphData: forceGraphData,
    nodeId: "id",
    nodeLabel: viewMode === '3D' ? "label" : null, // Disable tooltips in 2D to use smart labels
    linkColor: link => {
      const sourceId = link.source.id || link.source;
      const targetId = link.target.id || link.target;
      return getEdgeColor(`${sourceId}->${targetId}`, sourceId, targetId);
    },
    linkWidth: link => {
      const sourceId = link.source.id || link.source;
      const targetId = link.target.id || link.target;
      return isLinkFaded(`${sourceId}->${targetId}`, sourceId, targetId) ? 0.2 : (selectedNode || hoverNode) ? 1.5 : 1;
    },
    linkDirectionalArrowLength: 4,
    linkDirectionalArrowRelPos: 1,
    linkDirectionalParticles: link => {
      const sourceId = link.source.id || link.source;
      const targetId = link.target.id || link.target;
      const linkId = `${sourceId}->${targetId}`;
      if (impactData && impactNodeIds.has(sourceId) && impactNodeIds.has(targetId)) return 2;
      if (selectedNode && selectedNeighborLinks.has(linkId)) return 2;
      if (hoverNode && highlightLinks.has(linkId)) return 4;
      return 0; // No particles for inactive edges
    },
    linkDirectionalParticleWidth: 2,
    onNodeClick: handleNodeClick,
    onNodeHover: handleNodeHover,
    backgroundColor: "#05050a"
  };

  const props2D = {
    ...commonProps,
    warmupTicks: 100,
    cooldownTicks: 200,
    d3VelocityDecay: 0.3,
    nodeRelSize: 8, // Increase base size for better spacing
    nodeCanvasObject: (node, ctx, globalScale) => {
      const faded = isNodeFaded(node.id);
      const selected = selectedNode?.id === node.id;
      
      let borderColor = NODE_COLORS[node.type] || '#6366f1';
      let bgColor = '#13131a';
      let textColor = '#e2e2f0';
      const metaColor = '#6b7280';

      if (faded) {
        borderColor = '#11111a';
        bgColor = '#05050a'; // Match background
        textColor = '#2a2a3a';
      } else if (selected) {
        borderColor = '#ffffff';
        bgColor = '#2a2a3a';
      } else if (impactData && impactNodeIds.has(node.id)) {
        borderColor = '#f59e0b';
      } else if (!selectedNode && hoverNode && highlightNodes.has(node.id)) {
        borderColor = '#38bdf8';
      }

      let w, h;
      let showText = true;
      let showMeta = false;

      if (globalScale < 0.6) {
        // Zoomed Out: Small square
        showText = false;
        w = Math.max(6, Math.min(16, (node.degree || 1) * 2));
        h = w;
      } else if (globalScale > 2 && !faded) {
        // Close Zoom: Detailed card
        showMeta = true;
        ctx.font = '12px Sans-Serif';
        const textWidth = ctx.measureText(node.label).width;
        ctx.font = '9px Sans-Serif';
        const metaText = `In: ${node.inDegree || 0} | Out: ${node.outDegree || 0}`;
        const metaWidth = ctx.measureText(metaText).width;
        w = Math.max(textWidth, metaWidth) + 24;
        h = 36;
      } else {
        // Medium Zoom: Filename only
        ctx.font = '12px Sans-Serif';
        const textWidth = ctx.measureText(node.label).width;
        w = textWidth + 24;
        h = 24;
      }
      
      const x = node.x - w / 2;
      const y = node.y - h / 2;
      const r = 4; // border radius

      // Draw rounded rectangle
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();

      ctx.fillStyle = bgColor;
      ctx.fill();

      // Border override
      if (node.isCritical && !faded) {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#e2e2f0';
      } else {
        ctx.lineWidth = selected ? 1.5 : (globalScale < 0.6 ? 0.5 : 1);
        ctx.strokeStyle = borderColor;
      }
      ctx.stroke();

      // Draw text
      if (showText && (globalScale >= 0.5 || !faded)) {
        ctx.textAlign = 'center';
        
        if (showMeta) {
          ctx.textBaseline = 'bottom';
          ctx.font = '12px Sans-Serif';
          ctx.fillStyle = textColor;
          ctx.fillText(node.label, node.x, node.y + 1);
          
          ctx.textBaseline = 'top';
          ctx.font = '9px Sans-Serif';
          ctx.fillStyle = metaColor;
          ctx.fillText(`In: ${node.inDegree || 0}   Out: ${node.outDegree || 0}`, node.x, node.y + 3);
        } else {
          ctx.textBaseline = 'middle';
          ctx.font = '12px Sans-Serif';
          ctx.fillStyle = textColor;
          ctx.fillText(node.label, node.x, node.y);
        }
      }
      
      // Store bounding box for click detection
      node.__bckgDimensions = [w, h];
    },
    nodePointerAreaPaint: (node, color, ctx) => {
      const bckgDimensions = node.__bckgDimensions || [20, 20];
      ctx.fillStyle = color;
      const x = node.x - bckgDimensions[0] / 2;
      const y = node.y - bckgDimensions[1] / 2;
      ctx.fillRect(x, y, bckgDimensions[0], bckgDimensions[1]);
    }
  };

  const props3D = {
    ...commonProps,
    nodeVal: node => Math.max(2, Math.min(node.degree || 1, 15)),
    nodeColor: node => {
      const faded = isNodeFaded(node.id);
      if (faded) return '#11111a';
      if (selectedNode?.id === node.id) return '#ffffff';
      if (impactData && impactNodeIds.has(node.id)) return '#f59e0b';
      if (!selectedNode && hoverNode && highlightNodes.has(node.id)) return '#38bdf8';
      return NODE_COLORS[node.type] || '#6366f1';
    },
    nodeRelSize: 4
  };

  return (
    <div className="flex-1 flex w-full h-full overflow-hidden">
      {/* Main panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 p-4 border-b border-[#2a2a3a]">
          {/* Search */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg px-3 py-2 w-64">
              <Search size={14} className="text-[#6b7280]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search nodes..."
                className="flex-1 bg-transparent text-sm outline-none text-[#e2e2f0] placeholder-[#4a4a5a]"
              />
              {search && (
                <button onClick={() => setSearch('')}><X size={12} className="text-[#6b7280]" /></button>
              )}
            </div>
            {searchResults.length > 0 && search && (
              <div className="absolute top-full mt-1 left-0 w-64 bg-[#13131a] border border-[#2a2a3a] rounded-lg overflow-hidden shadow-xl z-20">
                {searchResults.map(node => (
                  <button
                    key={node.id}
                    onClick={() => { handleNodeClick(node); setSearch(''); }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#1a1a24] transition-colors flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: NODE_COLORS[node.type] || '#6366f1' }} />
                    <span className="truncate">{node.label}</span>
                    <span className="text-[#6b7280] text-xs ml-auto">{node.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
              showFilters ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-[#13131a] border-[#2a2a3a] text-[#6b7280] hover:text-[#e2e2f0]'
            }`}
          >
            <Filter size={14} /> Filters
          </button>

          <div className="flex bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg overflow-hidden ml-2">
            <button
              onClick={() => setViewMode('2D')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === '2D' ? 'bg-indigo-600 text-white' : 'text-[#a0a0b0] hover:text-[#e2e2f0]'}`}
            >
              2D
            </button>
            <button
              onClick={() => setViewMode('3D')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === '3D' ? 'bg-indigo-600 text-white' : 'text-[#a0a0b0] hover:text-[#e2e2f0]'}`}
            >
              3D
            </button>
          </div>

          <div className="ml-auto text-xs text-[#6b7280] flex gap-3">
            <span><span className="text-[#e2e2f0]">{filteredNodes.length}</span> nodes</span>
            <span><span className="text-[#e2e2f0]">{filteredEdges.length}</span> edges</span>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Filter sidebar */}
          {showFilters && (
            <div className="w-48 border-r border-[#2a2a3a] p-4 bg-[#0d0d14] overflow-y-auto shrink-0">
              <GraphControls filters={filters} onChange={setFilters} graph={graphData} />
            </div>
          )}

          {/* Graph Visualization */}
          <div className="flex-1 w-full h-full overflow-hidden relative bg-[#05050a]" ref={containerRef}>
            
            {/* Legend Panel */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 bg-[#13131a]/90 backdrop-blur border border-[#2a2a3a] p-4 rounded-xl shadow-lg w-48">
              
              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-2 font-semibold">Node Types</h4>
                <div className="space-y-1.5">
                  {Object.entries(NODE_COLORS).map(([type, color]) => (
                    <div key={type} className="flex items-center gap-2 text-xs text-[#e2e2f0]">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="capitalize">{type}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 text-xs text-[#e2e2f0]">
                    <div className="w-3 h-3 rounded-full border-[1.5px] border-[#e2e2f0] bg-transparent" />
                    <span>Critical Module</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-[#2a2a3a] w-full" />

              <div>
                <h4 className="text-[10px] uppercase tracking-wider text-[#6b7280] mb-2 font-semibold">Interactions</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-[#e2e2f0]">
                    <div className="w-3 h-3 rounded-full bg-white ring-2 ring-indigo-500/50" />
                    <span>Selected (Focus Mode)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#e2e2f0]">
                    <div className="w-3 h-3 rounded-full bg-[#38bdf8]" />
                    <span>Hovered / Neighbor</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#e2e2f0]">
                    <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                    <span>Impacted</span>
                  </div>
                </div>
              </div>

            </div>

            {filteredNodes.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#6b7280]">
                <Circle size={24} className="mb-2 text-[#3a3a5a]" />
                <p className="text-sm">No nodes match the current filters</p>
              </div>
            ) : (
              dimensions.width > 0 && dimensions.height > 0 && (
                viewMode === '2D' ? (
                  <ForceGraph2D {...props2D} 
                  warmupTicks={200}
                  cooldownTicks={300}
                  onEngineStop={() => {
    fgRef.current?.zoomToFit(800, 80);
}}
                  />
                ) : (
                  <ForceGraph3D {...props3D} />
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* Node Inspector */}
      {selectedNode && (
        <NodeInspector
          node={nodeDetails || selectedNode}
          impactData={impactData}
          onImpactAnalysis={handleImpactAnalysis}
          onClose={() => { setSelectedNode(null); setNodeDetails(null); setImpactData(null); }}
          onNodeSelect={handleNodeClick}
          graph={graphData}
        />
      )}
    </div>
  );
}
