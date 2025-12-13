
; Date functions
; https://cdnjs.cloudflare.com/ajax/libs/date-fns/1.29.0/date_fns.min.js

systemclass SystemDate {
  es6 Date
}

operator type:void es6 {
  
  fn to_date:SystemDate ( value:int ) ('new Date(' (e 1) ')')
  fn to_date:SystemDate ( y:int m:int d:int) ('new Date(' (e 1) ', ' (e 2) ' - 1, ' (e 3) ')')
  fn to_string:string (d:SystemDate) ( (e 1) '.toString()')
  fn to_utc:int (d:SystemDate) ( (e 1) '.getTime()')
  fn yyyy:int (d:SystemDate) ( (e 1) '.getFullYear()')
  fn mm:int (d:SystemDate) ( '(' (e 1) '.getMonth() + 1)')
  fn dd:int (d:SystemDate) ( (e 1) '.getDate()')

  fn weekday:int (d:SystemDate) ( (e 1) '.getDay()')

  fn month:int (d:int) ('(new Date(' (e 1) ')).getMonth() + 1')

  fn day_step:int () ( '1000*60*60*24' )
  fn week_step:int () ( '1000*60*60*24*7' )

  fn monday:SystemDate (d:SystemDate) {
    def day (weekday d)
    if( day == 0 ) {
      return (add_days d -6 )
    }
    return (add_days d ( -1 * (day - 1)) )
  }

  fn tuesday:SystemDate (d:SystemDate) {
    return ( add_days (monday d) 1)
  }

  ; calculate the year and week from the date
  fn year_week:[int] (d:SystemDate) ('((d)=>{
      var d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
      var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
      return [d.getUTCFullYear(), weekNo];
    })('(e 1)') ')

  fn ms:int (d:SystemDate) ( (e 1) '.getTime()')

  fn clone:SystemDate (d:SystemDate) ( '(new Date(' (e 1) '.getTime())' )
  fn add_days:SystemDate ( d:SystemDate value:int ) ( '(()=>{ var _=(new Date(' (e 1) '.getTime())); _.setDate(' (e 1) '.getDate() + ' (e 2) ');return _;})()')

  fn to_ymd:string ( dd:SystemDate ) {
    return ( (yyyy dd) + "-" + (mm dd) + "-" + (dd dd))
  }
}

operator type:void all {
  fn ymd_to_date@(throws):SystemDate (ymd:string) {
    def parts (strsplit ymd '-')
    if( (size parts) < 3) {
      throw "Invalid date"
    }
    def yy 0 
    def mm 0
    def dd 0 
    try {
      yy  = (unwrap ( to_int (at parts 0)))
      mm  = (unwrap ( to_int (at parts 1)))
      dd  = (unwrap ( to_int (at parts 2)))
    } {
      throw "Invalid date format"
    }
    return (to_date yy mm dd)
  }  
}
