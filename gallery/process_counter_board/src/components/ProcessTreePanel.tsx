import { useState } from "react";
import { ProcessRuntime } from "../generated/counter_board";
import type { RangerProcessBase } from "../generated/counter_board";

function label(proc: RangerProcessBase): string {
  let s = proc.__rangerClassName + " #" + proc.__rangerId;
  if (proc.__rangerPath && proc.__rangerPath.length > 0) {
    s += " path=" + proc.__rangerPath;
  }
  if (proc.__rangerParentId !== 0) {
    s += " parent=" + proc.__rangerParentId;
  }
  return s;
}

function TreeNode({ proc, depth }: { proc: RangerProcessBase; depth: number }) {
  const children = proc.__rangerChildren ?? [];
  const live = children.filter((c) => c.__rangerId !== 0);
  return (
    <li>
      <div style={{ paddingLeft: depth * 12 }}>{label(proc)}</div>
      {live.length > 0 && (
        <ul>
          {live.map((ch) => (
            <TreeNode key={ch.__rangerId} proc={ch} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ProcessTreePanel() {
  const [open, setOpen] = useState(true);

  const roots: RangerProcessBase[] = ProcessRuntime.collectAllLiveRoots();

  return (
    <aside className="tree-panel">
      <button type="button" className="tree-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "Hide" : "Show"} process tree
      </button>
      {open && (
        <ul className="tree">
          {roots.length === 0 ? (
            <li className="muted">(no live roots)</li>
          ) : (
            roots.map((r) => <TreeNode key={r.__rangerId} proc={r} depth={0} />)
          )}
        </ul>
      )}
    </aside>
  );
}
