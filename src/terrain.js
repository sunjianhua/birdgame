Terrain = cc.GLNode || cc.Node.extend({
    _body: null,
    _awake: false,

    ctor: function (spaceObj) {
        this._super();
        this.init();
    },

    init: function (spaceObj) {
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
        this._texture2d = cc.textureCache.addImage("res/HelloWorld.png");
        this._texture2d.setTexParameters(gl.LINEAR, gl.LINEAR, gl.REPEAT, gl.REPEAT);
    },

    draw: function (ctx) {
        this.shader.use();
        this.shader.setUniformsForBuiltins();

        gl.bindTexture(gl.TEXTURE_2D, this._texture2d);
        gl.enableVertexAttribArray(cc.VERTEX_ATTRIB_POSITION);
        gl.enableVertexAttribArray(cc.VERTEX_ATTRIB_TEX_COORDS);

        // 

        // // 绘制山丘
        // cc.glBindTexture2D(this._texture2d);

        // gl.bindBuffer(gl.ARRAY_BUFFER, this._hillVerticesGL);
        // gl.vertexAttribPointer(cc.VERTEX_ATTRIB_POSITION, 2, gl.FLOAT, false, 0, 0);

        // gl.bindBuffer(gl.ARRAY_BUFFER, this._hillTexCoordsGL);
        // gl.vertexAttribPointer(cc.VERTEX_ATTRIB_TEX_COORDS, 2, gl.FLOAT, false, 0, 0);

        // gl.drawArrays(gl.TRIANGLE_STRIP, 0, this._nHillVertices / 2);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
})

Terrain.createWithSpace = function (spaceObj) {
    return new Terrain(spaceObj);
};
