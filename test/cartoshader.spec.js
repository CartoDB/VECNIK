
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
});
