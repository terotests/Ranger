const vl = await import('vega-lite');
const s = vl.compile({data:{values:[{a:'A',b:5},{a:'A',b:9},{a:'B',b:3},{a:'B',b:12}]},mark:'boxplot',
  encoding:{x:{field:'a',type:'nominal'},y:{field:'b',type:'quantitative'}}}).spec;
console.log(s.scales.map(x=>({name:x.name, zero:x.zero, nice:x.nice, type:x.type})));
