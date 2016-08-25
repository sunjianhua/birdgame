var GRABABLE_MASK_BIT = 1 << 31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

Terrain = cc.GLNode || cc.Node.extend({
    _kMaxHillKeyPoints: 1000,
    _kHillSegmentWidth: 10,
    // _kMaxHillVertices: 4000,
    // _kMaxBorderVertices: 800,
    // M_PI: 3.14159265358979323846,

    _offsetX: 0,
    _fromKeyPointI: 0,
    _toKeyPointI: 0,
    _prevFromKeyPointI: -1,
    _prevToKeyPointI: -1,

    _nHillVertices: 0,
    _hillKeyPoints: new Array(),
    _hillVertices: new Float32Array(4000),
    _hillTexCoords: new Float32Array(4000),
    _hillVerticesGL: gl.createBuffer(),
    _hillTexCoordsGL: gl.createBuffer(),
    _nBorderVertices: 0,
    _borderVertices: new Array(),

    _texture2d: null,
    _space: null,
    _terrainBody: null,

    ctor: function (spaceObj) {
        this._super();
        this.init(spaceObj);
    },

    init: function (spaceObj) {
        this._space = spaceObj;

        this._renderCmd._needDraw = true;
        this._renderCmd._matrix = new cc.math.Matrix4();
        this._renderCmd._matrix.identity();
        this._renderCmd.rendering = function (ctx) {
            var wt = this._worldTransform;
            this._matrix.mat[0] = wt.a;
            this._matrix.mat[4] = wt.c;
            this._matrix.mat[12] = wt.tx;
            this._matrix.mat[1] = wt.b;
            this._matrix.mat[5] = wt.d;
            this._matrix.mat[13] = wt.ty;

            cc.kmGLMatrixMode(cc.KM_GL_MODELVIEW);
            cc.kmGLPushMatrix();
            cc.kmGLLoadMatrix(this._matrix);

            this._node.draw(ctx);

            cc.kmGLPopMatrix();
        };

        this.shader = cc.shaderCache.getProgram("ShaderPositionTexture");
        this._texture2d = cc.textureCache.addImage("res/terrainT.png");
        this._texture2d.setTexParameters(gl.LINEAR, gl.LINEAR, gl.REPEAT, gl.REPEAT);

        this.generateHills();
        this.resetHillVertices();

        // 如果把这个去掉，滑行的动物就不会显示，这个是3.12版本的BUG
        var winSize = cc.director.getWinSize();
        var label = new cc.LabelTTF("点击屏幕开始", "Arial", 16);
        this.addChild(label, 100);
        label.x = 0;
        label.y = winSize.height - 50;;
    },

    draw: function (ctx) {
        this._super();

        this.shader.use();
        this.shader.setUniformsForBuiltins();

        gl.bindTexture(gl.TEXTURE_2D, this._texture2d.getName());
        gl.enableVertexAttribArray(cc.VERTEX_ATTRIB_POSITION);
        gl.enableVertexAttribArray(cc.VERTEX_ATTRIB_TEX_COORDS);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._hillVerticesGL);
        gl.vertexAttribPointer(cc.VERTEX_ATTRIB_POSITION, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this._hillTexCoordsGL);
        gl.vertexAttribPointer(cc.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._nHillVertices / 2);

        // gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    },

    generateHills: function () {
        var winSize = cc.director.getWinSize();

        var minDX = 160;
        var minDY = 60;
        var rangeDX = 80;
        var rangeDY = 40;
        var x = -minDX;
        var y = winSize.height / 2;

        var dy, ny;
        var sign = 1; // +1 - going up, -1 - going  down
        var paddingTop = 20;
        var paddingBottom = 20;

        for (var i = 0; i < this._kMaxHillKeyPoints; ++i) {
            this._hillKeyPoints[i] = cc.p(x, y);
            if (i == 0) {
                x = 0;
                y = winSize.height / 2;
            }
            else {
                x += Math.random() * rangeDX + minDX;
                while (true) {
                    dy = Math.random() * rangeDY + minDY;
                    ny = y + dy * sign;
                    if (ny < winSize.height - paddingTop && ny > paddingBottom) {
                        break;
                    }
                }
                y = ny;
            }
            sign *= -1;
        }
    },

    resetHillVertices: function () {
        var winSize = cc.director.getWinSize();

        // key points interval for drawing
        while (this._hillKeyPoints[this._fromKeyPointI + 1].x < this._offsetX - winSize.width / 8 / this.getScale()) {
            this._fromKeyPointI++;
        }
        while (this._hillKeyPoints[this._toKeyPointI].x < this._offsetX + winSize.width * 9 / 8 / this.getScale()) {
            this._toKeyPointI++;
        }

        //
        if (this._prevFromKeyPointI != this._fromKeyPointI || this._prevToKeyPointI != this._toKeyPointI) {
            // vertices for visible area
            this._nHillVertices = 0;
            this._nBorderVertices = 0;
            var p0 = cc.p();
            var p1 = cc.p();
            var pt0 = cc.p();
            var pt1 = cc.p();
            p0.x = this._hillKeyPoints[this._fromKeyPointI].x;
            p0.y = this._hillKeyPoints[this._fromKeyPointI].y;
            for (var i = this._fromKeyPointI + 1; i < this._toKeyPointI + 1; ++i) {
                p1.x = this._hillKeyPoints[i].x;
                p1.y = this._hillKeyPoints[i].y;

                // triangle strip between p0 and p1
                var hSegments = Math.floor((p1.x - p0.x) / this._kHillSegmentWidth);
                var dx = (p1.x - p0.x) / hSegments;
                var da = Math.PI / hSegments;
                var ymid = (p0.y + p1.y) / 2;
                var ampl = (p0.y - p1.y) / 2;
                pt0.x = p0.x;
                pt0.y = p0.y;
                this._borderVertices[this._nBorderVertices++] = cc.p(pt0.x, pt0.y);
                for (var j = 1; j < hSegments + 1; ++j) {
                    pt1.x = p0.x + j * dx;
                    pt1.y = ymid + ampl * Math.cos(da * j);
                    this._borderVertices[this._nBorderVertices++] = cc.p(pt1.x, pt1.y);

                    this._hillVertices[this._nHillVertices] = pt0.x;
                    this._hillVertices[this._nHillVertices + 1] = 0;
                    this._hillTexCoords[this._nHillVertices] = pt0.x / 512;
                    this._hillTexCoords[this._nHillVertices + 1] = 1.0;
                    this._nHillVertices += 2;

                    this._hillVertices[this._nHillVertices] = pt1.x;
                    this._hillVertices[this._nHillVertices + 1] = 0;
                    this._hillTexCoords[this._nHillVertices] = pt1.x / 512;
                    this._hillTexCoords[this._nHillVertices + 1] = 1.0;
                    this._nHillVertices += 2;

                    this._hillVertices[this._nHillVertices] = pt0.x;
                    this._hillVertices[this._nHillVertices + 1] = pt0.y;
                    this._hillTexCoords[this._nHillVertices] = pt0.x / 512;
                    this._hillTexCoords[this._nHillVertices + 1] = 0;
                    this._nHillVertices += 2;

                    this._hillVertices[this._nHillVertices] = pt1.x;
                    this._hillVertices[this._nHillVertices + 1] = pt1.y;
                    this._hillTexCoords[this._nHillVertices] = pt1.x / 512;
                    this._hillTexCoords[this._nHillVertices + 1] = 0;
                    this._nHillVertices += 2;

                    pt0.x = pt1.x;
                    pt0.y = pt1.y;
                }

                p0.x = p1.x;
                p0.y = p1.y;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER, this._hillVerticesGL);
            gl.bufferData(gl.ARRAY_BUFFER, this._hillVertices, gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._hillTexCoordsGL);
            gl.bufferData(gl.ARRAY_BUFFER, this._hillTexCoords, gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, null);

            this._prevFromKeyPointI = this._fromKeyPointI;
            this._prevToKeyPointI = this._toKeyPointI;

            this.resetPhysicsTerrain();
        }
    },

    resetPhysicsTerrain: function () {
        var space = this._space;
        var shapeList = [];
        if (this._terrainBody) {
            this._terrainBody.eachShape(function (shapeObj) { shapeList.push(shapeObj); })
            for (var i = 0, len = shapeList.length; i < len; i++) {
                space.removeStaticShape(shapeList[i]);
            }
        } else {
            this._terrainBody = new cp.Body(Infinity, Infinity);
            this._terrainBody.nodeIdleTime = Infinity;
        }

        var p1 = cp.v(0, 0);
        var p2 = cp.v(0, 0);
        for (var i = 0; i < this._nBorderVertices - 1; i++) {
            p1.x = this._borderVertices[i].x;
            p1.y = this._borderVertices[i].y;
            p2.x = this._borderVertices[i + 1].x;
            p2.y = this._borderVertices[i + 1].y;
            var floor = space.addStaticShape(new cp.SegmentShape(this._terrainBody, p1, p2, 0));
            floor.setElasticity(1);
            floor.setFriction(1);
            floor.setLayers(NOT_GRABABLE_MASK);
        }
    },

    setOffsetX: function (newOffsetX) {
        var winSize = cc.director.getWinSize();

        this._offsetX = newOffsetX;
        this.setPosition(cc.p(winSize.width / 8 - this._offsetX * this.getScale(), 0));

        this.resetHillVertices();
    },
})

Terrain.createWithSpace = function (spaceObj) {
    return new Terrain(spaceObj);
};
