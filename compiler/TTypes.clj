class TTypes {

    static fn nameToValue:RangerNodeType (name:string) {
        switch name {
            case "double" {
                return RangerNodeType.Double
            }
            case "int" {
                return RangerNodeType.Integer
            }
            case "string" {
                return RangerNodeType.String
            }   
            case "boolean" {
                return RangerNodeType.Boolean
            }         
            case "char" {
                return RangerNodeType.Char
            }
            case "charbuffer" {
                return RangerNodeType.CharBuffer
            }
        }
        return RangerNodeType.NoType
    }

;    static fn isNodePrimitive:boolean (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {
;
;    }

    static fn isPrimitive:boolean (valueType:RangerNodeType) {
        switch valueType {
            case RangerNodeType.Double {
                return true
            }
            case RangerNodeType.String {
                return true
            }
            case RangerNodeType.Integer {
                return true
            }
            case RangerNodeType.Boolean {
                return true
            }
            case RangerNodeType.Char {
                return true
            }
            case RangerNodeType.CharBuffer {
                return true
            }
            case RangerNodeType.Enum {
                return true
            }
        }        
        return false
    }

    static fn valueAsString:string (valueType:RangerNodeType) {
        switch valueType {
            case RangerNodeType.Double {
                return "double"
            }
            case RangerNodeType.String {
                return "string"
            }
            case RangerNodeType.Integer {
                return "int"
            }
            case RangerNodeType.Boolean {
                return "boolean"
            }
            case RangerNodeType.Char {
                return "char"
            }
            case RangerNodeType.CharBuffer {
                return "charbuffer"
            }
            case RangerNodeType.NoType {
                return "<no type>"
            }
            case RangerNodeType.InvalidType {
                return "<invalid type>"
            }
            case RangerNodeType.Array {
                return "[]"
            }
            case RangerNodeType.Hash {
                return "[:]"
            }
            case RangerNodeType.ImmutableArray {
                return "ImmutableArray"
            }
            case RangerNodeType.ImmutableHash {
                return "ImmutableHash"
            }
            case RangerNodeType.Object {
                return "Object"
            }
            case RangerNodeType.VRef {
                return "VRef"
            }
            case RangerNodeType.Enum {
                return "Enum"
            }
            case RangerNodeType.Comment {
                return "Comment"
            }
            case RangerNodeType.Expression {
                return "Expression"
            }
            case RangerNodeType.ExpressionType {
                return "ExpressionType"
            }
            case RangerNodeType.Lambda {
                return "Lambda"
            }
            case RangerNodeType.XMLNode {
                return "XMLNode"
            }
            case RangerNodeType.XMLText {
                return "XMLText"
            }
            case RangerNodeType.XMLAttr {
                return "XMLAttr"
            }
            case RangerNodeType.XMLCDATA {
                return "XMLAttr"
            }
            case RangerNodeType.Dictionary {
                return "Dictionary"
            }
            case RangerNodeType.Any {
                return "Any"
            }
            case RangerNodeType.Class {
                return "Class"
            }
            case RangerNodeType.GenericClass {
                return "GenericClass"
            }
            case RangerNodeType.ClassRef {
                return "ClassRef"
            }
            case RangerNodeType.Method {
                return "Method"
            }
            case RangerNodeType.ClassVar {
                return "ClassVar"
            }
            case RangerNodeType.Function {
                return "ClassVar"
            }
            case RangerNodeType.Literal {
                return "Literal"
            }
            case RangerNodeType.Quasiliteral {
                return "Quasiliteral"
            }
            case RangerNodeType.Null {
                return "Null"
            }
            case RangerNodeType.ArrayLiteral {
                return "ArrayLiteral"
            }
            default {
                return "InvalidValueTypeEnum"
            }

        }        
        return ""
    }

    static fn baseTypeAsEval (node:CodeNode ctx:RangerAppWriterContext wr:CodeWriter) {  
        def vType node.value_type      
        node.eval_type = vType
        if( TTypes.isPrimitive( node.value_type) ) {
            node.eval_type_name = (TTypes.valueAsString(node.value_type))
        } {
            def vType node.type_name      
            node.eval_type_name = vType
        }
        def vType1 node.array_type      
        def vType2 node.key_type      
        node.eval_array_type = vType1
        node.eval_key_type = vType2
    }

}