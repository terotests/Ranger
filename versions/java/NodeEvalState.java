import java.util.Optional;

class NodeEvalState { 
  public Optional<RangerAppWriterContext> ctx = Optional.empty()     /** note: unused */;
  public boolean is_running = false     /** note: unused */;
  public int child_index = -1     /** note: unused */;
  public int cmd_index = -1     /** note: unused */;
  public boolean is_ready = false     /** note: unused */;
  public boolean is_waiting = false     /** note: unused */;
  public boolean exit_after = false     /** note: unused */;
  public boolean expand_args = false     /** note: unused */;
  public boolean ask_expand = false     /** note: unused */;
  public boolean eval_rest = false     /** note: unused */;
  public int exec_cnt = 0     /** note: unused */;
  public boolean b_debugger = false     /** note: unused */;
  public boolean b_top_node = false     /** note: unused */;
  public boolean ask_eval = false     /** note: unused */;
  public boolean param_eval_on = false     /** note: unused */;
  public int eval_index = -1     /** note: unused */;
  public int eval_end_index = -1     /** note: unused */;
  public int ask_eval_start = 0     /** note: unused */;
  public int ask_eval_end = 0     /** note: unused */;
  public Optional<CodeNode> evaluating_cmd = Optional.empty()     /** note: unused */;
}
