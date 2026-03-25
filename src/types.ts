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
  mirageOverlays: number;            // Active mirage overlays
}

// ── Mirage Overlays: Rival Perception Projections ─────────────────

/** Rival archetype perception model — what a rival CAN see, what they MISS */
export interface PerceptionModel {
  archetypeId: string;               // e.g. 'STATISTICAL_ARB', 'MOMENTUM_IGNITION'
  visibleLinkTypes: CausalType[];    // Which causal link types this rival can detect
  blindSpots: CausalType[];          // Link types completely invisible to this rival
  strengthBias: Record<CausalType, number>;  // Multiplier: 1.0=accurate, >1=overweight, <1=underweight
  confirmationBias: number;          // 0-1 — how much they overweight confirming evidence
  regimeAwareness: number;           // 0-1 — ability to detect regime shifts (0=blind, 1=perfect)
  latencyDisadvantageMs: number;     // How much later they see changes vs sovereign
  description: string;
}

/** A mirage overlay — branched rival-perception view of the sovereign graph */
export interface MirageOverlay {
  overlayId: string;
  archetypeId: string;               // Which rival archetype this models
  perceptionModel: PerceptionModel;
  projectedObjects: number;          // Objects visible to this rival
  projectedLinks: number;            // Links visible to this rival
  perceptionGaps: number;            // Count of sovereign links invisible to this rival
  divergenceScore: number;           // 0-1 — how far this overlay diverges from sovereign truth
  lastProjectedAt: string;
  createdAt: string;
}

/** A projected link as seen through a rival's perception model */
export interface ProjectedLink {
  linkId: string;                    // Original sovereign link ID
  fromObjectId: string;
  toObjectId: string;
  causalType: CausalType;
  sovereignStrength: number;         // True strength in sovereign graph
  perceivedStrength: number;         // What the rival thinks the strength is
  strengthError: number;             // sovereign - perceived (positive = rival underestimates)
  visible: boolean;                  // Can the rival see this link at all?
  biasApplied: number;              // Multiplier that was applied
}

/** Perception gap — where a rival's world model diverges from sovereign truth */
export interface PerceptionGap {
  gapId: string;
  overlayId: string;
  archetypeId: string;
  gapType: 'INVISIBLE_LINK' | 'STRENGTH_ERROR' | 'REGIME_BLIND' | 'CAUSAL_MISATTRIBUTION';
  sovereignLinkId: string;
  description: string;
  exploitability: number;            // 0-1 — how much alpha we can extract from this gap
  detectedAt: string;
}

/** Divergence window — moment where multiple rival models are simultaneously wrong */
export interface DivergenceWindow {
  windowId: string;
  overlayIds: string[];              // Which overlays are diverging
  archetypeIds: string[];            // Which rival types are affected
  meanDivergence: number;            // 0-1 — average divergence across overlays
  maxDivergence: number;             // 0-1 — peak divergence
  gapCount: number;                  // Total exploitable gaps in this window
  sovereignAdvantage: string;        // Description of our information edge
  detectedAt: string;
}

/** Trade visibility simulation — what rivals would infer from seeing our trade */
export interface TradeVisibilityResult {
  simulationId: string;
  tradeParams: {
    pair: string;
    side: 'BUY' | 'SELL';
    sizeUsd: number;
    venue: string;
  };
  rivalInferences: RivalInference[];
  confusionScore: number;            // 0-1 — how confused are rivals collectively?
  consistencyScore: number;          // 0-1 — how consistent are rival inferences with each other? (low = good for us)
  simulatedAt: string;
}

/** What a single rival archetype would infer from seeing our trade */
export interface RivalInference {
  overlayId: string;
  archetypeId: string;
  inferredIntent: string;            // What the rival thinks we're doing
  confidenceInInference: number;     // 0-1 — how confident the rival is
  wrongAbout: string[];              // What the rival gets wrong
  predictedReaction: string;         // What the rival would do in response
  reactionLatencyMs: number;
}
