
systemclass IndexedDBDatabase {
  es6 IDBDatabase
}

; window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB

operator type:void es6 {

  fn open_idb:IDBDatabase (name:sting version:int) ('(window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB).open('(e 1)', '(e 2)')')



  fn schema:SQLSchemaBuilder (name:string version:int) (`lf.schema.create(`(e 1)`,`(e 2)`)`)
  fn create_table:SQLSchemaTable (  s:SQLSchemaBuilder name:string ) ( (e 1) `.createTable(`(e 2)`)`)

  fn add_int (t:SQLSchemaTable fieldName:string ) ( (e 1) `.addColumn(`(e 2)`, lf.Type.INTEGER)`)
  fn add_string (t:SQLSchemaTable fieldName:string ) ( (e 1) `.addColumn(`(e 2)`, lf.Type.STRING)`)
  fn add_datetime (t:SQLSchemaTable fieldName:string ) ( (e 1) `.addColumn(`(e 2)`, lf.Type.DATE_TIME)`)
  fn add_boolean (t:SQLSchemaTable fieldName:string ) ((e 1) `.addColumn(`(e 2)`, lf.Type.BOOLEAN)`)
  fn set_primary_key (t:SQLSchemaTable fieldName:string) ((e 1) `.addPrimaryKey([`(e 2)`])`)
  fn create_index (t:SQLSchemaTable indexName:string fields:[string]) ( (e 1) `.addIndex(`(e 2)`,`(e 3)`,false,lf.Order.DESC)`)

  fn connect@(async):SQLDatabase (b:SQLSchemaBuilder) ('await ' (e 1) '.connect()')
  fn getSchema:DBSchema (db:SQLDatabase) ( (e 1) '.getSchema()')
  fn getTable:DBTable (db:DBSchema name:string) ( (e 1) '.table(' (e 2) ')')

  fn addRow:DBInsertableRow (tbl:DBTable row:JSONDataObject) (  (e 1) '.createRow(' (e 2) ')') 
  fn insert@(async):void (db:SQLDatabase t:DBTable rows:[DBInsertableRow]) ('await (' (e 1) '.insertOrReplace().into(' (e 2) ').values(' (e 3) ').exec())')
  ; fn query@(async):[JSONDataObject] (db:SQLDatabase t:DBTable id:int ) ('await (' (e 1) '.select().from(' (e 2) ').where(' (e 2) '.id.eq(' (e 3)')).exec())')
  fn select@(async):[JSONDataObject] (db:SQLDatabase t:DBTable id:int ) ('await (' (e 1) '.select().from(' (e 2) ').where(' (e 2) '.id.eq(' (e 3)')).exec())')
}