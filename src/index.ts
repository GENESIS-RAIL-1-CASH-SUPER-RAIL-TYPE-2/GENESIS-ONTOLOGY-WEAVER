// ═══════════════════════════════════════════════════════════════════════
// GENESIS ONTOLOGY WEAVER — Living Causal Graph Engine
// Port 8849 | "They optimize functions. We operationalize truth."
//
// The missing layer between Sentry's observations and Ghost's predictions.
// Discovers WHY patterns exist, not just THAT they exist.
// Causal foresight measured in regimes, not microseconds.
//
// Three-Layer Ontology (Palantir Foundry architecture):
//   Semantic:  Objects, Properties, Causal Links
//   Kinetic:   What-If Interventions, Auto-Discovery
//   Dynamic:   Provenance, Decay, Audit Trails
//
// V1: Rule-based causal templates (12 templates, 8 regime types)
// V2: DoWhy/CausalNex causal discovery when GPU arrives
//
// Feeds: Sentry → Weaver → Ghost Simulator / TPO / CIA
// "The graph evolves faster than the market can adapt."
// ═══════════════════════════════════════════════════════════════════════

import express, { Request, Response } from 'express';
import { GraphService } from './services/graph.service';
import { WeaverService } from './services/weaver.service';
import type { RegimeType } from './types';

// ── Configuration ──
const PORT = parseInt(process.env.PORT || '8849', 10);
const SENTRY_URL = process.env.SENTRY_URL || 'http://genesis-sentry:8846';
const GHOST_URL = process.env.GHOST_URL || 'http://genesis-ghost-simulator:8847';
const CIA_URL = process.env.CIA_URL || 'http://genesis-cia:8797';
const GTC_URL = process.env.GTC_URL || 'http://genesis-beachhead-gtc:8650';
const WHITEBOARD_URL = process.env.WHITEBOARD_URL || 'http://genesis-whiteboard:8710';

// ── Services ──
const graph = new GraphService();
const weaver = new WeaverService(graph);

// ── Express App ──
const app = express();
app.use(express.json());

const startTime = Date.now();

