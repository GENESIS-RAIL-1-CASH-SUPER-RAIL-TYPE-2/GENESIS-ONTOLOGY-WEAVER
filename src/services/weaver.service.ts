// ═══════════════════════════════════════════════════════════════════════
// WEAVER SERVICE — Causal Inference Engine
//
// "We do not predict prices; we discover and evolve the true causal
// graph of why flows occur."
//
// V1: Rule-based causal templates — what we KNOW causes what.
// V2: DoWhy/CausalNex causal discovery from accumulated data (GPU tier).
//
// The Weaver does three things:
// 1. Ingests observations → creates/updates objects + discovers links
// 2. Runs "what-if" interventions → predicts chain reactions
// 3. Detects regime shifts → alerts when causal chains break
// ═══════════════════════════════════════════════════════════════════════

import { randomUUID } from 'crypto';
import { GraphService } from './graph.service';
import type {
  OntologyObject,
  ParticipantArchetype,
  FlowIntent,
  RegimeNode,
  CausalLink,
  CausalIntervention,
  InterventionOutcome,
  RegimeShiftAlert,
  RegimeType,
} from '../types';

/** V1 causal templates — known causal relationships in crypto microstructure */
interface CausalTemplate {
  name: string;
  fromType: string;      // object type or behaviour
  toType: string;
  causalType: CausalLink['causalType'];
  baseStrength: number;
  evidence: string;
}

const CAUSAL_TEMPLATES: CausalTemplate[] = [
  // Participant → Flow Intent causality
  { name: 'STAT_ARB_SPREAD_RACE', fromType: 'STATISTICAL_ARB', toType: 'FLOW_INTENT', causalType: 'TRIGGERS', baseStrength: 0.8, evidence: 'Statistical arb bots race to capture cross-venue spreads when detected' },
  { name: 'MOMENTUM_IGNITION_CASCADE', fromType: 'MOMENTUM_IGNITION', toType: 'FLOW_INTENT', causalType: 'AMPLIFIES', baseStrength: 0.7, evidence: 'Momentum ignition amplifies directional flow, triggering stop cascades' },
  { name: 'FRONT_RUNNER_PARASITIC', fromType: 'FRONT_RUNNING', toType: 'FLOW_INTENT', causalType: 'PRECEDES', baseStrength: 0.9, evidence: 'Front-runners detect pending orders and jump ahead, degrading fill quality' },
  { name: 'MM_SPREAD_WIDEN', fromType: 'MARKET_MAKING', toType: 'REGIME_NODE', causalType: 'TRIGGERS', baseStrength: 0.6, evidence: 'Market makers widen spreads on informed flow, shifting regime toward volatile' },
  { name: 'WASH_VOLUME_CONFUSION', fromType: 'WASH_TRADING', toType: 'MICROSTRUCTURE_EVENT', causalType: 'DAMPENS', baseStrength: 0.5, evidence: 'Wash trading creates false volume signals, dampening real signal extraction' },

  // Regime → Participant behaviour causality
  { name: 'VOLATILE_REGIME_MM_PULL', fromType: 'VOLATILE', toType: 'MARKET_MAKING', causalType: 'DAMPENS', baseStrength: 0.7, evidence: 'Volatile regimes cause market makers to pull quotes and widen spreads' },
  { name: 'TRENDING_MOMENTUM_AMPLIFY', fromType: 'TRENDING_UP', toType: 'MOMENTUM_IGNITION', causalType: 'AMPLIFIES', baseStrength: 0.6, evidence: 'Trending regime amplifies momentum ignition strategies' },
  { name: 'QUIET_REGIME_ARB_OPPORTUNITY', fromType: 'QUIET', toType: 'STATISTICAL_ARB', causalType: 'TRIGGERS', baseStrength: 0.5, evidence: 'Quiet regimes with tight spreads trigger stat arb bots seeking micro-edges' },
  { name: 'FLASH_CRASH_ALL_EXIT', fromType: 'FLASH_CRASH', toType: 'FLOW_INTENT', causalType: 'TRIGGERS', baseStrength: 0.95, evidence: 'Flash crash triggers mass exit / unwinding across all participant types' },

  // Microstructure → Regime causality
  { name: 'IMBALANCE_REGIME_SHIFT', fromType: 'MICROSTRUCTURE_EVENT', toType: 'REGIME_NODE', causalType: 'TRIGGERS', baseStrength: 0.4, evidence: 'Persistent order book imbalances trigger regime transitions' },
  { name: 'VOLUME_SPIKE_VOLATILITY', fromType: 'MICROSTRUCTURE_EVENT', toType: 'REGIME_NODE', causalType: 'AMPLIFIES', baseStrength: 0.6, evidence: 'Sudden volume spikes amplify transition to volatile regime' },

  // Crowding → Causal trap (the Karp insight)
  { name: 'CROWDED_STRATEGY_TRAP', fromType: 'PARTICIPANT', toType: 'REGIME_NODE', causalType: 'BREAKS', baseStrength: 0.3, evidence: 'When too many participants use the same strategy, the causal link they exploit breaks — the crowded causal trap' },
];

