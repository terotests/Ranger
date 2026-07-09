import { describe, expect, it } from 'vitest';
import { compileAndRun } from './helpers/compiler';

describe('game engine host features', () => {
  it('runs persistence + native bridge smoke test', () => {
    const { compile, run } = compileAndRun(
      'gallery/game_engine/scripting/game_host_native_demo.rgr'
    );
    expect(compile.success, compile.error || compile.output).toBe(true);
    expect(run?.success, run?.error).toBe(true);
    const out = run?.output || '';
    expect(out).toContain('persistence roundtrip OK');
    expect(out).toContain('native bridge OK');
    expect(out).not.toContain('FAIL');
  });

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
