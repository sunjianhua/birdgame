
var HelloWorldLayer = cc.Layer.extend({
    _terrain: null,
    _space: null,
    _bird: null,

    ctor: function () {
        this._super();

        this.setupSpace();

        this._terrain = Terrain.createWithSpace(this._spac);
        this.addChild(this._terrain, 0);

        this._bird = Bird.createWithSpace(this._space);
        this.addChild(this._bird, 0);

        return true;
    },

    setupSpace: function () {
        this._space = new cp.Space();
        this._space.gravity = cp.v(0, -100);
        this._space.sleepTimeThreshold = 0.5;
        this._space.collisionSlop = 0.5;

        //this._debugNode = new cc.PhysicsDebugNode(this._space);
        //this._debugNode.visible = false;
        //this.addChild(this._debugNode, 12);
    }
});

var HelloWorldScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});
