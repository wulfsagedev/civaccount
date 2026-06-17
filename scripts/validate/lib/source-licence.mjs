/**
 * lib/source-licence.mjs — the source-licence rule as code.
 *
 * THE RULE (CLAUDE.md "Data Sources", NORTH-STAR §3, owner directive
 * 2026-06-10): every data point must come from ONS, GOV.UK, or material
 * published under the Open Government Licence. Zero tolerance for
 * anything else.
 *
 * Enforcement model:
 *   1. Sovereign domains — anything under .gov.uk (covers GOV.UK,
 *      ons.gov.uk, legislation.gov.uk, *.service.gov.uk, every council's
 *      own site and open-data subdomains). Allowed.
 *   2. Named OGL publishers — public bodies that publish under OGL but
 *      live off .gov.uk. Each entry carries a WRITTEN justification.
 *      Adding a domain here is a reviewed code change — that is the
 *      zero-tolerance workflow: nothing joins the allowlist silently.
 *   3. web.archive.org — allowed ONLY as a preservation wrapper: the
 *      wrapped original URL is unwrapped and must itself pass rule 1
 *      or 2. An archive of a forbidden source is still forbidden.
 *   4. Everything else fails. Known bad actors (Wikipedia, Glassdoor,
 *      TPA Rich List…) get a sharper message, but the default is deny —
 *      the forbidden list is documentation, not the mechanism.
 *
 * Used by:
 *   - validators/forbidden-source-scan.mjs (the validate-suite gate)
 *   - council-research/01-inventory.mjs (rejects at discovery time)
 *   - council-research/05-populate.mjs (refuses to write violations)
 *   - council-research/pipeline-selftest.mjs (fixture tests)
 */

/** Named OGL publishers off .gov.uk — keep justifications current. */
export const OGL_PUBLISHERS = [
  {
    match: (host) => host === 'lgbce.org.uk' || host.endsWith('.lgbce.org.uk'),
    name: 'LGBCE',
    justification:
      'Local Government Boundary Commission for England — statutory public body; electoral data published under the Open Government Licence v3.0.',
  },
  {
    match: (host) => host.endsWith('.moderngov.co.uk'),
    name: 'ModernGov committee system',
    justification:
      "Civica ModernGov hosts councils' statutory committee papers (Statements of Accounts, pay policies, allowances schemes). The documents are the council's own official publications under OGL v3.0; only the hosting domain is commercial.",
  },
  {
    match: (host) => host.endsWith('.cmis.uk.com'),
    name: 'CMIS committee system',
    justification:
      "Civica CMIS — the other major council committee-management system (Cambridgeshire, Norfolk, Colchester…). Same nature as ModernGov: the hosted documents are the council's own official publications under OGL v3.0.",
  },
  {
    match: (host) => host.endsWith('.azeusconvene.com'),
    name: 'Azeus Convene committee system',
    justification:
      "Azeus Convene committee-management hosting (e.g. cms-centralbedfordshire-uk.azeusconvene.com). Same nature as ModernGov/CMIS: council's own statutory papers under OGL v3.0 on a vendor host.",
  },
  {
    match: (host) => host === 'basildonmeetings.info',
    name: 'Basildon committee system',
    justification:
      "Basildon Borough Council's own ModernGov instance on a vanity domain — the council's official committee papers under OGL v3.0.",
  },
  {
    match: (host) => host === 'cqc.org.uk' || host.endsWith('.cqc.org.uk'),
    name: 'Care Quality Commission',
    justification:
      'CQC — statutory regulator (non-departmental public body); inspection ratings and provider data published under the Open Government Licence v3.0.',
  },
];

/** Known bad actors — denied anyway by default-deny; listed for sharper messages. */
export const FORBIDDEN_SOURCES = [
  { match: (h) => h.endsWith('wikipedia.org'), name: 'Wikipedia' },
  { match: (h) => h.endsWith('glassdoor.com') || h.endsWith('glassdoor.co.uk'), name: 'Glassdoor' },
  { match: (h) => h.endsWith('taxpayersalliance.com'), name: 'TaxPayers’ Alliance (explicitly not an approved source — CLAUDE.md)' },
];

