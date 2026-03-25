// ═══════════════════════════════════════════════════════════════════════
// GRAPH SERVICE — Living Semantic Graph
//
// The ontology is not a database. It is the operating system.
// Objects link to objects via causal arrows. The graph evolves in real
// time as new observations arrive from Sentry, GTC, and Brighton.
//
// "Store objects and causal links, not pre-computed features.
// The ontology recomputes on demand. Recall stays fast because
// the semantic layer IS the index." — Karp Doctrine
// ═══════════════════════════════════════════════════════════════════════

import { randomUUID } from 'crypto';
import type {
  OntologyObject,
  OntologyObjectType,
  CausalLink,
  CausalType,
  GraphStats,
} from '../types';

export class GraphService {
  private objects: Map<string, OntologyObject> = new Map();
  private links: Map<string, CausalLink> = new Map();

  // Index: objectId → linked linkIds (both directions)
  private outgoing: Map<string, Set<string>> = new Map();
  private incoming: Map<string, Set<string>> = new Map();

  // ── Object CRUD ───────────────────────────────────────────────────

  /** Create or update an object in the graph */
  upsertObject(obj: OntologyObject): OntologyObject {
    const existing = this.objects.get(obj.objectId);
    if (existing) {
      // Update — preserve createdAt, update everything else
      obj.createdAt = existing.createdAt;
      obj.updatedAt = new Date().toISOString();
    }
    this.objects.set(obj.objectId, obj);
    return obj;
  }

  /** Get object by ID */
  getObject(objectId: string): OntologyObject | null {
    return this.objects.get(objectId) ?? null;
  }

  /** Query objects by type */
  queryByType(type: OntologyObjectType): OntologyObject[] {
    return Array.from(this.objects.values())
      .filter(o => o.objectType === type);
  }

  /** Query objects by type and property filter */
  query(type: OntologyObjectType, filter: Record<string, unknown>): OntologyObject[] {
    return this.queryByType(type).filter(obj => {
      for (const [key, value] of Object.entries(filter)) {
        if (obj.properties[key] !== value) return false;
      }
      return true;
    });
  }

  /** Remove object and all its links */
  removeObject(objectId: string): boolean {
    if (!this.objects.has(objectId)) return false;

    // Remove all links connected to this object
    const outLinks = this.outgoing.get(objectId) ?? new Set();
    const inLinks = this.incoming.get(objectId) ?? new Set();
    for (const linkId of [...outLinks, ...inLinks]) {
      this.removeLink(linkId);
    }

    this.objects.delete(objectId);
    this.outgoing.delete(objectId);
    this.incoming.delete(objectId);
    return true;
  }

  // ── Causal Links ──────────────────────────────────────────────────

  /** Create a causal link between two objects */
  createLink(
    fromObjectId: string,
    toObjectId: string,
    causalType: CausalType,
    strength: number,
    confidence: number,
    evidence: string,
    decayRate = 0.05,
  ): CausalLink | null {
    // Both objects must exist
    if (!this.objects.has(fromObjectId) || !this.objects.has(toObjectId)) return null;

    // Check for duplicate (same from, to, type)
    const existing = this.findLink(fromObjectId, toObjectId, causalType);
    if (existing) {
      // Reinforce existing link — EMA blend
      existing.strength = existing.strength * 0.7 + strength * 0.3;
      existing.confidence = existing.confidence * 0.7 + confidence * 0.3;
      existing.lastValidatedAt = new Date().toISOString();
      existing.interventionCount++;
      return existing;
    }

    const link: CausalLink = {
      linkId: randomUUID().slice(0, 12),
      fromObjectId,
      toObjectId,
      causalType,
      strength: Math.min(1, Math.max(0, strength)),
      confidence: Math.min(1, Math.max(0, confidence)),
      evidence,
      discoveredAt: new Date().toISOString(),
      lastValidatedAt: new Date().toISOString(),
      decayRate,
      interventionCount: 0,
    };

    this.links.set(link.linkId, link);

    // Update indices
    if (!this.outgoing.has(fromObjectId)) this.outgoing.set(fromObjectId, new Set());
    if (!this.incoming.has(toObjectId)) this.incoming.set(toObjectId, new Set());
    this.outgoing.get(fromObjectId)!.add(link.linkId);
    this.incoming.get(toObjectId)!.add(link.linkId);

    return link;
  }

  /** Find a specific link by endpoints and type */
  findLink(fromObjectId: string, toObjectId: string, causalType: CausalType): CausalLink | null {
    const outLinks = this.outgoing.get(fromObjectId);
    if (!outLinks) return null;

    for (const linkId of outLinks) {
      const link = this.links.get(linkId);
      if (link && link.toObjectId === toObjectId && link.causalType === causalType) {
        return link;
      }
    }
    return null;
  }

  /** Get all links from an object (outgoing causal arrows) */
  getOutgoing(objectId: string): CausalLink[] {
    const linkIds = this.outgoing.get(objectId) ?? new Set();
    return Array.from(linkIds)
      .map(id => this.links.get(id))
      .filter((l): l is CausalLink => l !== undefined);
  }

