Bird = cc.Sprite.extend({
    NUM_PREV_VELS: 5,

    _prevVels: new Array(),
    _nextVel: 0,

    _body: null,
    _awake: false,

    ctor: function (spaceObj) {
        this._super("#seal1.png");
        this.init(spaceObj);
    },

    init: function (spaceObj) {
        var winSize = cc.director.getWinSize();
        var radius = 20;
        var mass = 3;
        this._body = spaceObj.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0, radius, cp.v(0, 0))));
        this._body.setPos(cp.v(0, winSize.height / 2 + radius));
        var circle = spaceObj.addShape(new cp.CircleShape(this._body, radius, cp.v(0, 0)));
        //弹性
        circle.setElasticity(0);
        //摩擦
        circle.setFriction(0);
        //
        for (var i = 0; i < this.NUM_PREV_VELS; ++i) {
            this._prevVels[i] = cc.p();
        }
    },

    update: function (dt) {
        this.setPosition(this._body.getPos());

        if (this._awake) {
            var vel = this._body.getVel();

            var weightedVel = cc.p(vel.x, vel.y);
            for (var i = 0; i < this.NUM_PREV_VELS; ++i) {
                weightedVel.x += this._prevVels[i].x;
                weightedVel.y += this._prevVels[i].y;
            }
            weightedVel = cc.p(weightedVel.x / this.NUM_PREV_VELS, weightedVel.y / this.NUM_PREV_VELS);
            this._prevVels[this._nextVel++] = cc.p(vel.x, vel.y);
            if (this._nextVel >= this.NUM_PREV_VELS) {
                this._nextVel = 0;
            }

            var angle = cc.pToAngle(weightedVel);
            this.setRotation(-1 * cc.radiansToDegrees(angle));
        }
    },

    wake: function () {
        this._awake = true;
        this._body.applyImpulse(cc.p(1, 2), this.getPosition())
    },

    getAwake: function () {
        return this._awake;
    },

    dive: function () {
        this._body.applyForce(cc.p(5, -50), this._body.getPos());
    },

    limitVelocity: function () {
        if (!this._awake) {
            return;
        }

        var minVelocityX = 100;
        var minVelocityY = -40;
        var vel = this._body.getVel();
        if (vel.x < minVelocityX) {
            vel.x = minVelocityX;
        }
        if (vel.y < minVelocityY) {
            vel.y = minVelocityY;
        }
        this._body.setVel(vel);
    },
})

Bird.createWithSpace = function (spaceObj) {
    cc.spriteFrameCache.addSpriteFrames("res/TinySeal.plist");

    return new Bird(spaceObj);
};
