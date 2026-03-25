// ═══════════════════════════════════════════════════════════════════════
// MIRAGE SERVICE — Rival Perception Projection Engine
//
// "Maintain one sovereign truth graph + multiple lawful mirage overlays
// so rivals see reinforcing patterns while we see the causal battlefield."
//
// Each rival archetype sees the market through their own lens.
// Their model has blind spots, biases, and assumptions.
// We model what they see. We find where they're wrong.
// We trade in the gaps between their world-models and sovereign truth.
//
// Zero kinetic. Zero deception. Total information dominance.
// Our trades are genuine and profitable. The "mirage" is what
// naturally emerges when rivals interpret our truthful actions
// through their biased models.
// ═══════════════════════════════════════════════════════════════════════

import { randomUUID } from 'crypto';
import { GraphService } from './graph.service';
import type {
  CausalType,
  PerceptionModel,
  MirageOverlay,
  ProjectedLink,
  PerceptionGap,
  DivergenceWindow,
  TradeVisibilityResult,
  RivalInference,
} from '../types';

// ── Hardcoded Perception Models per Rival Archetype ───────────────
// V1: Rule-based. V2: Learned from Sentry observation data.
//
// Each model defines:
//   - What causal link types this rival CAN see
//   - What they're BLIND to
//   - How they BIAS link strengths
//   - Confirmation bias (how much they overweight confirming evidence)
//   - Regime awareness (how quickly they detect regime shifts)