// ── Fire-and-forget ──
function fire(url: string, payload: unknown): void {
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════════════
// HEALTH (3 endpoints)
// ═══════════════════════════════════════════════════════════════════════

app.get('/health', (_req: Request, res: Response) => {
  const state = weaver.getState(Date.now() - startTime);
  res.json({
    status: 'OPERATIONAL',
    service: 'GENESIS-ONTOLOGY-WEAVER',
    version: '1.0',
    port: PORT,
    doctrine: 'They optimize functions. We operationalize truth.',
    objects: state.totalObjects,
    links: state.totalLinks,
    graphHealth: state.graphHealth.toFixed(3),
    uptime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
});

app.get('/state', (_req: Request, res: Response) => {
  res.json(weaver.getState(Date.now() - startTime));
});

app.get('/metrics', (_req: Request, res: Response) => {
  res.json({
    state: weaver.getState(Date.now() - startTime),
    graph: graph.getStats(),
    uptime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
});

// ═══════════════════════════════════════════════════════════════════════
// GRAPH (5 endpoints)
// ═══════════════════════════════════════════════════════════════════════

/** POST /ingest/participant — ingest rival profile from Sentry */
app.post('/ingest/participant', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data?.rivalId || !data?.behavior) {
      res.status(400).json({ ok: false, error: 'rivalId and behavior required' });
      return;
    }
    const result = weaver.ingestParticipant(data);
    res.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /ingest/regime — ingest regime observation */
app.post('/ingest/regime', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data?.pair || !data?.venue || !data?.regime) {
      res.status(400).json({ ok: false, error: 'pair, venue, regime required' });
      return;
    }
    const result = weaver.ingestRegime(data);
    res.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

/** POST /ingest/intent — ingest flow intent observation */
app.post('/ingest/intent', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data?.participantId || !data?.intent || !data?.pair) {
      res.status(400).json({ ok: false, error: 'participantId, intent, pair required' });
      return;
    }
    const result = weaver.ingestFlowIntent(data);
    res.json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

/** GET /graph/stats — full graph statistics */
app.get('/graph/stats', (_req: Request, res: Response) => {
  res.json(graph.getStats());
});

/** GET /graph/trace/:objectId — trace causal chain from an object */
app.get('/graph/trace/:objectId', (req: Request, res: Response) => {
  const depth = parseInt(req.query.depth as string || '3', 10);
  const objectId = req.params.objectId as string;
  const chain = graph.traceCausalChain(objectId, depth);
  res.json({
    rootObject: objectId,
    depth,
    objects: chain.objects.length,
    links: chain.links.length,
    chain,
  });
});

// ═══════════════════════════════════════════════════════════════════════
// INTERVENTIONS (2 endpoints)
// ═══════════════════════════════════════════════════════════════════════

/** POST /intervene — run a what-if intervention against the graph */
app.post('/intervene', (req: Request, res: Response) => {
  try {
    const { description, action } = req.body;
    if (!description || !action?.type) {
      res.status(400).json({ ok: false, error: 'description and action.type required' });
      return;
    }
    const result = weaver.runIntervention(description, action);
    res.json({ ok: true, intervention: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ ok: false, error: message });
  }
});

/** GET /interventions — recent intervention history */
app.get('/interventions', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '20', 10);
  const interventions = weaver.getInterventions(limit);
  res.json({ interventions, count: interventions.length });
});

// ═══════════════════════════════════════════════════════════════════════
// REGIME (2 endpoints)
// ═══════════════════════════════════════════════════════════════════════

/** GET /regime/alerts — recent regime shift alerts */
app.get('/regime/alerts', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string || '20', 10);
  const alerts = weaver.getRegimeAlerts(limit);
  res.json({ alerts, count: alerts.length });
});

/** GET /graph/weak-links — causal links likely to break */
app.get('/graph/weak-links', (req: Request, res: Response) => {
  const threshold = parseFloat(req.query.threshold as string || '0.3');
  const weakLinks = graph.findWeakLinks(threshold);
  res.json({
    weakLinks,
    count: weakLinks.length,
    warning: weakLinks.length > 5 ? 'Multiple causal chains weakening — rivals may be adapting' : null,
  });
});

// ═══════════════════════════════════════════════════════════════════════
// LOOPS
// ═══════════════════════════════════════════════════════════════════════

/** Loop 1: Causal Link Decay (60s) — unreinforced links weaken */
function startDecayLoop(): void {
  setInterval(() => {
    const result = graph.applyDecay();
    const pruned = graph.pruneOrphans();
    if (result.pruned > 0 || pruned > 0) {
      console.log(`[WEAVER] Decay: ${result.decayed} links decayed, ${result.pruned} links pruned, ${pruned} orphan objects removed`);
    }
  }, 60000);
  console.log('[WEAVER] Loop 1: Causal Link Decay — every 60s');
}

/** Loop 2: Regime Scanner (120s) — detect regime shifts + alert CIA */
function startRegimeScannerLoop(): void {
  setInterval(() => {
    const alerts = weaver.scanRegimeShifts();
    for (const alert of alerts) {
      console.log(`[WEAVER] REGIME SHIFT: ${alert.pair}@${alert.venue} ${alert.fromRegime} → ${alert.toRegime} (strength=${alert.transitionStrength.toFixed(2)})`);

      // Alert CIA
      fire(`${CIA_URL}/assessment/receive`, {
        type: 'REGIME_SHIFT',
        title: `Regime shift: ${alert.pair} @ ${alert.venue}`,
        summary: `${alert.fromRegime} → ${alert.toRegime}. Transition strength: ${alert.transitionStrength.toFixed(2)}. ${alert.causalChain.length} causal links in chain.`,
        source: 'GENESIS-ONTOLOGY-WEAVER',
        timestamp: new Date().toISOString(),
      });

      // Forward to Whiteboard
      fire(`${WHITEBOARD_URL}/intel/ingest`, {
        source: 'ONTOLOGY_WEAVER',
        category: 'REGIME_SHIFT',
        content: alert,
        confidence: alert.transitionStrength,
        timestamp: new Date().toISOString(),
      });
    }
  }, 120000);
  console.log('[WEAVER] Loop 2: Regime Scanner — every 120s (→ CIA + Whiteboard)');
}

/** Loop 3: Sentry Sync (120s) — pull rival profiles into graph */
function startSentrySyncLoop(): void {
  setInterval(async () => {
    try {
      const res = await fetch(`${SENTRY_URL}/profiles`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return;
      const data = await res.json() as { profiles?: Array<{ rivalId: string; behavior: string; crowdedness: number; reactionLatencyMs: number; venues: string[]; confidence: number }> };
      if (data.profiles?.length) {
        let ingested = 0;
        for (const p of data.profiles) {
          weaver.ingestParticipant(p);
          ingested++;
        }
        if (ingested > 0) {
          console.log(`[WEAVER] Sentry sync: ${ingested} participant(s) ingested into graph`);
        }
      }
    } catch {
      // Sentry may not be running
    }
  }, 120000);
  console.log('[WEAVER] Loop 3: Sentry Sync — every 120s (← Sentry profiles)');
}

/** Loop 4: Intel Forward (300s) — push graph stats to GTC */
function startIntelForwardLoop(): void {
  setInterval(() => {
    const state = weaver.getState(Date.now() - startTime);
    const stats = graph.getStats();

    fire(`${GTC_URL}/telemetry/append`, {
      eventType: 'WEAVER_HEARTBEAT',
      source: 'genesis-ontology-weaver',
      eventId: `weaver-${Date.now()}`,
      payload: {
        objects: state.totalObjects,
        links: state.totalLinks,
        graphHealth: state.graphHealth,
        interventions: state.totalInterventions,
        regimeShifts: state.totalRegimeShifts,
        weakLinks: stats.weakLinks,
      },
      timestamp: new Date().toISOString(),
    });
  }, 300000);
  console.log('[WEAVER] Loop 4: Intel Forward — every 300s (→ GTC)');
}

// ═══════════════════════════════════════════════════════════════════════
// STARTUP
// ═══════════════════════════════════════════════════════════════════════

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  GENESIS ONTOLOGY WEAVER — Living Causal Graph Engine');
  console.log(`  Port: ${PORT}`);
  console.log('  Doctrine: "They optimize functions. We operationalize truth."');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log('  Endpoints (12):');
  console.log('    Health:        GET  /health, /state, /metrics');
  console.log('    Ingestion:     POST /ingest/participant, /ingest/regime, /ingest/intent');
  console.log('    Graph:         GET  /graph/stats, /graph/trace/:id, /graph/weak-links');
  console.log('    Interventions: POST /intervene, GET /interventions');
  console.log('    Regime:        GET  /regime/alerts');
  console.log('');
  console.log('  Loops (4):');
  console.log('    [1] Causal Link Decay  — 60s  (unreinforced links weaken)');
  console.log('    [2] Regime Scanner     — 120s (→ CIA + Whiteboard on shift)');
  console.log('    [3] Sentry Sync        — 120s (← Sentry rival profiles)');
  console.log('    [4] Intel Forward      — 300s (→ GTC)');
  console.log('');
  console.log('  Three-Layer Ontology:');
  console.log('    Semantic: Objects + Causal Links (12 V1 templates)');
  console.log('    Kinetic:  What-If Interventions + Auto-Discovery');
  console.log('    Dynamic:  Provenance, Decay, Audit Trails');
  console.log('');
  console.log('  V1: Rule-based causal templates');
  console.log('  V2: DoWhy/CausalNex causal discovery (GPU tier)');
  console.log('');
  console.log('  The graph sees the arrows no one else has modeled.');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  startDecayLoop();
  startRegimeScannerLoop();
  startSentrySyncLoop();
  startIntelForwardLoop();
});

// ── Graceful Shutdown ──
process.on('SIGTERM', () => { console.log('[WEAVER] SIGTERM — shutdown'); process.exit(0); });
process.on('SIGINT', () => { console.log('[WEAVER] SIGINT — shutdown'); process.exit(0); });
