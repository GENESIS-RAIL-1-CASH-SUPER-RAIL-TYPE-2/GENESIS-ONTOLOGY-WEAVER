// ═══════════════════════════════════════════════════════════════════════
// GENESIS ONTOLOGY WEAVER — Type Definitions
// Port 8849 | "They optimize functions. We operationalize truth."
//
// Three-Layer Ontology (Palantir Foundry architecture):
//   Semantic:  Objects, Properties, Links — the market's causal structure
//   Kinetic:   Actions and Functions — governed write-back operations
//   Dynamic:   Provenance, audit trails, real-time metrics
//
// V1: Rule-based causal templates. V2: DoWhy/CausalNex when GPU arrives.
// The graph evolves faster than the market can adapt.
// ═══════════════════════════════════════════════════════════════════════

// ── Semantic Layer: Objects ──────────────────────────────────────────

/** Base ontology object — everything in the graph inherits from this */
export interface OntologyObject {
  objectId: string;
  objectType: OntologyObjectType;
  properties: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  source: string;                    // Which service created this object
  confidence: number;                // 0-1 — how certain we are this object is real
}

export type OntologyObjectType =
  | 'PARTICIPANT'                    // A rival bot, market maker, or participant class
  | 'FLOW_INTENT'                   // What a participant is trying to do
  | 'REGIME_NODE'                   // Market regime state (trending, mean-reverting, volatile, etc.)
  | 'MICROSTRUCTURE_EVENT'          // Order book event, spread shift, volume spike
  | 'MACRO_TRIGGER'                 // External trigger (news, filing, rate decision)
  | 'TRADE_ACTION';                 // Our own trade action in the graph

/** Participant archetype — a rival or class of market actor */
export interface ParticipantArchetype extends OntologyObject {
  objectType: 'PARTICIPANT';
  properties: {
    rivalId: string;                 // From Sentry (e.g. RIVAL-ECHO-7)
    behavior: string;                // STATISTICAL_ARB, MOMENTUM_IGNITION, etc.
    crowdedness: number;             // How many rivals share this archetype
    reactionLatencyMs: number;
    lastSeenAt: string;
    venues: string[];
  };
}

/** Flow intent — what a participant is trying to accomplish */
export interface FlowIntent extends OntologyObject {
  objectType: 'FLOW_INTENT';
  properties: {
    participantId: string;           // Links to ParticipantArchetype
    intent: string;                  // 'ACCUMULATE' | 'DISTRIBUTE' | 'ARB' | 'MANIPULATE' | 'PROBE' | 'UNKNOWN'
    pair: string;
    side: 'BUY' | 'SELL' | 'BOTH';
    estimatedSizeUsd: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    inferredFrom: string;            // What evidence led to this inference
  };
}

/** Regime node — current market regime state */
export interface RegimeNode extends OntologyObject {
  objectType: 'REGIME_NODE';
  properties: {
    regime: RegimeType;
    pair: string;
    venue: string;
    strength: number;                // 0-1 — how strong this regime is
    duration: number;                // How many seconds this regime has persisted
    previousRegime: RegimeType | null;
    transitionProbability: number;   // 0-1 — probability of regime change
  };
}

export type RegimeType =
  | 'TRENDING_UP'
  | 'TRENDING_DOWN'
  | 'MEAN_REVERTING'
  | 'VOLATILE'
  | 'QUIET'
  | 'FLASH_CRASH'
  | 'REGIME_SHIFT'                   // Transitioning between regimes
  | 'UNKNOWN';

// ── Semantic Layer: Causal Links ────────────────────────────────────

/** Directed causal link — the arrows in the graph */
export interface CausalLink {
  linkId: string;
  fromObjectId: string;
  toObjectId: string;
  causalType: CausalType;
  strength: number;                  // 0-1 — how strong the causal relationship is
  confidence: number;                // 0-1 — how certain we are this link exists
  evidence: string;                  // Why we believe this causal link exists
  discoveredAt: string;
  lastValidatedAt: string;
  decayRate: number;                 // How fast this link weakens without reinforcement (per hour)
  interventionCount: number;         // How many what-if tests have validated this link
}

export type CausalType =
  | 'TRIGGERS'                       // A triggers B (direct cause)
  | 'AMPLIFIES'                      // A amplifies B (reinforcing)
  | 'DAMPENS'                        // A dampens B (opposing)
  | 'PRECEDES'                       // A reliably precedes B (temporal)
  | 'CORRELATES'                     // A correlates with B (weaker than causal)
  | 'BREAKS';                        // A breaks/invalidates B

// ── Kinetic Layer: Actions ──────────────────────────────────────────

/** What-if intervention — test a hypothetical against the graph */
export interface CausalIntervention {
  interventionId: string;
  description: string;
  hypotheticalAction: {
    type: 'TRADE' | 'REGIME_SHIFT' | 'PARTICIPANT_ENTRY' | 'PARTICIPANT_EXIT' | 'MACRO_EVENT';
    parameters: Record<string, unknown>;
  };
  affectedLinks: string[];           // CausalLink IDs that would be affected
  predictedOutcomes: InterventionOutcome[];
  confidence: number;
  simulatedAt: string;
}

/** Predicted outcome of an intervention */
export interface InterventionOutcome {
  objectId: string;
  objectType: OntologyObjectType;
  effect: 'STRENGTHENED' | 'WEAKENED' | 'BROKEN' | 'CREATED' | 'UNCHANGED';
  magnitude: number;                 // 0-1
  explanation: string;
}

// ── Dynamic Layer: Provenance & Metrics ─────────────────────────────

/** Graph statistics */
export interface GraphStats {
  totalObjects: number;
  totalLinks: number;
  objectsByType: Record<OntologyObjectType, number>;
  linksByType: Record<CausalType, number>;
  avgLinkStrength: number;
  avgLinkConfidence: number;
  weakLinks: number;                 // Links with strength < 0.3
  regimeDistribution: Record<RegimeType, number>;
}

/** Regime shift detection */
export interface RegimeShiftAlert {
  alertId: string;
  pair: string;
  venue: string;
  fromRegime: RegimeType;
  toRegime: RegimeType;
  transitionStrength: number;        // 0-1 — how strong the shift signal is
  causalChain: string[];             // CausalLink IDs that explain why
  detectedAt: string;
}

/** Weaver system state */
export interface WeaverState {
  totalObjects: number;
  totalLinks: number;
  totalInterventions: number;
  totalRegimeShifts: number;
  graphHealth: number;               // 0-1 — overall graph coherence
  avgLinkDecay: number;
  lastIngestAt: string | null;
  lastInterventionAt: string | null;
  lastRegimeScanAt: string | null;
  uptime: number;
}
