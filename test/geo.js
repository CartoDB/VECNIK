$(document).ready(function() {

  var geojson = '{"type":"FeatureCollection","features":[{"type":"Feature","properties":{"area":"0","gmi_cntry":"LUX","iso_2_code":"LU","iso_3_code":"LUX","name":"Luxembourg","name_1":"Luxembourg","name_12":"Luxembourg","pop2005":"456613","region":"Europe","created_at":"2012-08-29","updated_at":"2012-08-29","cartodb_id":35},"geometry":{"type":"MultiPolygon","coordinates":[[[[5.783038,49.527271],[5.839999,49.552212],[5.899166,49.662762],[5.820555,49.749149],[5.746666,49.795269],[5.753333,49.849152],[5.731111,49.89415],[5.808332,49.961102],[5.819721,50.009708],[5.98,50.172211],[6.106943,50.167759],[6.131833,50.12553],[6.139722,49.996651],[6.326666,49.83971],[6.522222,49.8111],[6.510555,49.706379],[6.372499,49.59026],[6.362221,49.45998],[6.165277,49.504711],[5.981388,49.448318],[5.963333,49.488319],[5.783038,49.527271]]]]}},{"type":"Feature","properties":{"area":"0","gmi_cntry":"AND","iso_2_code":"AD","iso_3_code":"AND","name":"Andorra","name_1":"Andorra","name_12":"Andorra","pop2005":"73483","region":"Europe","created_at":"2012-08-29","updated_at":"2012-08-29","cartodb_id":1},"geometry":{"type":"MultiPolygon","coordinates":[[[[1.710967,42.473499],[1.533333,42.4361],[1.448333,42.450821],[1.446388,42.572208],[1.435247,42.597149],[1.541111,42.65387],[1.781667,42.581661],[1.710967,42.473499]]]]}}]}'

  module("vecnik.geo");


  test("parseGeoJSON", function() {
    var g = vecnik.geo().parseGeoJSON(JSON.parse(geojson).features[0].geometry);
    equal(g.children().length, 1)
    ok(g.children()[0].x().length > 0)
  });

  test("parseGeoJSON with features", function() {
    var g = vecnik.geo().parseGeoJSON(JSON.parse(geojson));
    equal(g.children().length, 2)
  });


});