const PERCEPTION_MODELS: Record<string, Omit<PerceptionModel, 'archetypeId'>> = {
  STATISTICAL_ARB: {
    visibleLinkTypes: ['CORRELATES', 'PRECEDES', 'TRIGGERS'],
    blindSpots: ['BREAKS', 'DAMPENS'],
    strengthBias: {
      TRIGGERS: 0.7,       // Underweights — sees correlation, not causation
      AMPLIFIES: 0.5,      // Barely sees amplification
      DAMPENS: 0.0,        // Blind to dampening
      PRECEDES: 1.2,       // Overweights temporal precedence (lag-lead worship)
      CORRELATES: 1.5,     // HEAVILY overweights correlation — their bread and butter
      BREAKS: 0.0,         // Completely blind to causal breaks (the crowded trap)
    },
    confirmationBias: 0.7,
    regimeAwareness: 0.3,  // Slow to detect regime shifts — still running old model
    latencyDisadvantageMs: 50,
    description: 'Sees correlations everywhere, blind to causation. Overweights lag-lead. Cannot detect when the correlation they exploit is about to break.',
  },

  MOMENTUM_IGNITION: {
    visibleLinkTypes: ['AMPLIFIES', 'TRIGGERS'],
    blindSpots: ['DAMPENS', 'CORRELATES', 'BREAKS'],
    strengthBias: {
      TRIGGERS: 1.3,       // Overweights triggers — sees everything as directional
      AMPLIFIES: 1.8,      // MASSIVELY overweights amplification — their strategy
      DAMPENS: 0.1,        // Almost blind to mean-reversion
      PRECEDES: 0.8,
      CORRELATES: 0.4,     // Ignores correlation — wants direction
      BREAKS: 0.1,         // Blind to causal breaks
    },
    confirmationBias: 0.85,
    regimeAwareness: 0.2,  // Worst regime awareness — committed to momentum
    latencyDisadvantageMs: 20,
    description: 'Sees amplification everywhere. Committed to trend continuation. Blind to mean-reversion and causal breaks. Most vulnerable to regime shifts.',
  },

  FRONT_RUNNING: {
    visibleLinkTypes: ['TRIGGERS', 'PRECEDES'],
    blindSpots: ['AMPLIFIES', 'DAMPENS', 'BREAKS'],
    strengthBias: {
      TRIGGERS: 1.4,       // Overweights direct triggers — looking for order flow
      AMPLIFIES: 0.3,
      DAMPENS: 0.2,
      PRECEDES: 1.6,       // HEAVILY overweights temporal — the queue is everything
      CORRELATES: 0.6,
      BREAKS: 0.0,         // Blind to breaks
    },
    confirmationBias: 0.6,
    regimeAwareness: 0.4,
    latencyDisadvantageMs: 5,  // Fast but narrow
    description: 'Hyperfocused on order flow and temporal precedence. Fast but narrow vision. Blind to anything that is not a direct trigger.',
  },

  MARKET_MAKING: {
    visibleLinkTypes: ['TRIGGERS', 'DAMPENS', 'AMPLIFIES', 'CORRELATES'],
    blindSpots: ['BREAKS'],
    strengthBias: {
      TRIGGERS: 1.1,
      AMPLIFIES: 0.9,
      DAMPENS: 1.3,        // Overweights dampening — always hedging
      PRECEDES: 0.8,
      CORRELATES: 1.0,     // Accurate on correlations
      BREAKS: 0.2,         // Sees breaks late
    },
    confirmationBias: 0.4,  // Lowest confirmation bias — most rational
    regimeAwareness: 0.7,   // Good regime awareness — widening spreads on regime shift
    latencyDisadvantageMs: 10,
    description: 'Broadest vision but conservative. Good regime awareness. Overweights dampening. Will pull quotes early on uncertainty.',
  },

  WASH_TRADING: {
    visibleLinkTypes: ['CORRELATES'],
    blindSpots: ['TRIGGERS', 'AMPLIFIES', 'DAMPENS', 'PRECEDES', 'BREAKS'],
    strengthBias: {
      TRIGGERS: 0.1,
      AMPLIFIES: 0.1,
      DAMPENS: 0.1,
      PRECEDES: 0.1,
      CORRELATES: 2.0,     // Only sees volume correlation — their own noise
      BREAKS: 0.0,
    },
    confirmationBias: 0.9,  // Highest — they see their own wash patterns as real
    regimeAwareness: 0.1,   // Nearly blind to regime shifts
    latencyDisadvantageMs: 100,
    description: 'Narrowest vision. Sees only volume correlations (mostly their own noise). Nearly blind to everything real. Highest confirmation bias.',
  },

  LAYERING: {
    visibleLinkTypes: ['TRIGGERS', 'PRECEDES', 'DAMPENS'],
    blindSpots: ['AMPLIFIES', 'BREAKS'],
    strengthBias: {
      TRIGGERS: 1.2,
      AMPLIFIES: 0.2,
      DAMPENS: 1.4,        // Overweights dampening — they dampen with fake orders
      PRECEDES: 1.1,
      CORRELATES: 0.7,
      BREAKS: 0.1,
    },
    confirmationBias: 0.65,
    regimeAwareness: 0.35,
    latencyDisadvantageMs: 30,
    description: 'Sees order book depth dynamics. Overweights dampening (their strategy). Blind to cross-venue amplification.',
  },

  SPOOFING: {
    visibleLinkTypes: ['TRIGGERS', 'PRECEDES'],
    blindSpots: ['CORRELATES', 'BREAKS'],
    strengthBias: {
      TRIGGERS: 1.5,       // Overweights triggers — their whole strategy
      AMPLIFIES: 0.8,
      DAMPENS: 0.6,
      PRECEDES: 1.3,
      CORRELATES: 0.3,
      BREAKS: 0.1,
    },
    confirmationBias: 0.75,
    regimeAwareness: 0.25,
    latencyDisadvantageMs: 15,
    description: 'Trigger-focused. Sees order cancellation patterns. Blind to correlation and causal breaks.',
  },

  QUOTE_STUFFING: {
    visibleLinkTypes: ['PRECEDES', 'TRIGGERS'],
    blindSpots: ['DAMPENS', 'CORRELATES', 'BREAKS'],
    strengthBias: {
      TRIGGERS: 1.0,
      AMPLIFIES: 0.6,
      DAMPENS: 0.1,
      PRECEDES: 1.8,       // HEAVILY overweights temporal — latency is everything
      CORRELATES: 0.2,
      BREAKS: 0.0,
    },
    confirmationBias: 0.5,
    regimeAwareness: 0.15, // Worst — only cares about microseconds
    latencyDisadvantageMs: 2,
    description: 'Latency-obsessed. Sees only temporal precedence. Blind to everything that is not speed-related.',
  },

  RETAIL_ORGANIC: {
    visibleLinkTypes: ['TRIGGERS', 'AMPLIFIES', 'CORRELATES'],
    blindSpots: ['PRECEDES', 'BREAKS'],
    strengthBias: {
      TRIGGERS: 0.8,
      AMPLIFIES: 1.3,      // Overweights momentum — chases trends
      DAMPENS: 0.5,
      PRECEDES: 0.3,       // Cannot see temporal edge
      CORRELATES: 1.2,     // Sees news correlation
      BREAKS: 0.1,
    },
    confirmationBias: 0.8,
    regimeAwareness: 0.5,   // Moderate — responds to obvious shifts
    latencyDisadvantageMs: 500,
    description: 'Trend-chasing. Sees news correlations. Slow. Cannot detect temporal edges or causal breaks.',
  },
};

