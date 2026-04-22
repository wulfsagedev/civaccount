/**
 * lib/prov.mjs — W3C PROV-compatible lineage emission.
 *
 * Every extracted value has a PROV triple: source Entity → extraction
 * Activity → rendered Entity, with an associated Agent.
 *
 * Exports:
 *   buildProvGraph(extractedValue) → PROV JSON-LD graph fragment
 *   plainEnglishLineage(extractedValue) → string
 *
 * PROV-DM reference: https://www.w3.org/TR/prov-dm/
 * PROV-O reference:  https://www.w3.org/TR/prov-o/
 *
 * Spec: NORTH-STAR.md §7 (W3C PROV lineage)
 *
 * Scaffold — implementation in Phase B.
 */

// TODO:
// - buildProvGraph returns JSON-LD with @context pointing at prov-o:
//   {
//     "@context": {"prov": "http://www.w3.org/ns/prov#", ...},
//     "@graph": [
//       {"@id": "civaccount:entity/source/<sha256>",
//        "@type": "prov:Entity", ...},
//       {"@id": "civaccount:activity/extract/<commit>/<timestamp>",
//        "@type": "prov:Activity", ...},
//       {"@id": "civaccount:agent/claude-under-commit-<sha>",
//        "@type": "prov:Agent", ...},
//       {"@id": "civaccount:entity/value/<council>/<field>",
//        "@type": "prov:Entity",
//        "prov:wasDerivedFrom": {"@id": "civaccount:entity/source/..."},
//        "prov:wasGeneratedBy": {"@id": "civaccount:activity/extract/..."}}
//     ]
//   }
// - plainEnglishLineage returns:
//   "The [council] [year] [field] [value] was extracted from
//    [document_title] page [N] (sha256 [first-12-chars]…) by [agent]
//    on [date], verified against [url]"

export function buildProvGraph(_extractedValue) {
  throw new Error('buildProvGraph: not yet implemented — scaffold only');
}

export function plainEnglishLineage(_extractedValue) {
  throw new Error('plainEnglishLineage: not yet implemented — scaffold only');
}
