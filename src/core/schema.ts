import { z } from 'zod';

// Core schema for Tribal graphs
export const NodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  markup: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  directed: z.boolean().default(true),
  label: z.string().optional(),
  markup: z.string().optional(),
  size: z.object({
    width: z.number(),
    height: z.number(),
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const GraphSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  metadata: z.record(z.string(), z.any()).optional(),
});

// Extended graph schema for server-side graphs with metadata
export const ServerGraphSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  user_id: z.string(),
  is_public: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  metadata: z.record(z.string(), z.any()).optional(),
});

// TypeScript types derived from Zod schemas
export type Node = z.infer<typeof NodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type Graph = z.infer<typeof GraphSchema>;
export type ServerGraph = z.infer<typeof ServerGraphSchema>;

// Validation functions
export const validateNode = (data: unknown): Node => {
  return NodeSchema.parse(data);
};

export const validateEdge = (data: unknown): Edge => {
  return EdgeSchema.parse(data);
};

export const validateGraph = (data: unknown): Graph => {
  return GraphSchema.parse(data);
};

// Utility functions for graph manipulation
export const createNode = (
  id: string,
  label: string,
  position: { x: number; y: number },
  markup?: string
): Node => {
  return {
    id,
    label,
    position,
    markup,
  };
};

export const createEdge = (
  id: string,
  source: string,
  target: string,
  directed = true,
  label?: string,
  markup?: string
): Edge => {
  return {
    id,
    source,
    target,
    directed,
    label,
    markup,
  };
};

export const createGraph = (
  nodes: Node[] = [],
  edges: Edge[] = [],
  metadata?: Record<string, any>
): Graph => {
  return {
    nodes,
    edges,
    metadata,
  };
};