// ── Rival intent inference templates (what they think our trade means) ──
const INTENT_INFERENCE: Record<string, { inferredIntents: Record<string, string>; reaction: string }> = {
  STATISTICAL_ARB: {
    inferredIntents: { BUY: 'cross-venue spread capture', SELL: 'mean-reversion exit' },
    reaction: 'Race to same spread on parallel venue',
  },
  MOMENTUM_IGNITION: {
    inferredIntents: { BUY: 'trend confirmation signal', SELL: 'trend reversal — potential short' },
    reaction: 'Amplify in same direction (or fade if SELL)',
  },
  FRONT_RUNNING: {
    inferredIntents: { BUY: 'pending large buy order', SELL: 'pending large sell order' },
    reaction: 'Jump ahead on same venue within 5ms',
  },
  MARKET_MAKING: {
    inferredIntents: { BUY: 'informed buyer — widen ask', SELL: 'informed seller — widen bid' },
    reaction: 'Widen spread on affected side, pull quotes if size is large',
  },
  WASH_TRADING: {
    inferredIntents: { BUY: 'volume signal', SELL: 'volume signal' },
    reaction: 'No meaningful reaction — noise trader',
  },
  LAYERING: {
    inferredIntents: { BUY: 'depth test — real intent unclear', SELL: 'depth test — real intent unclear' },
    reaction: 'Place/cancel opposite-side orders to test commitment',
  },
  SPOOFING: {
    inferredIntents: { BUY: 'real order — front-run it', SELL: 'real order — front-run it' },
    reaction: 'Place and cancel orders to test if it moves',
  },
  QUOTE_STUFFING: {
    inferredIntents: { BUY: 'latency-exploitable order', SELL: 'latency-exploitable order' },
    reaction: 'Flood message queue on same venue',
  },
  RETAIL_ORGANIC: {
    inferredIntents: { BUY: 'bullish sentiment — follow the smart money', SELL: 'bearish sentiment — panic sell' },
    reaction: 'Follow 200-500ms later if size suggests institutional',
  },
};

export class MirageService {
  private graph: GraphService;
  private overlays: Map<string, MirageOverlay> = new Map();
  private projections: Map<string, ProjectedLink[]> = new Map();  // overlayId → projected links
  private gaps: Map<string, PerceptionGap[]> = new Map();          // overlayId → gaps
  private divergenceWindows: DivergenceWindow[] = [];

  constructor(graph: GraphService) {
    this.graph = graph;
  }

  // ── Overlay Management ──────────────────────────────────────────

