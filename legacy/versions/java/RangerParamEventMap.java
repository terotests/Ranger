import java.util.*;
import java.util.Optional;

class RangerParamEventMap { 
  public HashMap<String,RangerParamEventList> events = new HashMap<String,RangerParamEventList>();
  
  public void clearAllEvents() {
  }
  
  public void addEvent( String name , RangerParamEventHandler e ) {
    if ( (events.containsKey(name)) == false ) {
      events.put(name, new RangerParamEventList());
    }
    final RangerParamEventList list = (Optional.ofNullable(events.get(name))).get();
    list.list.add(e);
  }
  
  public void fireEvent( String name , RangerAppParamDesc from ) {
    if ( events.containsKey(name) ) {
      final RangerParamEventList list = (Optional.ofNullable(events.get(name))).get();
      for ( int i = 0; i < list.list.size(); i++) {
        RangerParamEventHandler ev = list.list.get(i);
        ev.callback(from);
      }
    }
  }
}
