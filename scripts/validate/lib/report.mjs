/**
 * report.mjs — Finding class + ReportBuilder for validation results.
 */

export class Finding {
  constructor(council, onsCode, validator, check, severity, message, field, value, expected) {
    this.council = council;
    this.ons_code = onsCode;
    this.validator = validator;
    this.check = check;
    this.severity = severity; // 'error' | 'warning' | 'info'
    this.message = message;
    this.field = field || null;
    this.value = value ?? null;
    this.expected = expected || null;
  }
}

export class ReportBuilder {
  constructor() {
    this.findings = [];
    this.completeness = { by_council: {}, by_field: {} };
    this.checksRun = 0;
  }

  add(finding) {
    this.findings.push(finding);
  }

  finding(council, validator, check, severity, message, field, value, expected) {
    this.add(new Finding(
      council.name, council.ons_code, validator, check,
      severity, message, field, value, expected
    ));
  }

  tick() {
    this.checksRun++;
  }

  setCompleteness(completeness) {
    this.completeness = completeness;
  }

  build() {
    const errors = this.findings.filter(f => f.severity === 'error').length;
    const warnings = this.findings.filter(f => f.severity === 'warning').length;
    const info = this.findings.filter(f => f.severity === 'info').length;
    const regressions = this.findings.filter(f => f.check === 'regression_field_lost').length;

    // Calculate parity from completeness data
    const councilScores = Object.values(this.completeness.by_council);
    const avgParity = councilScores.length > 0
      ? councilScores.reduce((s, c) => s + c.score, 0) / councilScores.length
      : 0;

    const byType = {};
    for (const c of councilScores) {
      if (!byType[c.type]) byType[c.type] = [];
      byType[c.type].push(c.score);
    }
    const parityByType = {};
    for (const [type, scores] of Object.entries(byType)) {
      parityByType[type] = +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    }

    return {
      timestamp: new Date().toISOString(),
      summary: {
        total_councils: councilScores.length || 317,
        total_checks: this.checksRun,
        errors,
        warnings,
        info,
        regressions,
        parity: {
          average: +avgParity.toFixed(1),
          by_type: parityByType,
        },
      },
      findings: this.findings,
      completeness: this.completeness,
    };
  }
}