  /** Create a mirage overlay for a rival archetype */
  createOverlay(archetypeId: string): MirageOverlay | null {
    const modelDef = PERCEPTION_MODELS[archetypeId];
    if (!modelDef) return null;

    // Don't create duplicates
    for (const overlay of this.overlays.values()) {
      if (overlay.archetypeId === archetypeId) return overlay;
    }

    const perceptionModel: PerceptionModel = { archetypeId, ...modelDef };

    const overlay: MirageOverlay = {
      overlayId: `mirage-${archetypeId.toLowerCase()}-${randomUUID().slice(0, 6)}`,
      archetypeId,
      perceptionModel,
      projectedObjects: 0,
      projectedLinks: 0,
      perceptionGaps: 0,
      divergenceScore: 0,
      lastProjectedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.overlays.set(overlay.overlayId, overlay);

    // Project immediately
    this.projectOverlay(overlay.overlayId);

    return overlay;
  }

  /** Auto-create overlays for all known archetypes */
  createAllOverlays(): MirageOverlay[] {
    const created: MirageOverlay[] = [];
    for (const archetypeId of Object.keys(PERCEPTION_MODELS)) {
      const overlay = this.createOverlay(archetypeId);
      if (overlay) created.push(overlay);
    }
    return created;
  }

  /** Remove an overlay */
  removeOverlay(overlayId: string): boolean {
    this.projections.delete(overlayId);
    this.gaps.delete(overlayId);
    return this.overlays.delete(overlayId);
  }

  /** Get all overlays */
  getOverlays(): MirageOverlay[] {
    return Array.from(this.overlays.values());
  }

  /** Get specific overlay */
  getOverlay(overlayId: string): MirageOverlay | null {
    return this.overlays.get(overlayId) ?? null;
  }

  /** Get available archetype models */
  getAvailableArchetypes(): { archetypeId: string; description: string }[] {
    return Object.entries(PERCEPTION_MODELS).map(([id, model]) => ({
      archetypeId: id,
      description: model.description,
    }));
  }

  // ── Projection Engine ───────────────────────────────────────────

  /** Project the sovereign graph through a rival's perception model */
  projectOverlay(overlayId: string): ProjectedLink[] {
    const overlay = this.overlays.get(overlayId);
    if (!overlay) return [];

    const model = overlay.perceptionModel;
    const stats = this.graph.getStats();
    const allLinks = this.getAllLinks();
    const projected: ProjectedLink[] = [];
    const newGaps: PerceptionGap[] = [];

    for (const link of allLinks) {
      const bias = model.strengthBias[link.causalType] ?? 0;
      const visible = model.visibleLinkTypes.includes(link.causalType);
      const isBlindSpot = model.blindSpots.includes(link.causalType);

      // Calculate perceived strength
      let perceivedStrength = 0;
      if (visible && !isBlindSpot) {
        perceivedStrength = link.strength * bias;
        // Apply confirmation bias — rival overweights what fits their model
        if (bias > 1.0) {
          perceivedStrength *= (1 + model.confirmationBias * 0.3);
        }
        perceivedStrength = Math.min(1, Math.max(0, perceivedStrength));
      }

      const projectedLink: ProjectedLink = {
        linkId: link.linkId,
        fromObjectId: link.fromObjectId,
        toObjectId: link.toObjectId,
        causalType: link.causalType,
        sovereignStrength: link.strength,
        perceivedStrength,
        strengthError: link.strength - perceivedStrength,
        visible: visible && !isBlindSpot,
        biasApplied: bias,
      };

      projected.push(projectedLink);

      // Detect perception gaps (exploitable)
      if (!visible || isBlindSpot) {
        if (link.strength > 0.3) {  // Only significant links matter
          newGaps.push({
            gapId: `gap-${overlayId.slice(7, 13)}-${link.linkId}`,
            overlayId,
            archetypeId: overlay.archetypeId,
            gapType: 'INVISIBLE_LINK',
            sovereignLinkId: link.linkId,
            description: `${overlay.archetypeId} cannot see ${link.causalType} link (strength=${link.strength.toFixed(2)})`,
            exploitability: link.strength * 0.8,  // Strong invisible links = highly exploitable
            detectedAt: new Date().toISOString(),
          });
        }
      } else if (Math.abs(link.strength - perceivedStrength) > 0.2) {
        newGaps.push({
          gapId: `gap-${overlayId.slice(7, 13)}-${link.linkId}`,
          overlayId,
          archetypeId: overlay.archetypeId,
          gapType: 'STRENGTH_ERROR',
          sovereignLinkId: link.linkId,
          description: `${overlay.archetypeId} perceives ${link.causalType} as ${perceivedStrength.toFixed(2)} vs sovereign ${link.strength.toFixed(2)}`,
          exploitability: Math.abs(link.strength - perceivedStrength) * 0.6,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Check for regime blindness
    if (model.regimeAwareness < 0.5) {
      const regimeNodes = this.graph.queryByType('REGIME_NODE');
      for (const node of regimeNodes) {
        const props = node.properties as Record<string, unknown>;
        if (props.previousRegime && props.previousRegime !== props.regime) {
          newGaps.push({
            gapId: `gap-${overlayId.slice(7, 13)}-regime-${node.objectId}`,
            overlayId,
            archetypeId: overlay.archetypeId,
            gapType: 'REGIME_BLIND',
            sovereignLinkId: node.objectId,
            description: `${overlay.archetypeId} has not detected regime shift: ${props.previousRegime} → ${props.regime} (awareness=${model.regimeAwareness})`,
            exploitability: (1 - model.regimeAwareness) * 0.9,
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }

    // Update overlay stats
    const visibleLinks = projected.filter(p => p.visible);
    const invisibleLinks = projected.filter(p => !p.visible);
    const totalError = projected.reduce((sum, p) => sum + Math.abs(p.strengthError), 0);
    const avgError = projected.length > 0 ? totalError / projected.length : 0;

    overlay.projectedLinks = visibleLinks.length;
    overlay.projectedObjects = stats.totalObjects;  // Objects are all visible (public tape)
    overlay.perceptionGaps = newGaps.length;
    overlay.divergenceScore = Math.min(1, avgError + (invisibleLinks.length / Math.max(1, projected.length)));
    overlay.lastProjectedAt = new Date().toISOString();

    this.projections.set(overlayId, projected);
    this.gaps.set(overlayId, newGaps);

    return projected;
  }

  /** Refresh all overlays — called periodically */
  refreshAllOverlays(): { refreshed: number; totalGaps: number; avgDivergence: number } {
    let totalGaps = 0;
    let totalDivergence = 0;
    let refreshed = 0;

    for (const overlayId of this.overlays.keys()) {
      this.projectOverlay(overlayId);
      const overlay = this.overlays.get(overlayId)!;
      totalGaps += overlay.perceptionGaps;
      totalDivergence += overlay.divergenceScore;
      refreshed++;
    }

    // Detect divergence windows after all overlays refreshed
    this.detectDivergenceWindows();

    return {
      refreshed,
      totalGaps,
      avgDivergence: refreshed > 0 ? totalDivergence / refreshed : 0,
    };
  }

  // ── Perception Gaps ─────────────────────────────────────────────

  /** Get perception gaps for a specific overlay */
  getGaps(overlayId: string): PerceptionGap[] {
    return this.gaps.get(overlayId) ?? [];
  }

  /** Get all perception gaps across all overlays, sorted by exploitability */
  getAllGaps(): PerceptionGap[] {
    const all: PerceptionGap[] = [];
    for (const gaps of this.gaps.values()) {
      all.push(...gaps);
    }
    return all.sort((a, b) => b.exploitability - a.exploitability);
  }

  // ── Divergence Windows ──────────────────────────────────────────

  /** Detect moments where multiple rival models are simultaneously wrong */
  private detectDivergenceWindows(): void {
    const overlays = this.getOverlays();
    if (overlays.length < 2) return;

    // Find links where MULTIPLE overlays are wrong
    const allLinks = this.getAllLinks();
    const highDivergenceLinks: string[] = [];

    for (const link of allLinks) {
      let wrongCount = 0;
      for (const overlay of overlays) {
        const projected = this.projections.get(overlay.overlayId);
        if (!projected) continue;
        const pl = projected.find(p => p.linkId === link.linkId);
        if (pl && (!pl.visible || Math.abs(pl.strengthError) > 0.2)) {
          wrongCount++;
        }
      }
      if (wrongCount >= 2) {
        highDivergenceLinks.push(link.linkId);
      }
    }

    if (highDivergenceLinks.length === 0) {
      this.divergenceWindows = [];
      return;
    }

    // Build window
    const affectedOverlayIds: string[] = [];
    const affectedArchetypes: string[] = [];
    let totalDivergence = 0;
    let maxDivergence = 0;

    for (const overlay of overlays) {
      if (overlay.divergenceScore > 0.2) {
        affectedOverlayIds.push(overlay.overlayId);
        affectedArchetypes.push(overlay.archetypeId);
        totalDivergence += overlay.divergenceScore;
        maxDivergence = Math.max(maxDivergence, overlay.divergenceScore);
      }
    }

    if (affectedOverlayIds.length >= 2) {
      const window: DivergenceWindow = {
        windowId: `dw-${Date.now()}`,
        overlayIds: affectedOverlayIds,
        archetypeIds: affectedArchetypes,
        meanDivergence: totalDivergence / affectedOverlayIds.length,
        maxDivergence,
        gapCount: highDivergenceLinks.length,
        sovereignAdvantage: `${affectedArchetypes.length} rival archetypes diverging on ${highDivergenceLinks.length} causal links. Maximum confusion window.`,
        detectedAt: new Date().toISOString(),
      };

      this.divergenceWindows = [window]; // Keep only latest
    }
  }

  /** Get current divergence windows */
  getDivergenceWindows(): DivergenceWindow[] {
    return this.divergenceWindows;
  }

  // ── Trade Visibility Simulation ─────────────────────────────────

  /** Simulate what all rivals would infer from seeing our trade on the public tape */
  simulateTradeVisibility(params: {
    pair: string;
    side: 'BUY' | 'SELL';
    sizeUsd: number;
    venue: string;
  }): TradeVisibilityResult {
    const rivalInferences: RivalInference[] = [];

    for (const overlay of this.overlays.values()) {
      const model = overlay.perceptionModel;
      const archetypeId = overlay.archetypeId;
      const intentData = INTENT_INFERENCE[archetypeId];
      if (!intentData) continue;

      const gaps = this.gaps.get(overlay.overlayId) ?? [];
      const totalExploitability = gaps.reduce((s, g) => s + g.exploitability, 0);

      // Calculate confidence: rivals with more perception gaps are LESS confident
      // but rivals with high confirmation bias think they're MORE confident
      const baseConfidence = 0.5 + (model.confirmationBias * 0.3);
      const gapPenalty = Math.min(0.4, totalExploitability * 0.1);
      const confidence = Math.max(0.1, baseConfidence - gapPenalty);

      // What they think we're doing
      const inferredIntent = intentData.inferredIntents[params.side] || 'unknown activity';

      // What they get wrong — based on their blind spots
      const wrongAbout: string[] = [];
      if (model.blindSpots.includes('BREAKS')) {
        wrongAbout.push('Cannot detect if the causal link they exploit is about to break');
      }
      if (model.regimeAwareness < 0.4) {
        wrongAbout.push('May not have detected recent regime shift');
      }
      if (model.confirmationBias > 0.7) {
        wrongAbout.push('High confirmation bias — will overweight evidence that fits their model');
      }
      if (!model.visibleLinkTypes.includes('DAMPENS')) {
        wrongAbout.push('Blind to dampening effects — cannot see opposing forces');
      }

      // Size perception — small trades may be invisible to some
      const sizeVisible = params.sizeUsd > 25 || model.latencyDisadvantageMs < 50;

      rivalInferences.push({
        overlayId: overlay.overlayId,
        archetypeId,
        inferredIntent: sizeVisible ? inferredIntent : 'below detection threshold',
        confidenceInInference: sizeVisible ? confidence : 0,
        wrongAbout,
        predictedReaction: sizeVisible ? intentData.reaction : 'No reaction — trade below radar',
        reactionLatencyMs: model.latencyDisadvantageMs,
      });
    }

    // Confusion score: how much do rival inferences DISAGREE with each other?
    const uniqueIntents = new Set(rivalInferences.filter(r => r.confidenceInInference > 0).map(r => r.inferredIntent));
    const confusionScore = Math.min(1, (uniqueIntents.size - 1) / Math.max(1, rivalInferences.length - 1));

    // Consistency score: how much do they AGREE? (low = good for us)
    const consistencyScore = 1 - confusionScore;

    return {
      simulationId: `vis-${randomUUID().slice(0, 8)}`,
      tradeParams: params,
      rivalInferences,
      confusionScore,
      consistencyScore,
      simulatedAt: new Date().toISOString(),
    };
  }

  // ── Stats ───────────────────────────────────────────────────────

  getStats(): {
    totalOverlays: number;
    totalGaps: number;
    avgDivergence: number;
    maxDivergence: number;
    activeDivergenceWindows: number;
    archetypes: string[];
  } {
    const overlays = this.getOverlays();
    let totalGaps = 0;
    let totalDivergence = 0;
    let maxDivergence = 0;

    for (const overlay of overlays) {
      totalGaps += overlay.perceptionGaps;
      totalDivergence += overlay.divergenceScore;
      maxDivergence = Math.max(maxDivergence, overlay.divergenceScore);
    }

    return {
      totalOverlays: overlays.length,
      totalGaps,
      avgDivergence: overlays.length > 0 ? totalDivergence / overlays.length : 0,
      maxDivergence,
      activeDivergenceWindows: this.divergenceWindows.length,
      archetypes: overlays.map(o => o.archetypeId),
    };
  }

  // ── Private Helpers ─────────────────────────────────────────────

  /** Get all causal links from the sovereign graph */
  private getAllLinks(): { linkId: string; fromObjectId: string; toObjectId: string; causalType: CausalType; strength: number; confidence: number }[] {
    // Walk all objects and collect their outgoing links
    const seen = new Set<string>();
    const links: { linkId: string; fromObjectId: string; toObjectId: string; causalType: CausalType; strength: number; confidence: number }[] = [];

    const stats = this.graph.getStats();
    // We need to traverse the graph to get all links
    // Use queryByType to get all object IDs, then getOutgoing for each
    const allTypes = ['PARTICIPANT', 'FLOW_INTENT', 'REGIME_NODE', 'MICROSTRUCTURE_EVENT', 'MACRO_TRIGGER', 'TRADE_ACTION'] as const;
    for (const type of allTypes) {
      const objects = this.graph.queryByType(type);
      for (const obj of objects) {
        const outLinks = this.graph.getOutgoing(obj.objectId);
        for (const link of outLinks) {
          if (!seen.has(link.linkId)) {
            seen.add(link.linkId);
            links.push({
              linkId: link.linkId,
              fromObjectId: link.fromObjectId,
              toObjectId: link.toObjectId,
              causalType: link.causalType,
              strength: link.strength,
              confidence: link.confidence,
            });
          }
        }
      }
    }

    return links;
  }
}
