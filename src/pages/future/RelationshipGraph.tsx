import { useMemo, useState } from 'react';
import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  useNodesState,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useData } from '../../DataProvider';
import PersonPanel from './PersonPanel';

interface PersonNodeData extends Record<string, unknown> {
  name: string;
  relation: string;
  mentions: number;
  diameter: number;
  tint: string;
  isYou: boolean;
}

type PersonFlowNode = Node<PersonNodeData, 'person'>;

// Soft pastel fills cycled across people, matching the emotion-chip palette.
const personTints = [
  'border-sky-200 bg-sky-50 text-sky-700',
  'border-pink-200 bg-pink-50 text-pink-600',
  'border-emerald-200 bg-emerald-50 text-emerald-700',
  'border-amber-200 bg-amber-50 text-amber-700',
  'border-violet-200 bg-violet-50 text-violet-600',
];

function PersonNodeView({ data, selected }: NodeProps<PersonFlowNode>) {
  return (
    <div
      style={{ width: data.diameter, height: data.diameter }}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-full border transition-shadow duration-200 ${
        data.isYou
          ? 'border-sky-mid bg-gradient-to-b from-sky-pale to-white text-deep shadow-[0_2px_16px_rgba(147,197,253,0.45)]'
          : data.tint
      } ${selected ? 'shadow-[0_0_0_4px_rgba(147,197,253,0.4)]' : 'shadow-[0_1px_10px_rgba(148,163,184,0.15)]'}`}
    >
      <Handle type="target" position={Position.Top} className="!h-1 !w-1 !border-0 !bg-transparent" />
      <span className="font-display text-sm lowercase">{data.name}</span>
      {!data.isYou && <span className="text-[10px] opacity-60">{data.mentions} mentions</span>}
      <Handle type="source" position={Position.Bottom} className="!h-1 !w-1 !border-0 !bg-transparent" />
    </div>
  );
}

const nodeTypes = { person: PersonNodeView };

export default function RelationshipGraph() {
  const { derived } = useData();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { initialNodes, edges } = useMemo(() => {
    const youDiameter = 116;
    const radius = 215;
    const nodes: PersonFlowNode[] = [
      {
        id: 'you',
        type: 'person',
        position: { x: -youDiameter / 2, y: -youDiameter / 2 },
        data: { name: 'you', relation: '', mentions: 0, diameter: youDiameter, tint: '', isYou: true },
      },
    ];
    const flowEdges: Edge[] = [];

    derived.people.forEach((person, index) => {
      const mentions = person.segmentIds.length;
      const diameter = 48 + Math.round(Math.sqrt(mentions) * 5.5);
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / derived.people.length;
      nodes.push({
        id: person.key,
        type: 'person',
        position: {
          x: Math.cos(angle) * radius - diameter / 2,
          y: Math.sin(angle) * radius - diameter / 2,
        },
        data: {
          name: person.name,
          relation: person.relation,
          mentions,
          diameter,
          tint: personTints[index % personTints.length],
          isYou: false,
        },
      });
      flowEdges.push({
        id: `you-${person.key}`,
        source: 'you',
        target: person.key,
        type: 'straight',
        label: `${mentions}`,
        style: { stroke: '#cbd5e1', strokeWidth: 1 + mentions / 60 },
        labelStyle: { fill: '#94a3b8', fontSize: 11 },
        labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
        labelBgPadding: [6, 3],
        labelBgBorderRadius: 8,
      });
    });

    return { initialNodes: nodes, edges: flowEdges };
  }, [derived.people]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const selectedPerson = derived.people.find((p) => p.key === selectedKey) ?? null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="h-[380px] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_1px_12px_rgba(148,163,184,0.08)] sm:h-[460px] lg:flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => setSelectedKey(node.id === 'you' ? null : node.id)}
          onEdgeClick={(_, edge) => setSelectedKey(edge.target)}
          onPaneClick={() => setSelectedKey(null)}
          nodesConnectable={false}
          zoomOnScroll={false}
          preventScrolling={false}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={28} size={1.5} color="#e2e8f0" />
        </ReactFlow>
      </div>
      {selectedPerson && <PersonPanel person={selectedPerson} onClose={() => setSelectedKey(null)} />}
    </div>
  );
}
