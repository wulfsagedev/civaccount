// The six launch checks (LEGAL-AUDIT-2026-09.md, sections 10 and 11; 17 November 2026): accounts are for adults and
// say so where people sign in, the weekly digest goes only to people who asked for it, and there is a published way to
// report a post or a copyright work used without permission.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(__dirname, '../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

describe('accounts', () => {
  it('are for people aged 18 or over, in the terms and where people sign in', () => {
    expect(read('src/app/terms/page.tsx')).toContain('You need to be 18 or over to make an account.');
    const login = read('src/app/auth/login/page.tsx');
    expect(login).toContain('Accounts are for people aged 18 or over.');
    expect(login).toContain('href="/terms"');
  });
});

describe('the weekly digest', () => {
  it('goes only to people who asked for it', () => {
    expect(read('src/../supabase/functions/email-digest/index.ts')).toContain(".eq('digest_opt_in', true)");
  });

  it('starts with nobody asked', () => {
    expect(read('supabase/migrations/004_digest_opt_in.sql')).toMatch(
      /add column if not exists digest_opt_in boolean not null default false/,
    );
  });
});

describe('reporting', () => {
  const terms = read('src/app/terms/page.tsx');

  it('has its own section in the terms, with the report form one press away', () => {
    expect(terms).toContain('id="reporting"');
    expect(terms).toContain("new CustomEvent('open-feedback'");
  });

  it('asks for what a copyright notice needs, and closes the accounts of repeat infringers', () => {
    expect(terms).toContain('under penalty of perjury');
    expect(terms).toContain('close the accounts');
  });

  it('leaves no report template behind in the plain feedback form', () => {
    // the last template is read before setFormData, never inside its updater,
    // which React may run after lastTemplate has changed
    const dialog = read('src/components/FeatureRequestDialog.tsx');
    const at = (s: string) => dialog.indexOf(s);
    expect(at('const previous = lastTemplate.current;')).toBeGreaterThan(-1);
    expect(at('const previous = lastTemplate.current;')).toBeLessThan(at('setFormData((prev) => ({'));
    expect(dialog).toContain("prev.message === previous ? '' : prev.message");
    expect(dialog).not.toContain('prev.message === lastTemplate.current');
  });
});
