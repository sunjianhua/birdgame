Terrain = cc.GLNode || cc.Node.extend({
    _body: null,
    _awake: false,

    ctor: function (spaceObj) {
        this._super();
        this.init();
    },

    init: function (spaceObj) {
    },
})

Terrain.createWithSpace = function (spaceObj) {
    return new Terrain(spaceObj);
};
