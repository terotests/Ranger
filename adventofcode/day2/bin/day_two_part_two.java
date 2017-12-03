import java.util.*;
import java.io.*;

public class day_two_part_two { 
  
  static Integer _getIntegerOrNull ( String str ) {
      try {
         return (Integer.parseInt(str));
      } catch ( NumberFormatException e ) {
          return null;
      }
  }
  
  
  public static void main(String [] args ) {
    final String data = "\r\n3751\t3769\t2769\t2039\t2794\t240\t3579\t1228\t4291\t220\t324\t3960\t211\t1346\t237\t1586\r\n550\t589\t538\t110\t167\t567\t99\t203\t524\t288\t500\t111\t118\t185\t505\t74\r\n2127\t1904\t199\t221\t1201\t250\t1119\t377\t1633\t1801\t2011\t1794\t394\t238\t206\t680\r\n435\t1703\t1385\t1461\t213\t1211\t192\t1553\t1580\t197\t571\t195\t326\t1491\t869\t1282\r\n109\t104\t3033\t120\t652\t2752\t1822\t2518\t1289\t1053\t1397\t951\t3015\t3016\t125\t1782\r\n2025\t1920\t1891\t99\t1057\t1909\t2237\t106\t97\t920\t603\t1841\t2150\t1980\t1970\t88\r\n1870\t170\t167\t176\t306\t1909\t1825\t1709\t168\t1400\t359\t817\t1678\t1718\t1594\t1552\r\n98\t81\t216\t677\t572\t295\t38\t574\t403\t74\t91\t534\t662\t588\t511\t51\r\n453\t1153\t666\t695\t63\t69\t68\t58\t524\t1088\t75\t1117\t1192\t1232\t1046\t443\r\n3893\t441\t1825\t3730\t3660\t115\t4503\t4105\t3495\t4092\t48\t3852\t132\t156\t150\t4229\r\n867\t44\t571\t40\t884\t922\t418\t328\t901\t845\t42\t860\t932\t53\t432\t569\r\n905\t717\t162\t4536\t4219\t179\t990\t374\t4409\t4821\t393\t4181\t4054\t4958\t186\t193\r\n2610\t2936\t218\t2552\t3281\t761\t204\t3433\t3699\t2727\t3065\t3624\t193\t926\t1866\t236\r\n2602\t216\t495\t3733\t183\t4688\t2893\t4042\t3066\t3810\t189\t4392\t3900\t4321\t2814\t159\r\n166\t136\t80\t185\t135\t78\t177\t123\t82\t150\t121\t145\t115\t63\t68\t24\r\n214\t221\t265\t766\t959\t1038\t226\t1188\t1122\t117\t458\t1105\t1285\t1017\t274\t281    \r\n";
    final ArrayList<String> list = new ArrayList<String>(Arrays.asList(data.split("")));
    /** unused:  final Integer idx = 0   **/ ;
    final Integer[] value =  new Integer[]{0};
    final Integer[] n_idx =  new Integer[]{1};
    final Integer[] min =  new Integer[]{0};
    final Integer[] max =  new Integer[]{0};
    final Integer[] total =  new Integer[]{0};
    final ArrayList<Integer> row = new ArrayList<Integer>();
    operatorsOf.forEach_2(list, new LambdaSignature1() { 
      public void run( final String item,  final Integer index) {
        final Integer iValue = _getIntegerOrNull(item );
        if ( iValue != null  ) {
          value[0] = (iValue) + (value[0] * 10);
          n_idx[0] = n_idx[0] + 1;
        } else {
          if ( n_idx[0] > 1 ) {
            row.add(value[0]);
          }
          value[0] = 0;
          n_idx[0] = 1;
          if ( (((int)item.charAt(0)) == (10)) || (((int)item.charAt(0)) == (13)) ) {
            final Integer[] theValue =  new Integer[]{0};
            operatorsOf.forEach_3(row, new LambdaSignature2() { 
              public void run( final Integer item,  final Integer index) {
                final Integer item1 = item;
                final Integer outer_index = index;
                operatorsOf.forEach_3(row, new LambdaSignature2() { 
                  public void run( final Integer item,  final Integer index) {
                    if ( index != outer_index ) {
                      final Double divRes = (Double.valueOf(item)) / (Double.valueOf(item1));
                      if ( (item % item1) == 0 ) {
                        theValue[0] = Double.valueOf(divRes).intValue();
                      }
                      final Double divRes_1 = (Double.valueOf(item1)) / (Double.valueOf(item));
                      if ( (item1 % item) == 0 ) {
                        theValue[0] = Double.valueOf(divRes_1).intValue();
                      }
                    }
                    // captured var outer_index
                    // captured var item1
                    // captured var theValue
                  }
                });
                // captured var row
                // captured var theValue
              }
            });
            total[0] = total[0] + theValue[0];
            max[0] = 0;
            min[0] = 0;
            row.clear();
          }
        }
        // captured var value
        // captured var n_idx
        // captured var row
        // captured var total
        // captured var max
        // captured var min
      }
    });
    System.out.println(String.valueOf( "Total == " + total[0] ) );
  }
}