export function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Unwrap a Wayback Machine URL to the original it preserves, or null. */
export function unwrapWayback(url) {
  const m = String(url).match(/^https?:\/\/web\.archive\.org\/web\/\d+(?:[a-z_]+)?\/(https?:\/\/.+)$/i);
  return m ? m[1] : null;
}

/**
 * Classify one URL against the rule.
 * Returns { allowed, basis, host, name?, justification?, reason? }.
 *   basis: 'gov-uk' | 'ogl-publisher' | 'wayback-of-allowed' | 'denied'
 */
export function classifySourceUrl(url) {
  if (!url || typeof url !== 'string') {
    return { allowed: false, basis: 'denied', host: null, reason: 'empty or non-string URL' };
  }

  // Rule 3: archive wrapper — judge the original it preserves.
  const wrapped = unwrapWayback(url);
  if (wrapped) {
    const inner = classifySourceUrl(wrapped);
    return inner.allowed
      ? { ...inner, basis: 'wayback-of-allowed' }
      : { allowed: false, basis: 'denied', host: hostnameOf(url), reason: `Wayback copy of a non-allowed source (${inner.host ?? wrapped}): ${inner.reason ?? 'not .gov.uk / not a named OGL publisher'}` };
  }

  const host = hostnameOf(url);
  if (!host) return { allowed: false, basis: 'denied', host: null, reason: `unparseable URL: ${String(url).slice(0, 80)}` };

  // Sharper message for known bad actors.
  for (const f of FORBIDDEN_SOURCES) {
    if (f.match(host)) {
      return { allowed: false, basis: 'denied', host, reason: `${f.name} is an explicitly forbidden source` };
    }
  }

  // Rule 1: sovereign .gov.uk (includes ons.gov.uk, legislation.gov.uk, councils).
  if (host === 'gov.uk' || host.endsWith('.gov.uk')) {
    return { allowed: true, basis: 'gov-uk', host };
  }

  // Rule 2: named OGL publishers.
  for (const p of OGL_PUBLISHERS) {
    if (p.match(host)) {
      return { allowed: true, basis: 'ogl-publisher', host, name: p.name, justification: p.justification };
    }
  }

  // Rule 4: default deny.
  return {
    allowed: false,
    basis: 'denied',
    host,
    reason: `${host} is not .gov.uk and not a named OGL publisher — if this is genuinely OGL-licensed official data, add it to OGL_PUBLISHERS in scripts/validate/lib/source-licence.mjs with a written justification`,
  };
}

/**
 * Collect every source URL carried by one council record (the parsed
 * object shape produced by scripts/validate/load-councils.mjs), tagged
 * with where it lives so violations are actionable.
 */
export function collectCouncilUrls(council) {
  const out = [];
  const d = council.detailed || {};

  for (const f of ['budget_url', 'accounts_url', 'transparency_url', 'councillors_url', 'council_tax_url', 'website']) {
    if (typeof d[f] === 'string' && /^https?:/.test(d[f])) out.push({ where: `detailed.${f}`, url: d[f] });
  }
  for (const [k, fs] of Object.entries(d.field_sources || {})) {
    if (fs?.url) out.push({ where: `field_sources.${k}.url`, url: fs.url });
    if (fs?.wayback_url) out.push({ where: `field_sources.${k}.wayback_url`, url: fs.wayback_url });
  }
  (d.documents || []).forEach((doc, i) => {
    if (doc?.url) out.push({ where: `documents[${i}] (${doc.title ?? ''})`, url: doc.url });
  });
  (d.sources || []).forEach((s, i) => {
    if (s?.url) out.push({ where: `sources[${i}] (${s.title ?? ''})`, url: s.url });
  });
  (d.open_data_links || []).forEach((group, gi) => {
    (group?.links || []).forEach((l, li) => {
      if (l?.url) out.push({ where: `open_data_links[${gi}].links[${li}] (${l.label ?? ''})`, url: l.url });
    });
  });
  return out;
}
