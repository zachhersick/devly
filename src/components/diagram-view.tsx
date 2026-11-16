// Draws a problem's reference architecture as SVG. Nodes listed in steps up to
// `step` are shown; an edge appears once both of its ends are on the canvas.
// The nodes just added are highlighted.
import { Cloud, Cog, Database, Globe, HardDrive, Layers, Search, Server, ShieldCheck, Smartphone, Split, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId } from "react";
import { ease } from "@/components/kit";
import { DIAGRAM_SIZE } from "@/lib/model.js";

export const NODE = { width: 96, height: 46 };

const KINDS: Record<string, { icon: typeof Server; color: string }> = {
  client: { icon: Smartphone, color: "#64748b" },
  lb: { icon: Split, color: "#0ea5e9" },
  gateway: { icon: ShieldCheck, color: "#0ea5e9" },
  service: { icon: Server, color: "var(--tint)" },
  cache: { icon: Zap, color: "#f43f5e" },
  db: { icon: Database, color: "#f59e0b" },
  queue: { icon: Layers, color: "#10b981" },
  storage: { icon: HardDrive, color: "#a16207" },
  cdn: { icon: Globe, color: "#06b6d4" },
  worker: { icon: Cog, color: "#8b5cf6" },
  search: { icon: Search, color: "#14b8a6" },
  external: { icon: Cloud, color: "#94a3b8" }
};

type Node = { id: string; label: string; kind: string; x: number; y: number };
type Edge = { from: string; to: string; label?: string };
export type Diagram = { nodes: Node[]; edges: Edge[]; steps: { add: string[]; caption: string }[] };

// Where the line from a's center toward b leaves a's box.
function exit(a: Node, b: Node, pad = 3) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const t = Math.min((NODE.width / 2 + pad) / Math.abs(dx || 1e-9), (NODE.height / 2 + pad) / Math.abs(dy || 1e-9));
  return { x: a.x + dx * t, y: a.y + dy * t };
}

/**
 * `compact` draws a thumbnail: no text, thicker strokes and no entrance motion,
 * so the shape of the system still reads at a third of the size.
 */
export function DiagramView({ diagram, step, compact = false }: { diagram: Diagram; step: number; compact?: boolean }) {
  const arrow = `arrow${useId().replace(/:/g, "")}`;
  const shown = new Set(diagram.steps.slice(0, step + 1).flatMap((s) => s.add));
  const fresh = new Set(diagram.steps[step]?.add || []);
  const byId = new Map(diagram.nodes.map((node) => [node.id, node]));
  const edges = diagram.edges.filter((edge) => shown.has(edge.from) && shown.has(edge.to));
  return (
    <svg aria-hidden={compact || undefined} aria-label={compact ? undefined : "Architecture diagram"} className="h-auto w-full" role="img" viewBox={`0 0 ${DIAGRAM_SIZE.width} ${DIAGRAM_SIZE.height}`}>
      <defs>
        <marker id={arrow} markerHeight="7" markerWidth="7" orient="auto-start-reverse" refX="6" refY="3.5" viewBox="0 0 7 7">
          <path d="M0,0 L7,3.5 L0,7 z" fill="var(--muted-foreground)" />
        </marker>
      </defs>
      <AnimatePresence initial={!compact}>
        {edges.map((edge) => {
          const a = byId.get(edge.from)!;
          const b = byId.get(edge.to)!;
          const start = exit(a, b);
          const end = exit(b, a, 6);
          const mid = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
          const width = (edge.label?.length || 0) * 5.4 + 8;
          // A label that wouldn't fit beside its arrow is left off rather than drawn over a node.
          const fits = Math.hypot(end.x - start.x, end.y - start.y) >= width + 14;
          return (
            <motion.g animate={{ opacity: 1 }} exit={{ opacity: 0 }} initial={{ opacity: 0 }} key={`${edge.from}-${edge.to}`} transition={{ duration: 0.3, delay: 0.1, ease }}>
              <line markerEnd={`url(#${arrow})`} stroke="var(--muted-foreground)" strokeOpacity={0.55} strokeWidth={compact ? 4 : 1.4} x1={start.x} x2={end.x} y1={start.y} y2={end.y} />
              {edge.label && fits && !compact ? (
                <g>
                  <rect fill="var(--card)" height={14} rx={7} width={width} x={mid.x - width / 2} y={mid.y - 7} />
                  <text dominantBaseline="central" fill="var(--muted-foreground)" fontSize={9} fontWeight={500} textAnchor="middle" x={mid.x} y={mid.y}>
                    {edge.label}
                  </text>
                </g>
              ) : null}
            </motion.g>
          );
        })}
      </AnimatePresence>
      <AnimatePresence initial={!compact}>
        {diagram.nodes
          .filter((node) => shown.has(node.id))
          .map((node) => {
            const kind = KINDS[node.kind] || KINDS.service;
            const Icon = kind.icon;
            const on = fresh.has(node.id);
            return (
              <motion.g
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.9 }}
                key={node.id}
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
                transition={{ duration: 0.25, ease }}
              >
                <rect fill="var(--card)" height={NODE.height} rx={12} width={NODE.width} x={node.x - NODE.width / 2} y={node.y - NODE.height / 2} />
                <rect
                  fill={kind.color}
                  fillOpacity={compact ? 0.24 : 0.14}
                  height={NODE.height}
                  rx={12}
                  stroke={kind.color}
                  strokeOpacity={on && !compact ? 1 : 0.55}
                  strokeWidth={compact ? 3 : on ? 2 : 1.2}
                  width={NODE.width}
                  x={node.x - NODE.width / 2}
                  y={node.y - NODE.height / 2}
                />
                {compact ? (
                  <Icon color={kind.color} height={26} strokeWidth={3} width={26} x={node.x - 13} y={node.y - 13} />
                ) : (
                  <>
                    <Icon color={kind.color} height={15} strokeWidth={2} width={15} x={node.x - 7.5} y={node.y - 18} />
                    <text dominantBaseline="central" fill="var(--foreground)" fontSize={10.5} fontWeight={500} textAnchor="middle" x={node.x} y={node.y + 9}>
                      {node.label}
                    </text>
                  </>
                )}
              </motion.g>
            );
          })}
      </AnimatePresence>
    </svg>
  );
}
