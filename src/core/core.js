//========================================
// Core
//
// base classes
//========================================

// create root scope if not exists

var VECNIK = VECNIK || {};

// TODO: XHR

(function(VECNIK) {

    // http get
    // should be improved
    function load(url, callback) {
      var mygetrequest = new XMLHttpRequest();
      mygetrequest.onreadystatechange=function() {
        if (mygetrequest.readyState == 4){
          if (mygetrequest.status == 200){
            callback(JSON.parse(mygetrequest.responseText));
          } else {
            //error
          }
        }
      };
      mygetrequest.open("GET", url, true);
      mygetrequest.send(null);
    }

    VECNIK.load = load;

})(VECNIK);