export class WeaverService {
  private graph: GraphService;
  private interventions: CausalIntervention[] = [];
  private regimeAlerts: RegimeShiftAlert[] = [];
  private totalInterventions = 0;
  private totalRegimeShifts = 0;
  private lastIngestAt: string | null = null;
  private lastInterventionAt: string | null = null;
  private lastRegimeScanAt: string | null = null;

  constructor(graph: GraphService) {
    this.graph = graph;
  }

  // ── Ingestion: Observations → Graph ───────────────────────────────

  /** Ingest a rival profile from Sentry → create Participant + discover links */
  ingestParticipant(data: {
    rivalId: string;
    behavior: string;
    crowdedness: number;
    reactionLatencyMs: number;
    venues: string[];
    confidence: number;
  }): { object: OntologyObject; newLinks: number } {
    this.lastIngestAt = new Date().toISOString();

    const obj: ParticipantArchetype = {
      objectId: `participant-${data.rivalId}`,
      objectType: 'PARTICIPANT',
      properties: {
        rivalId: data.rivalId,
        behavior: data.behavior,
        crowdedness: data.crowdedness,
        reactionLatencyMs: data.reactionLatencyMs,
        lastSeenAt: new Date().toISOString(),
        venues: data.venues,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'SENTRY',
      confidence: data.confidence,
    };

    this.graph.upsertObject(obj);

    // Auto-discover causal links from templates
    const newLinks = this.discoverLinks(obj);

    return { object: obj, newLinks };
  }

  /** Ingest a regime observation → create RegimeNode + discover links */
  ingestRegime(data: {
    pair: string;
    venue: string;
    regime: RegimeType;
    strength: number;
  }): { object: OntologyObject; newLinks: number } {
    this.lastIngestAt = new Date().toISOString();

    const obj: RegimeNode = {
      objectId: `regime-${data.venue}-${data.pair}`,
      objectType: 'REGIME_NODE',
      properties: {
        regime: data.regime,
        pair: data.pair,
        venue: data.venue,
        strength: data.strength,
        duration: 0,
        previousRegime: null,
        transitionProbability: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'WEAVER',
      confidence: data.strength,
    };

    // Check for regime change
    const existing = this.graph.getObject(obj.objectId) as RegimeNode | null;
    if (existing && existing.properties.regime !== data.regime) {
      obj.properties.previousRegime = existing.properties.regime;
      obj.properties.transitionProbability = data.strength;
    }

    this.graph.upsertObject(obj);
    const newLinks = this.discoverLinks(obj);

    return { object: obj, newLinks };
  }

  /** Ingest a flow intent observation */
  ingestFlowIntent(data: {
    participantId: string;
    intent: string;
    pair: string;
    side: 'BUY' | 'SELL' | 'BOTH';
    estimatedSizeUsd: number;
    urgency: 'LOW' | 'MEDIUM' | 'HIGH';
    inferredFrom: string;
  }): { object: OntologyObject; newLinks: number } {
    this.lastIngestAt = new Date().toISOString();

    const obj: FlowIntent = {
      objectId: `intent-${data.participantId}-${Date.now()}`,
      objectType: 'FLOW_INTENT',
      properties: {
        participantId: data.participantId,
        intent: data.intent,
        pair: data.pair,
        side: data.side,
        estimatedSizeUsd: data.estimatedSizeUsd,
        urgency: data.urgency,
        inferredFrom: data.inferredFrom,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'WEAVER',
      confidence: 0.6,
    };

    this.graph.upsertObject(obj);

    // Link to participant
    if (this.graph.getObject(`participant-${data.participantId}`)) {
      this.graph.createLink(
        `participant-${data.participantId}`,
        obj.objectId,
        'TRIGGERS',
        0.7,
        0.6,
        `Participant ${data.participantId} inferred intent: ${data.intent}`,
      );
    }

    return { object: obj, newLinks: 1 };
  }

  // ── What-If Interventions ─────────────────────────────────────────

  /** Run a what-if intervention: "What happens if we do X?" */
  runIntervention(description: string, action: CausalIntervention['hypotheticalAction']): CausalIntervention {
    this.totalInterventions++;
    this.lastInterventionAt = new Date().toISOString();

    const outcomes: InterventionOutcome[] = [];
    const affectedLinks: string[] = [];

    if (action.type === 'TRADE') {
      // Simulate what would happen if we placed this trade
      const pair = action.parameters.pair as string;
      const side = action.parameters.side as string;
      const sizeUsd = action.parameters.sizeUsd as number;

      // Find all participants watching this pair
      const participants = this.graph.queryByType('PARTICIPANT');
      for (const p of participants) {
        const props = p.properties as Record<string, unknown>;
        const venues = props.venues as string[] | undefined;
        if (!venues) continue;

        // Trace causal chain from this participant
        const chain = this.graph.traceCausalChain(p.objectId, 2);
        for (const link of chain.links) {
          affectedLinks.push(link.linkId);

          // Predict effect based on trade size vs participant behaviour
          const behavior = props.behavior as string;
          const effect = this.predictTradeEffect(behavior, side, sizeUsd, link);
          outcomes.push({
            objectId: link.toObjectId,
            objectType: this.graph.getObject(link.toObjectId)?.objectType ?? 'PARTICIPANT',
            effect: effect.effect,
            magnitude: effect.magnitude,
            explanation: effect.explanation,
          });
        }
      }
    } else if (action.type === 'REGIME_SHIFT') {
      // Simulate what happens when a regime changes
      const toRegime = action.parameters.toRegime as RegimeType;
      const templates = CAUSAL_TEMPLATES.filter(t => t.fromType === toRegime);

      for (const tmpl of templates) {
        const targets = this.graph.queryByType(tmpl.toType as any);
        for (const target of targets) {
          outcomes.push({
            objectId: target.objectId,
            objectType: target.objectType,
            effect: tmpl.causalType === 'AMPLIFIES' ? 'STRENGTHENED'
              : tmpl.causalType === 'DAMPENS' ? 'WEAKENED'
              : tmpl.causalType === 'BREAKS' ? 'BROKEN'
              : 'UNCHANGED',
            magnitude: tmpl.baseStrength,
            explanation: tmpl.evidence,
          });
        }
      }
    }

    const intervention: CausalIntervention = {
      interventionId: randomUUID().slice(0, 12),
      description,
      hypotheticalAction: action,
      affectedLinks,
      predictedOutcomes: outcomes,
      confidence: outcomes.length > 0 ? outcomes.reduce((s, o) => s + o.magnitude, 0) / outcomes.length : 0,
      simulatedAt: new Date().toISOString(),
    };

    this.interventions.push(intervention);
    if (this.interventions.length > 500) this.interventions.shift();

    return intervention;
  }

  // ── Regime Detection ──────────────────────────────────────────────

  /** Scan for regime shifts — called periodically */
  scanRegimeShifts(): RegimeShiftAlert[] {
    this.lastRegimeScanAt = new Date().toISOString();
    const alerts: RegimeShiftAlert[] = [];

    const regimeNodes = this.graph.queryByType('REGIME_NODE') as RegimeNode[];
    for (const node of regimeNodes) {
      const props = node.properties;
      if (props.previousRegime && props.previousRegime !== props.regime) {
        // Regime has changed — find the causal chain that explains why
        const chain = this.graph.traceCausalChain(node.objectId, 2);
        const weakLinks = chain.links.filter(l => l.strength < 0.3);

        if (props.transitionProbability > 0.5 || weakLinks.length > 0) {
          const alert: RegimeShiftAlert = {
            alertId: randomUUID().slice(0, 12),
            pair: props.pair,
            venue: props.venue,
            fromRegime: props.previousRegime,
            toRegime: props.regime,
            transitionStrength: props.transitionProbability,
            causalChain: chain.links.map(l => l.linkId),
            detectedAt: new Date().toISOString(),
          };

          alerts.push(alert);
          this.regimeAlerts.push(alert);
          this.totalRegimeShifts++;
        }

        // Clear the transition
        props.previousRegime = null;
        props.transitionProbability = 0;
      }
    }

    if (this.regimeAlerts.length > 200) this.regimeAlerts = this.regimeAlerts.slice(-200);

    return alerts;
  }

  /** Get recent regime alerts */
  getRegimeAlerts(limit = 20): RegimeShiftAlert[] {
    return this.regimeAlerts.slice(-limit).reverse();
  }

  /** Get recent interventions */
  getInterventions(limit = 20): CausalIntervention[] {
    return this.interventions.slice(-limit).reverse();
  }

  // ── State ─────────────────────────────────────────────────────────

  getState(uptime: number) {
    const stats = this.graph.getStats();
    const weakLinks = this.graph.findWeakLinks(0.3);
    const totalLinks = stats.totalLinks || 1;

    return {
      totalObjects: stats.totalObjects,
      totalLinks: stats.totalLinks,
      totalInterventions: this.totalInterventions,
      totalRegimeShifts: this.totalRegimeShifts,
      graphHealth: 1 - (weakLinks.length / totalLinks),
      avgLinkDecay: stats.avgLinkStrength,
      lastIngestAt: this.lastIngestAt,
      lastInterventionAt: this.lastInterventionAt,
      lastRegimeScanAt: this.lastRegimeScanAt,
      uptime,
    };
  }

  // ── Private ───────────────────────────────────────────────────────

  /** Discover causal links from templates when a new object arrives */
  private discoverLinks(obj: OntologyObject): number {
    let newLinks = 0;

    for (const tmpl of CAUSAL_TEMPLATES) {
      // Match from-side
      const matchesFrom = this.matchesTemplate(obj, tmpl.fromType);
      if (matchesFrom) {
        // Find targets
        const targets = this.findTemplateTargets(tmpl.toType);
        for (const target of targets) {
          const link = this.graph.createLink(
            obj.objectId,
            target.objectId,
            tmpl.causalType,
            tmpl.baseStrength,
            0.5,  // Initial confidence — grows with reinforcement
            tmpl.evidence,
          );
          if (link) newLinks++;
        }
      }

      // Match to-side (incoming links)
      const matchesTo = this.matchesTemplate(obj, tmpl.toType);
      if (matchesTo) {
        const sources = this.findTemplateSources(tmpl.fromType);
        for (const source of sources) {
          const link = this.graph.createLink(
            source.objectId,
            obj.objectId,
            tmpl.causalType,
            tmpl.baseStrength,
            0.5,
            tmpl.evidence,
          );
          if (link) newLinks++;
        }
      }
    }

    return newLinks;
  }

  private matchesTemplate(obj: OntologyObject, templateType: string): boolean {
    // Match by object type
    if (obj.objectType === templateType) return true;
    // Match by behaviour (for PARTICIPANT objects)
    if (obj.objectType === 'PARTICIPANT') {
      const behavior = (obj.properties as Record<string, unknown>).behavior;
      if (behavior === templateType) return true;
    }
    // Match by regime type (for REGIME_NODE objects)
    if (obj.objectType === 'REGIME_NODE') {
      const regime = (obj.properties as Record<string, unknown>).regime;
      if (regime === templateType) return true;
    }
    return false;
  }

  private findTemplateTargets(templateType: string): OntologyObject[] {
    // Find objects that match the to-side of a template
    const byType = this.graph.queryByType(templateType as any);
    if (byType.length > 0) return byType;

    // Check by behaviour/regime
    const participants = this.graph.queryByType('PARTICIPANT')
      .filter(p => (p.properties as Record<string, unknown>).behavior === templateType);
    if (participants.length > 0) return participants;

    const regimes = this.graph.queryByType('REGIME_NODE')
      .filter(r => (r.properties as Record<string, unknown>).regime === templateType);
    return regimes;
  }

  private findTemplateSources(templateType: string): OntologyObject[] {
    return this.findTemplateTargets(templateType); // Same matching logic
  }

  private predictTradeEffect(
    rivalBehavior: string,
    tradeSide: string,
    sizeUsd: number,
    link: CausalLink,
  ): { effect: InterventionOutcome['effect']; magnitude: number; explanation: string } {
    // V1 heuristic: predict how a rival would react to our trade
    if (rivalBehavior === 'FRONT_RUNNING' && sizeUsd > 100) {
      return { effect: 'STRENGTHENED', magnitude: 0.8, explanation: `Front-runner would detect $${sizeUsd} ${tradeSide} and jump ahead` };
    }
    if (rivalBehavior === 'STATISTICAL_ARB') {
      return { effect: 'STRENGTHENED', magnitude: 0.5, explanation: `Stat arb would interpret as cross-venue spread signal` };
    }
    if (rivalBehavior === 'MOMENTUM_IGNITION' && sizeUsd > 50) {
      return { effect: 'STRENGTHENED', magnitude: 0.6, explanation: `Momentum bot would amplify ${tradeSide} direction` };
    }
    if (rivalBehavior === 'MARKET_MAKING') {
      return { effect: 'WEAKENED', magnitude: 0.4, explanation: `Market maker would widen spread on ${tradeSide} side` };
    }

    return { effect: 'UNCHANGED', magnitude: 0.1, explanation: `Minimal predicted reaction from ${rivalBehavior}` };
  }
}
