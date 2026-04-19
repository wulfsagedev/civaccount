/**
 * Safe JSON-LD serialisation for inline <script> tags.
 *
 * `JSON.stringify` does not escape `<`, `>`, or the Unicode line separators
 * U+2028 / U+2029.  When its output is embedded verbatim into a
 * `<script type="application/ld+json">` tag via `dangerouslySetInnerHTML`,
 * any field that contains the literal substring `</script>` — whether put
 * there deliberately by an attacker via URL slugs, or inadvertently via
 * future dataset edits — closes the script tag early and allows XSS.
 *
 * `serializeJsonLd` replaces the four characters that can break out of a
 * script block with their escaped Unicode forms.  The output is still
 * valid JSON, and browsers' JSON-LD parsers unescape them back to the
 * original characters.
 *
 * References:
 *   - https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html#rule-31-html-escape-json-values-in-an-html-context
 *   - https://html.spec.whatwg.org/multipage/scripting.html#restrictions-for-contents-of-script-elements
 *
 * Use this anywhere you compose an inline JSON-LD payload:
 *
 *   <script
 *     type="application/ld+json"
 *     dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
 *   />
 */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
