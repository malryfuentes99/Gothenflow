import { useState, useRef, useEffect } from 'react';
import { OptimizationZone } from './DelhiTrafficMap';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Milestone,
  Zap,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Layers,
  Play,
  Pause,
} from 'lucide-react';

interface Props {
  zones: OptimizationZone[];
}

interface Phase {
  id: string;
  name: string;
  shortName: string;
  startMonth: number;
  durationMonths: number;
  color: string;
  type: 'work' | 'gate';
  risk?: 'low' | 'medium' | 'high';
  description: string;
}

interface ZonePlan {
  zone: OptimizationZone;
  interventionType: string;
  phases: Phase[];
  totalMonths: number;
}

function getInterventionType(zone: OptimizationZone) {
  if (zone.intervention.includes('Metro')) return 'metro';
  if (zone.intervention.includes('Bicycle')) return 'bicycle';
  return 'bus';
}

function buildZonePlan(zone: OptimizationZone, offsetMonth: number): ZonePlan {
  const type = getInterventionType(zone);
  const phases: Phase[] = [];
  let m = offsetMonth;

  // Phase 1: Survey & Design
  phases.push({ id: `${zone.id}-survey`, name: 'Survey & Design', shortName: 'Design', startMonth: m, durationMonths: type === 'metro' ? 3 : type === 'bus' ? 2 : 1.5, color: '#6366f1', type: 'work', description: 'Site surveys, traffic analysis, technical design' });
  m += phases[phases.length - 1].durationMonths;

  // Gate 1: City Plan Approval
  phases.push({ id: `${zone.id}-plan`, name: 'City Plan Approval', shortName: 'Plan', startMonth: m, durationMonths: 1.5, color: '#f59e0b', type: 'gate', risk: 'medium', description: 'City Planning Office zoning approval' });
  m += phases[phases.length - 1].durationMonths;

  // Phase 2: Regulatory
  phases.push({ id: `${zone.id}-reg`, name: 'Regulatory Clearance', shortName: 'Regulatory', startMonth: m, durationMonths: type === 'metro' ? 4 : type === 'bus' ? 2 : 1.5, color: '#3b82f6', type: 'work', description: 'Environmental clearance, land acquisition, safety certification' });
  m += phases[phases.length - 1].durationMonths;

  // Gate 2: City Council (only metro/bus with big scope)
  if (type === 'metro' || type === 'bus') {
    phases.push({ id: `${zone.id}-council`, name: 'City Council Approval', shortName: 'Council', startMonth: m, durationMonths: type === 'metro' ? 2 : 1.5, color: '#ef4444', type: 'gate', risk: 'high', description: 'City Council + regional authority consent' });
    m += phases[phases.length - 1].durationMonths;
  }

  // Phase 3: Procurement
  phases.push({ id: `${zone.id}-procure`, name: 'Tendering & Procurement', shortName: 'Procure', startMonth: m, durationMonths: type === 'metro' ? 3 : type === 'bus' ? 2 : 1, color: '#8b5cf6', type: 'work', description: 'Tender publication, bid evaluation, contract signing' });
  m += phases[phases.length - 1].durationMonths;

  // Gate 3: Procurement Audit
  phases.push({ id: `${zone.id}-audit`, name: 'Procurement Audit', shortName: 'Audit', startMonth: m, durationMonths: 1, color: '#f97316', type: 'gate', risk: 'medium', description: 'Procurement compliance and audit review' });
  m += phases[phases.length - 1].durationMonths;

  // Phase 4: Construction
  const constructionDuration = type === 'metro' ? 12 : type === 'bus' ? 4 : 3;
  phases.push({ id: `${zone.id}-build`, name: 'Construction', shortName: 'Build', startMonth: m, durationMonths: constructionDuration, color: '#10b981', type: 'work', description: type === 'metro' ? 'Tunneling, track laying, station construction' : type === 'bus' ? 'Bus procurement, stop construction, route setup' : 'Path construction, station installation' });
  m += constructionDuration;

  // Phase 5: Testing
  phases.push({ id: `${zone.id}-test`, name: 'Testing & Commissioning', shortName: 'Test', startMonth: m, durationMonths: type === 'metro' ? 2 : 1, color: '#06b6d4', type: 'work', description: 'Safety testing, trial runs, staff training' });
  m += phases[phases.length - 1].durationMonths;

  // Gate 4: Operational clearance
  phases.push({ id: `${zone.id}-launch-gate`, name: 'Operational Clearance', shortName: 'Clear', startMonth: m, durationMonths: 0.5, color: '#22c55e', type: 'gate', risk: 'low', description: 'Transport dept. license, fire/safety clearance' });
  m += 0.5;

  // Launch
  phases.push({ id: `${zone.id}-launch`, name: 'Public Launch', shortName: 'Launch', startMonth: m, durationMonths: 0.5, color: '#ec4899', type: 'work', description: 'Soft launch, public awareness, monitoring' });
  m += 0.5;

  return { zone, interventionType: type, phases, totalMonths: m - offsetMonth };
}

