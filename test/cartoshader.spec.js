
describe('CartoShader', function() {

    it("should compile to canvas properties", function() {
        var c = new VECNIK.CartoShader({
            'point-color': '#FFF',
            'line-color': function(data) {
                return data.color;
            },
            'line-width': '1',
            'polygon-fill': '#00F'
        });
        expect(typeof c.compiled['fillStyle']).toEqual('string');
        expect(typeof c.compiled['strokeStyle']).toEqual('function');
    });

    it("should tell when line should be rendered", function() {
        var c = new VECNIK.CartoShader({
            'line-color': '#fff'
        });
        expect(c.needs_render({}, {}, 'LineString')).toBeTruthy();

        var c = new VECNIK.CartoShader({
            'polygon-fill': '#fff'
        });
        expect(c.needs_render({}, {}, 'LineString')).toBeFalsy();

        var c = new VECNIK.CartoShader({
            'line-color': function(data) {
              if(data.lovely > 1) {
                return '#fff';
              }
            }
        });
        expect(c.needs_render({lovely: 0}, {}, 'LineString')).toBeFalsy();
    });

    it("should reset line attributes", function() {
        var c = new VECNIK.CartoShader({
            'line-color': '#fff'
        });
        var ctx = {};
        c.reset(ctx, 'LineString');
        expect(ctx['strokeStyle']).toBeDefined();
        expect(ctx['lineWidth']).toBeDefined();
        expect(ctx['globalAlpha']).toBeDefined();
    })
});