  /** Get all links to an object (incoming causal arrows) */
  getIncoming(objectId: string): CausalLink[] {
    const linkIds = this.incoming.get(objectId) ?? new Set();
    return Array.from(linkIds)
      .map(id => this.links.get(id))
      .filter((l): l is CausalLink => l !== undefined);
  }

  /** Get link by ID */
  getLink(linkId: string): CausalLink | null {
    return this.links.get(linkId) ?? null;
  }

  /** Remove a link */
  removeLink(linkId: string): boolean {
    const link = this.links.get(linkId);
    if (!link) return false;

    this.outgoing.get(link.fromObjectId)?.delete(linkId);
    this.incoming.get(link.toObjectId)?.delete(linkId);
    this.links.delete(linkId);
    return true;
  }

  // ── Graph Traversal ───────────────────────────────────────────────

  /** Trace causal chain from an object (BFS, max depth) */
  traceCausalChain(objectId: string, maxDepth = 3): { objects: OntologyObject[]; links: CausalLink[] } {
    const visitedObjects = new Set<string>();
    const visitedLinks = new Set<string>();
    const queue: { id: string; depth: number }[] = [{ id: objectId, depth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visitedObjects.has(current.id) || current.depth > maxDepth) continue;
      visitedObjects.add(current.id);

      for (const link of this.getOutgoing(current.id)) {
        visitedLinks.add(link.linkId);
        if (!visitedObjects.has(link.toObjectId)) {
          queue.push({ id: link.toObjectId, depth: current.depth + 1 });
        }
      }
    }

    return {
      objects: Array.from(visitedObjects).map(id => this.objects.get(id)!).filter(Boolean),
      links: Array.from(visitedLinks).map(id => this.links.get(id)!).filter(Boolean),
    };
  }

  /** Find weakest links in a causal chain (likely to break) */
  findWeakLinks(threshold = 0.3): CausalLink[] {
    return Array.from(this.links.values())
      .filter(l => l.strength < threshold)
      .sort((a, b) => a.strength - b.strength);
  }

  // ── Decay & Maintenance ───────────────────────────────────────────

  /** Apply decay to all links — unreinforced links weaken over time */
  applyDecay(): { decayed: number; pruned: number } {
    let decayed = 0;
    let pruned = 0;

    for (const link of Array.from(this.links.values())) {
      const hoursSinceValidation =
        (Date.now() - new Date(link.lastValidatedAt).getTime()) / 3600000;

      if (hoursSinceValidation > 0) {
        const decay = link.decayRate * hoursSinceValidation;
        link.strength = Math.max(0, link.strength - decay);
        decayed++;

        // Prune dead links (strength drops to 0)
        if (link.strength <= 0.01) {
          this.removeLink(link.linkId);
          pruned++;
        }
      }
    }

    return { decayed, pruned };
  }

  /** Prune objects with no links and low confidence */
  pruneOrphans(minConfidence = 0.2): number {
    let pruned = 0;
    for (const obj of Array.from(this.objects.values())) {
      const outLinks = this.outgoing.get(obj.objectId)?.size ?? 0;
      const inLinks = this.incoming.get(obj.objectId)?.size ?? 0;
      if (outLinks === 0 && inLinks === 0 && obj.confidence < minConfidence) {
        this.objects.delete(obj.objectId);
        pruned++;
      }
    }
    return pruned;
  }

  // ── Stats ─────────────────────────────────────────────────────────

  getStats(): GraphStats {
    const objectsByType: Record<string, number> = {};
    const linksByType: Record<string, number> = {};

    for (const obj of this.objects.values()) {
      objectsByType[obj.objectType] = (objectsByType[obj.objectType] ?? 0) + 1;
    }

    let totalStrength = 0;
    let totalConfidence = 0;
    let weakLinks = 0;

    for (const link of this.links.values()) {
      linksByType[link.causalType] = (linksByType[link.causalType] ?? 0) + 1;
      totalStrength += link.strength;
      totalConfidence += link.confidence;
      if (link.strength < 0.3) weakLinks++;
    }

    const linkCount = this.links.size || 1;

    return {
      totalObjects: this.objects.size,
      totalLinks: this.links.size,
      objectsByType: objectsByType as Record<OntologyObjectType, number>,
      linksByType: linksByType as Record<CausalType, number>,
      avgLinkStrength: totalStrength / linkCount,
      avgLinkConfidence: totalConfidence / linkCount,
      weakLinks,
      regimeDistribution: this.getRegimeDistribution(),
    };
  }

  private getRegimeDistribution(): Record<string, number> {
    const dist: Record<string, number> = {};
    for (const obj of this.queryByType('REGIME_NODE')) {
      const regime = (obj.properties as Record<string, unknown>).regime as string;
      if (regime) dist[regime] = (dist[regime] ?? 0) + 1;
    }
    return dist;
  }
}
