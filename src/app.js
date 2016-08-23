
var HelloWorldLayer = cc.Layer.extend({
    _terrain: null,
    _space: null,
    _bird: null,
    _tapDown: false,

    ctor: function () {
        this._super();

        this.setupSpace();

        this._terrain = Terrain.createWithSpace(this._space);
        this.addChild(this._terrain, 0);

        this._bird = Bird.createWithSpace(this._space);
        this._terrain.addChild(this._bird, 0);

        this.scheduleUpdate();

        if( 'touches' in cc.sys.capabilities )
        {
            cc.eventManager.addListener({
                event: cc.EventListener.TOUCH_ALL_AT_ONCE,
                onTouchesEnded: function(touches, event)
                {}}, this);
        }
        else if( 'mouse' in cc.sys.capabilities )
        {
            var helloLayer = this;

            cc.eventManager.addListener({
                event: cc.EventListener.MOUSE,
                onMouseDown: function (event)
                {
                    helloLayer._tapDown = true;
                },
                onMouseUp: function (event)
                {
                    helloLayer._tapDown = false;
                }
            }, this);
        }
    },

    setupSpace: function () {
        this._space = new cp.Space();
        this._space.gravity = cp.v(0, -100);
        this._space.sleepTimeThreshold = 0.5;
        this._space.collisionSlop = 0.5;

        //this._debugNode = new cc.PhysicsDebugNode(this._space);
        //this._debugNode.visible = false;
        //this.addChild(this._debugNode, 12);
    },

    update: function (dt) {
        if (this._tapDown)
        {
            if (!this._bird.getAwake())
            {
                this._bird.wake();
                this._tapDown = false;
            }
            else
            {
                this._bird.dive();
            }
        }
        else
        {
            // this._bird.nodive();
        }
        this._bird.limitVelocity();

        this._space.step(dt);
        this._bird.update(dt);

        var winSize = cc.director.getWinSize();
        var scale = (winSize.height * 3 / 4) / this._bird.getPosition().y;
        if (scale > 1)
        {
           scale = 1;
        }
        this._terrain.setScale(scale);

        var offset = this._bird.getPosition().x;
        this._terrain.setOffsetX(offset)
    },
});

var HelloWorldScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var layer = new HelloWorldLayer();
        this.addChild(layer);
    }
});
