
function Stats() {
    _container = document.createElement( 'div' );
    //_container.style.width = '80px';
    _container.style.opacity = '0.9';
    _container.style.zIndex = '10001';
    _container.style.position = 'absolute';
    _container.style.left = '0px';
    _container.style.bottom = '0px';
    _container.style.background = '#FFF';
    this.el = _container;
    this.el.innerHTML = 'test';
}

Stats.prototype.update = function(vars) {
    var html = "<table>"
    html += "<tr>"
    html += "<td></td><td>total</td><td>avg</td><td>max</td><td>min</td>"
    html += "</tr>"
    for(var k in vars) {
        html += "<tr>"
        html += "<td>" + k + "</td>"
        html += "<td>" + vars[k].total.toFixed(1) + "</td>" 
        html += "<td>" + vars[k].avg.toFixed(1) + "</td>" 
        html += "<td>" + vars[k].max.toFixed(1) + "</td>" 
        html += "<td>" + vars[k].min.toFixed(1) + "</td>" 
        html += "</tr>"
    }
    html += "</table>"
    this.el.innerHTML = html;
}
