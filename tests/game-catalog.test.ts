import { describe, expect, it } from 'vitest';
import { compileAndRun } from './helpers/compiler';

describe('game catalog + menu game', () => {
  it('scans games dir and runs menu index.tsx', () => {
    const { compile, run } = compileAndRun(
      'gallery/game_engine/scripting/game_catalog_demo.rgr'
    );
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    const out = run?.output || '';
    expect(out).toContain('catalog entries:');
    expect(out).toContain('menu game OK');
    expect(out).not.toContain('FAIL');
  });
});