// Stagger zones: quick ones can start earlier, metro later
function buildGlobalPlan(zones: OptimizationZone[]): ZonePlan[] {
  // Sort: bicycle first (fastest), bus second, metro last
  const sorted = [...zones].sort((a, b) => {
    const order = { bicycle: 0, bus: 1, metro: 2 };
    return (order[getInterventionType(a) as keyof typeof order] ?? 1) - (order[getInterventionType(b) as keyof typeof order] ?? 1);
  });

  const plans: ZonePlan[] = [];
  let currentOffset = 0;
  let lastType = '';

  for (const zone of sorted) {
    const type = getInterventionType(zone);
    // Same type zones can start in parallel (offset by 1 month)
    // Different type groups get staggered by 2 months
    if (type !== lastType && plans.length > 0) {
      currentOffset += 2;
    } else if (plans.length > 0) {
      currentOffset += 1;
    }
    lastType = type;
    plans.push(buildZonePlan(zone, currentOffset));
  }

  return plans;
}

type ViewMode = 'gantt' | 'tree';

export default function GlobalImplementationPlan({ zones }: Props) {
  const [expandedZone, setExpandedZone] = useState<string | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationMonth, setAnimationMonth] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const [treeHovered, setTreeHovered] = useState<string | null>(null);
  const [treeAnimProgress, setTreeAnimProgress] = useState(0);
  const [isTreeAnimating, setIsTreeAnimating] = useState(false);
  const treeAnimRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const plans = buildGlobalPlan(zones);
  const maxMonth = Math.max(...plans.map(p => {
    const lastPhase = p.phases[p.phases.length - 1];
    return lastPhase.startMonth + lastPhase.durationMonths;
  }));
  const totalGates = plans.reduce((s, p) => s + p.phases.filter(ph => ph.type === 'gate').length, 0);
  const criticalPathMonths = Math.ceil(maxMonth);
  const totalMonths = criticalPathMonths;
  const parallelStreams = new Set(plans.map(p => p.interventionType)).size;

  // Chart dimensions
  const rowHeight = 56;
  const labelWidth = 200;
  const chartPadding = 24;
  const monthWidth = Math.max(40, (800 - labelWidth) / totalMonths);
  const chartWidth = labelWidth + totalMonths * monthWidth + chartPadding * 2;
  const chartHeight = plans.length * rowHeight + 100;

  const riskColors = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
  const typeIcons: Record<string, string> = { metro: '🚇', bus: '🚌', bicycle: '🚲' };

  // Animation
  useEffect(() => {
    if (isAnimating) {
      const tick = () => {
        setAnimationMonth(prev => {
          if (prev >= totalMonths) {
            setIsAnimating(false);
            return totalMonths;
          }
          return prev + 0.05;
        });
        animRef.current = requestAnimationFrame(tick);
      };
      animRef.current = requestAnimationFrame(tick);
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }
  }, [isAnimating, totalMonths]);

  const toggleAnimation = () => {
    if (animationMonth >= totalMonths) setAnimationMonth(0);
    setIsAnimating(!isAnimating);
  };

  // Tree animation
  useEffect(() => {
    if (isTreeAnimating) {
      const tick = () => {
        setTreeAnimProgress(prev => {
          if (prev >= 100) { setIsTreeAnimating(false); return 100; }
          return prev + 0.4;
        });
        treeAnimRef.current = requestAnimationFrame(tick);
      };
      treeAnimRef.current = requestAnimationFrame(tick);
      return () => { if (treeAnimRef.current) cancelAnimationFrame(treeAnimRef.current); };
    }
  }, [isTreeAnimating]);

  const toggleTreeAnim = () => {
    if (treeAnimProgress >= 100) setTreeAnimProgress(0);
    setIsTreeAnimating(!isTreeAnimating);
  };

  // Build tree layout data
  const buildTreeNodes = () => {
    // Root node
    const nodeW = 140, nodeH = 48, gateW = 120, gateH = 44;
    const treeW = 1200;
    // Unique phases across all plans (by shortName)
    const phaseOrder = ['Design', 'Plan', 'Regulatory', 'Council', 'Procure', 'Audit', 'Build', 'Test', 'Clear', 'Launch'];
    // Group zones by intervention type
    const groups: Record<string, ZonePlan[]> = {};
    for (const p of plans) {
      if (!groups[p.interventionType]) groups[p.interventionType] = [];
      groups[p.interventionType].push(p);
    }
    const groupKeys = Object.keys(groups);

    type TreeNode = { id: string; label: string; sublabel?: string; x: number; y: number; w: number; h: number; color: string; type: 'root' | 'group' | 'work' | 'gate'; risk?: 'low' | 'medium' | 'high'; children: string[]; phaseIndex: number };
    const nodes: TreeNode[] = [];
    const edges: { from: string; to: string }[] = [];

    // Root
    const rootX = treeW / 2;
    nodes.push({ id: 'root', label: 'GTOP Programme', sublabel: `${plans.length} zones • ${criticalPathMonths}mo`, x: rootX, y: 40, w: 180, h: 52, color: '#4f46e5', type: 'root', children: groupKeys.map(g => `group-${g}`), phaseIndex: -1 });

    // Group nodes (transport type branches)
    const groupSpacing = treeW / (groupKeys.length + 1);
    groupKeys.forEach((gk, gi) => {
      const gx = groupSpacing * (gi + 1);
      const gy = 130;
      const icon = typeIcons[gk] || '🚍';
      nodes.push({ id: `group-${gk}`, label: `${icon} ${gk.charAt(0).toUpperCase() + gk.slice(1)}`, sublabel: `${groups[gk].length} zone${groups[gk].length > 1 ? 's' : ''}`, x: gx, y: gy, w: 150, h: 48, color: gk === 'metro' ? '#dc2626' : gk === 'bicycle' ? '#059669' : '#2563eb', type: 'group', children: [], phaseIndex: -1 });
      edges.push({ from: 'root', to: `group-${gk}` });

      // For each zone in this group, lay out phases vertically
      const zoneSpacing = 220;
      const startX = gx - ((groups[gk].length - 1) * zoneSpacing) / 2;

      groups[gk].forEach((plan, zi) => {
        const zx = startX + zi * zoneSpacing;
        let prevId = `group-${gk}`;

        plan.phases.forEach((phase, pi) => {
          const ny = 220 + pi * 70;
          const nid = `${plan.zone.id}-${phase.id}`;
          const isGate = phase.type === 'gate';
          nodes.push({
            id: nid,
            label: phase.shortName,
            sublabel: `M${Math.ceil(phase.startMonth)}-${Math.ceil(phase.startMonth + phase.durationMonths)}`,
            x: zx,
            y: ny,
            w: isGate ? gateW : nodeW,
            h: isGate ? gateH : nodeH,
            color: phase.color,
            type: isGate ? 'gate' : 'work',
            risk: phase.risk,
            children: [],
            phaseIndex: pi,
          });
          edges.push({ from: prevId, to: nid });
          if (pi === 0) {
            // Connect group to first phase
            const gNode = nodes.find(n => n.id === `group-${gk}`);
            if (gNode) gNode.children.push(nid);
          }
          prevId = nid;
        });
      });
    });

    return { nodes, edges };
  };

  const treeData = buildTreeNodes();
  const treeHeight = 220 + (Math.max(...plans.map(p => p.phases.length)) * 70) + 60;

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl text-gray-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" />
            Global Implementation Plan
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Orchestrated timeline across all {zones.length} intervention zones
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('gantt')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${viewMode === 'gantt' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Gantt Chart
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors ${viewMode === 'tree' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dependency Tree
            </button>
          </div>
          <button
            onClick={viewMode === 'gantt' ? toggleAnimation : toggleTreeAnim}
            className="flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {(viewMode === 'gantt' ? isAnimating : isTreeAnimating) ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {(viewMode === 'gantt' ? isAnimating : isTreeAnimating) ? 'Pause' : 'Simulate'}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
          <div className="text-xs text-gray-500">Critical Path</div>
          <div className="text-xl text-indigo-700">{criticalPathMonths} months</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
          <div className="text-xs text-gray-500">Political Gates</div>
          <div className="text-xl text-amber-700">{totalGates} approvals</div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
          <div className="text-xs text-gray-500">Parallel Streams</div>
          <div className="text-xl text-emerald-700">{parallelStreams} workstreams</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
          <div className="text-xs text-gray-500">Zone Interventions</div>
          <div className="text-xl text-purple-700">{plans.length} zones</div>
        </div>
      </div>

      {viewMode === 'gantt' ? (
        <>
      {/* Interactive Gantt Chart */}
      <div className="border border-gray-200 rounded-xl overflow-hidden" ref={containerRef}>
        <div className="overflow-x-auto">
          <svg width={chartWidth} height={chartHeight} className="min-w-full">
            {/* Background */}
            <rect width={chartWidth} height={chartHeight} fill="#fafbfc" />

            {/* Month columns */}
            {Array.from({ length: totalMonths + 1 }, (_, i) => (
              <g key={`month-${i}`}>
                <line
                  x1={labelWidth + i * monthWidth}
                  y1={0}
                  x2={labelWidth + i * monthWidth}
                  y2={chartHeight}
                  stroke={i % 6 === 0 ? '#d1d5db' : '#f3f4f6'}
                  strokeWidth={i % 6 === 0 ? 1.5 : 1}
                />
                <text
                  x={labelWidth + i * monthWidth + monthWidth / 2}
                  y={20}
                  textAnchor="middle"
                  fill="#6b7280"
                  fontSize={11}
                >
                  {i % 3 === 0 ? `M${i}` : ''}
                </text>
                {i % 6 === 0 && i > 0 && (
                  <text
                    x={labelWidth + i * monthWidth}
                    y={36}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize={9}
                  >
                    Yr {(i / 12).toFixed(1)}
                  </text>
                )}
              </g>
            ))}

            {/* Animation playhead */}
            {animationMonth > 0 && (
              <line
                x1={labelWidth + animationMonth * monthWidth}
                y1={40}
                x2={labelWidth + animationMonth * monthWidth}
                y2={chartHeight}
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="6,3"
                opacity={0.8}
              />
            )}

            {/* Zone rows */}
            {plans.map((plan, rowIndex) => {
              const y = 48 + rowIndex * rowHeight;
              const isExpanded = expandedZone === plan.zone.id;

              return (
                <g key={plan.zone.id}>
                  {/* Row background */}
                  <rect
                    x={0}
                    y={y}
                    width={chartWidth}
                    height={rowHeight - 4}
                    fill={rowIndex % 2 === 0 ? '#ffffff' : '#f9fafb'}
                    rx={0}
                  />

                  {/* Zone label */}
                  <g
                    className="cursor-pointer"
                    onClick={() => setExpandedZone(isExpanded ? null : plan.zone.id)}
                  >
                    <rect x={0} y={y} width={labelWidth} height={rowHeight - 4} fill="transparent" />
                    <text x={12} y={y + 20} fill="#1f2937" fontSize={12} fontWeight={600}>
                      {typeIcons[plan.interventionType]} {plan.zone.name.length > 16 ? plan.zone.name.slice(0, 16) + '…' : plan.zone.name}
                    </text>
                    <text x={12} y={y + 36} fill="#6b7280" fontSize={10}>
                      {plan.zone.intervention.length > 24 ? plan.zone.intervention.slice(0, 24) + '…' : plan.zone.intervention}
                    </text>
                    <text x={labelWidth - 16} y={y + 28} fill="#9ca3af" fontSize={10} textAnchor="end">
                      {Math.ceil(plan.totalMonths)}mo
                    </text>
                  </g>

                  {/* Phase bars */}
                  {plan.phases.map(phase => {
                    const barX = labelWidth + phase.startMonth * monthWidth;
                    const barWidth = Math.max(phase.durationMonths * monthWidth - 2, 8);
                    const barY = y + 8;
                    const barH = phase.type === 'gate' ? rowHeight - 24 : rowHeight - 20;
                    const isHovered = hoveredPhase === phase.id;
                    const isPast = animationMonth >= phase.startMonth + phase.durationMonths;
                    const isActive = animationMonth >= phase.startMonth && animationMonth < phase.startMonth + phase.durationMonths;
                    const progressFrac = isActive
                      ? (animationMonth - phase.startMonth) / phase.durationMonths
                      : isPast ? 1 : 0;

                    return (
                      <g
                        key={phase.id}
                        onMouseEnter={() => setHoveredPhase(phase.id)}
                        onMouseLeave={() => setHoveredPhase(null)}
                        className="cursor-pointer"
                      >
                        {/* Background bar */}
                        <rect
                          x={barX}
                          y={barY}
                          width={barWidth}
                          height={barH}
                          rx={phase.type === 'gate' ? 12 : 5}
                          fill={phase.color}
                          opacity={animationMonth > 0 ? (isPast ? 0.9 : isActive ? 0.7 : 0.2) : (isHovered ? 0.9 : 0.7)}
                          stroke={isHovered ? '#1f2937' : 'transparent'}
                          strokeWidth={isHovered ? 1.5 : 0}
                        />

                        {/* Progress fill for animation */}
                        {animationMonth > 0 && isActive && (
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth * progressFrac}
                            height={barH}
                            rx={phase.type === 'gate' ? 12 : 5}
                            fill={phase.color}
                            opacity={0.9}
                          />
                        )}

                        {/* Gate diamond icon */}
                        {phase.type === 'gate' && (
                          <g transform={`translate(${barX + 6}, ${barY + barH / 2})`}>
                            <polygon
                              points="0,-5 5,0 0,5 -5,0"
                              fill="white"
                              opacity={0.9}
                            />
                          </g>
                        )}

                        {/* Label on bar */}
                        {barWidth > 30 && (
                          <text
                            x={barX + (phase.type === 'gate' ? 16 : 6)}
                            y={barY + barH / 2 + 4}
                            fill="white"
                            fontSize={10}
                            fontWeight={500}
                          >
                            {barWidth > 60 ? phase.shortName : phase.shortName.slice(0, 3)}
                          </text>
                        )}

                        {/* Risk badge for gates */}
                        {phase.type === 'gate' && phase.risk && barWidth > 50 && (
                          <circle
                            cx={barX + barWidth - 10}
                            cy={barY + barH / 2}
                            r={4}
                            fill={riskColors[phase.risk]}
                            stroke="white"
                            strokeWidth={1.5}
                          />
                        )}

                        {/* Tooltip */}
                        {isHovered && (
                          <g>
                            <rect
                              x={barX}
                              y={barY - 54}
                              width={220}
                              height={50}
                              rx={6}
                              fill="#1f2937"
                              opacity={0.95}
                            />
                            <text x={barX + 8} y={barY - 36} fill="white" fontSize={11} fontWeight={600}>
                              {phase.name}
                            </text>
                            <text x={barX + 8} y={barY - 22} fill="#d1d5db" fontSize={10}>
                              {phase.description}
                            </text>
                            <text x={barX + 8} y={barY - 10} fill="#93c5fd" fontSize={10}>
                              Month {phase.startMonth.toFixed(0)}–{(phase.startMonth + phase.durationMonths).toFixed(0)}
                              {phase.risk ? ` • Risk: ${phase.risk}` : ''}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* Dependency arrows between phases */}
                  {plan.phases.slice(1).map((phase, i) => {
                    const prev = plan.phases[i];
                    const fromX = labelWidth + (prev.startMonth + prev.durationMonths) * monthWidth - 1;
                    const toX = labelWidth + phase.startMonth * monthWidth + 1;
                    const arrowY = y + rowHeight / 2;
                    if (toX - fromX < 3) return null;
                    return (
                      <line
                        key={`dep-${phase.id}`}
                        x1={fromX}
                        y1={arrowY}
                        x2={toX}
                        y2={arrowY}
                        stroke="#d1d5db"
                        strokeWidth={1}
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}
                </g>
              );
            })}

            {/* Arrow marker def */}
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
                <polygon points="0 0, 6 2, 0 4" fill="#d1d5db" />
              </marker>
            </defs>
          </svg>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-[10px] sm:text-xs text-gray-600">
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded bg-[#6366f1] opacity-70" />
          <span>Design</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded bg-[#3b82f6] opacity-70" />
          <span>Regulatory</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded bg-[#8b5cf6] opacity-70" />
          <span>Procurement</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded bg-[#10b981] opacity-70" />
          <span>Construction</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded bg-[#06b6d4] opacity-70" />
          <span>Testing</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-3 rounded-full bg-[#f59e0b] opacity-70" />
          <span>Political Gate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          Low Risk
          <div className="w-2 h-2 rounded-full bg-amber-500 ml-1" />
          Medium
          <div className="w-2 h-2 rounded-full bg-red-500 ml-1" />
          High
        </div>
      </div>
        </>
      ) : (
        /* ===== DEPENDENCY TREE VISUALIZATION ===== */
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-gradient-to-b from-slate-50 to-white">
          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '700px' }}>
            <svg width={1200} height={treeHeight} className="min-w-[1200px]">
              <defs>
                <filter id="tree-shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.15" />
                </filter>
                <filter id="tree-glow">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <linearGradient id="tree-bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
                <marker id="tree-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                </marker>
              </defs>

              <rect width="1200" height={treeHeight} fill="url(#tree-bg)" />

              {/* Grid pattern for professional look */}
              {Array.from({ length: Math.ceil(treeHeight / 70) }, (_, i) => (
                <line key={`hg-${i}`} x1="0" y1={i * 70} x2="1200" y2={i * 70} stroke="#e2e8f0" strokeWidth="0.5" opacity="0.5" />
              ))}

              {/* Edges (curved bezier connections) */}
              {treeData.edges.map((edge, i) => {
                const fromNode = treeData.nodes.find(n => n.id === edge.from);
                const toNode = treeData.nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                const fx = fromNode.x, fy = fromNode.y + fromNode.h / 2;
                const tx = toNode.x, ty = toNode.y - toNode.h / 2;
                const my = fy + (ty - fy) * 0.5;
                // Animation: reveal edges progressively
                const edgeProgress = toNode.phaseIndex >= 0 ? (toNode.phaseIndex + 1) / 10 * 100 : (toNode.type === 'group' ? 5 : 0);
                const visible = treeAnimProgress >= edgeProgress || treeAnimProgress === 0;
                const isGateEdge = toNode.type === 'gate';

                return (
                  <path
                    key={`edge-${i}`}
                    d={`M ${fx} ${fy + fromNode.h * 0.3} C ${fx} ${my}, ${tx} ${my}, ${tx} ${ty - 4}`}
                    fill="none"
                    stroke={isGateEdge ? '#f59e0b' : '#94a3b8'}
                    strokeWidth={isGateEdge ? 2 : 1.5}
                    strokeDasharray={isGateEdge ? '6,3' : 'none'}
                    opacity={visible ? (treeAnimProgress > 0 && treeAnimProgress < 100 ? 0.9 : 0.6) : 0.1}
                    markerEnd="url(#tree-arrow)"
                    style={{ transition: 'opacity 0.3s ease' }}
                  />
                );
              })}

              {/* Nodes */}
              {treeData.nodes.map((node) => {
                const isHov = treeHovered === node.id;
                const nx = node.x - node.w / 2, ny = node.y - node.h / 2;
                const nodeProgress = node.phaseIndex >= 0 ? (node.phaseIndex + 1) / 10 * 100 : (node.type === 'group' ? 5 : 0);
                const revealed = treeAnimProgress >= nodeProgress || treeAnimProgress === 0;
                const justRevealed = treeAnimProgress > 0 && Math.abs(treeAnimProgress - nodeProgress) < 5;

                if (node.type === 'root') {
                  return (
                    <g key={node.id} filter="url(#tree-shadow)" style={{ transition: 'opacity 0.3s' }} opacity={revealed ? 1 : 0.15}>
                      <rect x={nx} y={ny} width={node.w} height={node.h} rx={12} fill={node.color} />
                      <rect x={nx} y={ny} width={node.w} height={node.h} rx={12} fill="white" opacity="0.1" />
                      <text x={node.x} y={node.y - 4} textAnchor="middle" fill="white" fontSize={13} fontWeight={700} fontFamily="system-ui">{node.label}</text>
                      <text x={node.x} y={node.y + 14} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={10} fontFamily="system-ui">{node.sublabel}</text>
                    </g>
                  );
                }

                if (node.type === 'group') {
                  return (
                    <g key={node.id} filter="url(#tree-shadow)" style={{ transition: 'opacity 0.3s' }} opacity={revealed ? 1 : 0.15}>
                      <rect x={nx} y={ny} width={node.w} height={node.h} rx={10} fill="white" stroke={node.color} strokeWidth={2.5} />
                      <text x={node.x} y={node.y - 2} textAnchor="middle" fill={node.color} fontSize={13} fontWeight={600} fontFamily="system-ui">{node.label}</text>
                      <text x={node.x} y={node.y + 14} textAnchor="middle" fill="#6b7280" fontSize={10} fontFamily="system-ui">{node.sublabel}</text>
                    </g>
                  );
                }

                if (node.type === 'gate') {
                  // Diamond-ish gate node
                  const cx = node.x, cy = node.y;
                  const hw = node.w / 2, hh = node.h / 2;
                  return (
                    <g key={node.id}
                      onMouseEnter={() => setTreeHovered(node.id)}
                      onMouseLeave={() => setTreeHovered(null)}
                      className="cursor-pointer"
                      style={{ transition: 'opacity 0.3s' }}
                      opacity={revealed ? 1 : 0.12}
                    >
                      {justRevealed && <circle cx={cx} cy={cy} r={hw * 0.8} fill={node.color} opacity={0.15} className="animate-ping" />}
                      <polygon
                        points={`${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`}
                        fill={node.color}
                        opacity={isHov ? 1 : 0.85}
                        filter="url(#tree-shadow)"
                        stroke={isHov ? '#1f2937' : 'white'}
                        strokeWidth={isHov ? 2 : 1.5}
                      />
                      {node.risk && (
                        <circle cx={cx + hw - 8} cy={cy - hh + 8} r={5} fill={riskColors[node.risk]} stroke="white" strokeWidth={1.5} />
                      )}
                      <text x={cx} y={cy + 1} textAnchor="middle" fill="white" fontSize={10} fontWeight={600} fontFamily="system-ui">{node.label}</text>
                      <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={8} fontFamily="system-ui">{node.sublabel}</text>
                      {isHov && (
                        <g>
                          <rect x={cx + hw + 8} y={cy - 20} width={140} height={40} rx={6} fill="#1f2937" opacity={0.95} />
                          <text x={cx + hw + 16} y={cy - 4} fill="white" fontSize={10} fontWeight={600}>{node.label}</text>
                          <text x={cx + hw + 16} y={cy + 10} fill="#fbbf24" fontSize={9}>{node.sublabel} • {node.risk} risk</text>
                        </g>
                      )}
                    </g>
                  );
                }

                // Work node (rounded rect)
                return (
                  <g key={node.id}
                    onMouseEnter={() => setTreeHovered(node.id)}
                    onMouseLeave={() => setTreeHovered(null)}
                    className="cursor-pointer"
                    style={{ transition: 'opacity 0.3s' }}
                    opacity={revealed ? 1 : 0.12}
                  >
                    {justRevealed && <rect x={nx - 4} y={ny - 4} width={node.w + 8} height={node.h + 8} rx={12} fill={node.color} opacity={0.12} className="animate-ping" />}
                    <rect
                      x={nx} y={ny} width={node.w} height={node.h} rx={8}
                      fill="white"
                      stroke={node.color}
                      strokeWidth={isHov ? 2.5 : 1.5}
                      filter="url(#tree-shadow)"
                    />
                    <rect x={nx} y={ny} width={5} height={node.h} rx={2} fill={node.color} />
                    <text x={node.x + 4} y={node.y - 2} textAnchor="middle" fill="#1f2937" fontSize={10} fontWeight={600} fontFamily="system-ui">{node.label}</text>
                    <text x={node.x + 4} y={node.y + 12} textAnchor="middle" fill="#6b7280" fontSize={9} fontFamily="system-ui">{node.sublabel}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Tree legend */}
          <div className="flex flex-wrap gap-4 px-4 py-3 border-t border-gray-100 text-xs text-gray-600 bg-white">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-4 rounded border-2 border-indigo-500 bg-white" />
              <span>Work Phase</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 16 16"><polygon points="8,1 15,8 8,15 1,8" fill="#f59e0b" /></svg>
              <span>Approval Gate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Low
              <div className="w-2 h-2 rounded-full bg-amber-500 ml-1" /> Medium
              <div className="w-2 h-2 rounded-full bg-red-500 ml-1" /> High Risk
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0 border-t-2 border-dashed border-amber-400" />
              <span>Gate Dependency</span>
            </div>
          </div>
        </div>
      )}

      {/* Expanded zone detail */}
      {expandedZone && (() => {
        const plan = plans.find(p => p.zone.id === expandedZone);
        if (!plan) return null;
        return (
          <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">
                {typeIcons[plan.interventionType]} {plan.zone.name} — Detailed Phases
              </h3>
              <span className="text-sm text-indigo-600">{Math.ceil(plan.totalMonths)} months total</span>
            </div>
            <div className="space-y-3">
              {plan.phases.map((phase, i) => (
                <div key={phase.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0"
                      style={{ backgroundColor: phase.color }}
                    >
                      {phase.type === 'gate' ? '⛊' : i + 1}
                    </div>
                    {i < plan.phases.length - 1 && (
                      <div className="w-0.5 h-6 bg-gray-300 mt-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{phase.name}</span>
                      {phase.type === 'gate' && phase.risk && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: riskColors[phase.risk] }}
                        >
                          {phase.risk} risk
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      Month {Math.ceil(phase.startMonth)}–{Math.ceil(phase.startMonth + phase.durationMonths)} • {phase.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Zone impact summary */}
            <div className="mt-4 pt-4 border-t border-indigo-200 grid grid-cols-4 gap-3 text-center">
              <div>
                <div className="text-xs text-gray-500">Traffic Flow</div>
                <div className="text-emerald-600">+{plan.zone.impact.trafficFlow.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Happiness</div>
                <div className="text-emerald-600">+{plan.zone.impact.citizenHappiness.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Speed</div>
                <div className="text-emerald-600">+{plan.zone.impact.avgSpeedIncrease.toFixed(1)} km/h</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Delay Cut</div>
                <div className="text-emerald-600">-{plan.zone.impact.delayReduction.toFixed(0)} min</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Critical path narrative */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm text-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-gray-900">Critical Path Analysis</span>
        </div>
        <p>
          The longest workstream ({plans.filter(p => p.interventionType === 'metro').length > 0 ? 'Metro' : 'Bus'} interventions)
          determines the overall timeline of <strong>{criticalPathMonths} months</strong>. Bicycle paths can be delivered
          in parallel within the first 8–10 months. The highest-risk gate is <strong>City Council Approval</strong> —
          delays here cascade to all downstream construction phases. Starting bicycle and bus interventions early
          provides visible citizen impact while metro approvals proceed.
        </p>
      </div>
    </div>
  );
}