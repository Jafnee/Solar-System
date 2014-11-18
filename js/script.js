var source = {
/* MY SHADERS */
    shaderVertex: "\n\
attribute vec3 aVertexPosition;\n\
attribute vec3 aVertexNormal;\n\
attribute vec2 aTextureCoord;\n\
uniform mat4 uMVMatrix;\n\
uniform mat4 uPMatrix;\n\
uniform mat3 uNMatrix;\n\
uniform vec3 uAmbientColor;\n\
uniform vec3 uLightingDirection;\n\
uniform vec3 uDirectionalColor;\n\
uniform bool uUseLighting;\n\
varying vec2 vTextureCoord;\n\
varying vec3 vLightWeighting;\n\
void main(void) { //pre-built function\n\
gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n\
vTextureCoord = aTextureCoord;\n\
if (!uUseLighting) {\n\
vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
} else {\n\
vec3 transformedNormal = uNMatrix * aVertexNormal;\n\
float directionalLightWeighting = max(dot(transformedNormal, uLightingDirection), 0.0);\n\
vLightWeighting = uAmbientColor + uDirectionalColor * directionalLightWeighting;\n\
}\n\
}",

    shaderFragment: "\n\
precision mediump float;\n\
\n\
    varying vec2 vTextureCoord;\n\
    varying vec3 vLightWeighting;\n\
\n\
    uniform sampler2D uSampler;\n\
\n\
    void main(void) {\n\
        vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
        gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n\
    }",

/* MYCOORD ARRAYS */
    triangle: {
        vertices: [
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0,
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0
        ],
        
        size: 3,
        
        items: 3
    },
    
    sun:{
        vertices: [],
        
        ItemSize: null,
        
        noItems: null,
        
        image: 'images/textures/sunmap.jpg'
    },

    earth:{
        vertices: [],        
        image: 'images/textures/earthmap1k.jpg'
    },
    
    moon:{
        vertices: [],        
        latitudeBands: 30,     
        longitudeBands: 30,
        radius: 2,
        
        image: 'images/textures/sunmap.jpg'
    },
    
    lighting: {
        ambient: {
            r: 0,
            g: 0,
            b: 0
        },
        directional: {
            r: 0,
            g: 0,
            b: 0,
            x: 0.5,
            y: 1,
            z: -1
        }
    }
};

var worldObjects = {};

var buffer = {};

var texture = {};

var matrix = {};


var util = {
    
    degToRad: function(degrees) {
        return degrees * Math.PI / 180;
    },
    
    setMatrixUniforms: function() {
        main.GL.uniformMatrix4fv(main.SHADER_PROGRAM.mvMatrixUniform, false, matrix.mv);
        main.GL.uniformMatrix4fv(main.SHADER_PROGRAM.pMatrixUniform, false, main.pMatrix);
        
        var normalMatrix = mat3.create();
        mat4.toInverseMat3(matrix.mv, normalMatrix);
        mat3.transpose(normalMatrix);
        main.GL.uniformMatrix3fv(main.SHADER_PROGRAM.nMatrixUniform, false, normalMatrix);
    },
    
    handleLoadedTexture: function(texture) {
        main.GL.pixelStorei(main.GL.UNPACK_FLIP_Y_WEBGL, true);
        main.GL.bindTexture(main.GL.TEXTURE_2D, texture);
        main.GL.texImage2D(main.GL.TEXTURE_2D, 0, main.GL.RGBA, main.GL.RGBA, main.GL.UNSIGNED_BYTE, texture.image);
        main.GL.texParameteri(main.GL.TEXTURE_2D, main.GL.TEXTURE_MAG_FILTER, main.GL.LINEAR);
        main.GL.texParameteri(main.GL.TEXTURE_2D, main.GL.TEXTURE_MIN_FILTER, main.GL.LINEAR_MIPMAP_NEAREST);
        main.GL.generateMipmap(main.GL.TEXTURE_2D);

        main.GL.bindTexture(main.GL.TEXTURE_2D, null);
    },
    
    mvPushMatrix: function() {
        var copy = mat4.create();
        mat4.set(matrix.mv, copy);
        main.mvMatrixStack.push(copy);
    },
    
    mvPopMatrix: function() {
        if (main.mvMatrixStack.length === 0) {
            throw "Invalid popMatrix!";
        }
        matrix.mv = mvMatrixStack.pop();
    },
    
    /* Mouse Events */
    handleMouseDown: function(event) {
        main.mouseDown = true;
        main.lastMouseX = event.clientX;
        main.lastMouseY = event.clientY;
    },
    
    handleMouseUp: function(event) {
        main.mouseDown = false;
    },
    
    handleMouseMove: function(event) {
        if (main.mouseDown) {
            var newX = event.clientX;
            var newY = event.clientY;
            
            var deltaX = newX - main.lastMouseX;
            var newRotationMatrix = mat4.create();
            mat4.identity(newRotationMatrix);
            mat4.rotate(newRotationMatrix, util.degToRad(deltaX / 10), [0, 1, 0]);
            
            var deltaY = newY - main.lastMouseY;
            mat4.rotate(newRotationMatrix, util.degToRad(deltaY / 10), [1, 0, 0]);
            
            mat4.multiply(newRotationMatrix, matrix.moonRotation, matrix.moonRotation);
            
            main.lastMouseX = newX;
            main.lastMouseY = newY;
        }
    }
        
};


var main = {
    initGL: function(canvas) {
        var GL = null;
        GL = canvas.getContext("webgl", {antialias: true}) || canvas.getContext("experimental-webgl", {antialias: true}); //webgl > experimental
        GL.viewportWidth = canvas.width; // remove this
        GL.viewportHeight = canvas.height; // and this when css is in place.
        
        if(!GL) {
            alert("ERROR: WebGL failed to initialise");
        }
        return GL;
    },

    
    initShaders: function() {
        var compileShader = function compile(source, type) {
            var shader = main.GL.createShader(type);
            main.GL.shaderSource(shader, source);
            main.GL.compileShader(shader);
            if (!main.GL.getShaderParameter(shader, main.GL.COMPILE_STATUS)) {
                alert('ERROR Shader: ' + type);
                System.exit(1);
            } else {
                return shader;
            }
        };
        var shaderVertex = compileShader(source.shaderVertex, this.GL.VERTEX_SHADER);
        var shaderFragment = compileShader(source.shaderFragment, this.GL.FRAGMENT_SHADER);
        
        main.SHADER_PROGRAM = this.GL.createProgram();
        this.GL.attachShader(main.SHADER_PROGRAM, shaderVertex);
        this.GL.attachShader(main.SHADER_PROGRAM, shaderFragment);
        
        this.GL.linkProgram(main.SHADER_PROGRAM);
        
        if (!this.GL.getProgramParameter(main.SHADER_PROGRAM, this.GL.LINK_STATUS)) {
            alert("ERROR: Shaders failed to link");
        }
        
        this.GL.useProgram(main.SHADER_PROGRAM);
        
        main.SHADER_PROGRAM.vertexPositionAttribute = this.GL.getAttribLocation(main.SHADER_PROGRAM, "aVertexPosition");     
        this.GL.enableVertexAttribArray(main.SHADER_PROGRAM.vertexPositionAttribute);
        
        main.SHADER_PROGRAM.textureCoordAttribute = this.GL.getAttribLocation(main.SHADER_PROGRAM, "aTextureCoord");
        this.GL.enableVertexAttribArray(main.SHADER_PROGRAM.textureCoordAttribute);
        
        main.SHADER_PROGRAM.vertexNormalAttribute = this.GL.getAttribLocation(main.SHADER_PROGRAM, "aVertexNormal");
        this.GL.enableVertexAttribArray(main.SHADER_PROGRAM.vertexNormalAttribute);
        
        main.SHADER_PROGRAM.pMatrixUniform = this.GL.getUniformLocation(main.SHADER_PROGRAM, "uPMatrix");
        main.SHADER_PROGRAM.mvMatrixUniform = this.GL.getUniformLocation(main.SHADER_PROGRAM, "uMVMatrix");
        main.SHADER_PROGRAM.nMatrixUniform = this.GL.getUniformLocation(main.SHADER_PROGRAM, "uNMatrix");
        main.SHADER_PROGRAM.samplerUniform = this.GL.getUniformLocation(main.SHADER_PROGRAM, "uSampler");
        main.SHADER_PROGRAM.userLightingUniform = this.GL.getUniformLocation(main.SHADER_PROGRAM, "uUseLighting");
        main.SHADER_PROGRAM.ambientColorUniform = this.GL.getUniformLocation(main.SHADER_PROGRAM, "uAmbientColor");
        main.SHADER_PROGRAM.lightingDirectionUniform = this.GL.getUniformLocation(main.SHADER_PROGRAM, "uLightingDirection");
        main.SHADER_PROGRAM.directionalColorUniform = this.GL.getUniformLocation(main.SHADER_PROGRAM, "uDirectionalColor");
    },
    
    
    initBuffers: function() {
        buffer.triangleVertices = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.triangleVertices);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(source.triangle.vertices), this.GL.STATIC_DRAW);
        
        /* Moon*/
        //buffer.moonVertexPosition;
        //buffer.moonVertexNormal;
        //buffer.moonVertexTextureCoord;
        //buffer.moonVertexIndex;
        
        var latitudeBands = source.moon.latitudeBands;
        var longitudeBands = source.moon.longitudeBands;
        var radius = source.moon.radius;
        
        var vertexPositionData = [];
        var normalData = [];
        var textureCoordData = [];
        
        var latNumber, longNumber;
        for (latNumber = 0; latNumber <= latitudeBands; latNumber++) {
            var theta = latNumber * Math.PI / latitudeBands;
            var sinTheta = Math.sin(theta);
            var cosTheta = Math.cos(theta);
            
            for (longNumber = 0; longNumber <= longitudeBands; longNumber++) {
                var phi = longNumber * 2 * Math.PI / longitudeBands;
                var sinPhi = Math.sin(phi);
                var cosPhi = Math.cos(phi);
                
                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1 - (longNumber / longitudeBands);
                var v = 1 - (latNumber / latitudeBands);
                
                normalData.push(x);
                normalData.push(y);
                normalData.push(z);
                textureCoordData.push(u);
                textureCoordData.push(v);
                vertexPositionData.push(radius * x);
                vertexPositionData.push(radius * y);
                vertexPositionData.push(radius * z);
            }
        }
        
        var indexData = [];
        for (latNumber = 0; latNumber < latitudeBands; latNumber++) {
            for (longNumber = 0; longNumber < longitudeBands; longNumber++) {
                var first = (latNumber * (longitudeBands + 1)) + longNumber;
                var second = first + longitudeBands + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first + 1);

                indexData.push(second);
                indexData.push(second + 1);
                indexData.push(first + 1);
            }
        }
        buffer.moonVertexNormal = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.moonVertexNormal);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(normalData), this.GL.STATIC_DRAW);
        buffer.moonVertexNormal.itemSize = 3;
        buffer.moonVertexNormal.numItems = normalData.length / 3;
        
        buffer.moonVertexTextureCoord = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.moonVertexTextureCoord);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(textureCoordData), this.GL.STATIC_DRAW);
        buffer.moonVertexTextureCoord.itemSize = 2;
        buffer.moonVertexTextureCoord.numItems = textureCoordData.length / 2;
        
        buffer.moonVertexPosition = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.moonVertexPosition);
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(vertexPositionData), this.GL.STATIC_DRAW);
        buffer.moonVertexPosition.itemSize = 3;
        buffer.moonVertexPosition.numItems = vertexPositionData.length / 3;
        
        buffer.moonVertexIndex = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, buffer.moonVertexIndex);
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), this.GL.STATIC_DRAW);
        buffer.moonVertexIndex.itemSize = 1;
        buffer.moonVertexIndex.numItems = indexData.length;
    },
    
    
    initTextures: function() {
        texture.moon = this.GL.createTexture();
        texture.moon.image = new Image();
        texture.moon.image.onload = function() {
            util.handleLoadedTexture(texture.moon);
        };
        texture.moon.image.src = source.moon.image;
    },
    
    
    draw: function draw() {
        this.GL.activeTexture(this.GL.TEXTURE0);
        this.GL.bindTexture(this.GL.TEXTURE_2D, texture.moon);
        this.GL.uniform1i(this.SHADER_PROGRAM.samplerUniform, 0);
        
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.moonVertexPosition);
        this.GL.vertexAttribPointer(this.SHADER_PROGRAM.vertexPositionAttribute, buffer.moonVertexPosition.itemSize, this.GL.FLOAT, false, 0, 0);
        
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.moonVertexTextureCoord);
        this.GL.vertexAttribPointer(this.SHADER_PROGRAM.textureCoordAttribute, buffer.moonVertexTextureCoord.itemSize, this.GL.FLOAT, false, 0, 0);
        
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.moonVertexNormal);
        this.GL.vertexAttribPointer(this.SHADER_PROGRAM.vertexNormalAttribute, buffer.moonVertexNormal.itemSize, this.GL.FLOAT, false, 0, 0);
        
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, buffer.moonVertexIndex);
        util.setMatrixUniforms();
        this.GL.drawElements(this.GL.TRIANGLES, buffer.moonVertexIndex.numItems, this.GL.UNSIGNED_SHORT, 0);
        /*this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.triangleVertices);
        this.GL.vertexAttribPointer(this.SHADER_PROGRAM.vertexPositionAttribute, source.triangle.size, this.GL.FLOAT, false, 0, 0);        
        util.setMatrixUniforms();
        this.GL.drawArrays(this.GL.TRIANGLES, 0, source.triangle.items);*/
    },
    
    
    tick: function tick() {
        //this.CANVAS.width = window.innerWidth;
        //this.CANVAS.height = window.innerHeight;
        
        this.GL.viewport(0.0, 0.0, this.CANVAS.width, this.CANVAS.height);
        this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
        
        mat4.perspective(45, this.GL.viewportWidth / this.GL.viewportHeight, 0.1, 100.0, main.pMatrix);
        
        //var lightning = true; //TODO
        
        //if (lighting) {
        this.GL.uniform3f(
            this.SHADER_PROGRAM.ambientColorUniform,
            parseFloat(source.lighting.ambient.r),
            parseFloat(source.lighting.ambient.g),
            parseFloat(source.lighting.ambient.b)
        );
        
        var lightingDirection = [
            parseFloat(source.lighting.directional.x),
            parseFloat(source.lighting.directional.y),
            parseFloat(source.lighting.directional.z)
        ];
        
        var adjustedLD = vec3.create();
        vec3.normalize(lightingDirection, adjustedLD);
        vec3.scale(adjustedLD, -1);
        this.GL.uniform3fv(this.SHADER_PROGRAM.lightingDirectionUniform, adjustedLD);
        
        this.GL.uniform3f(
            this.SHADER_PROGRAM.directionalColorUniform,
            parseFloat(source.lighting.directional.r),
            parseFloat(source.lighting.directional.g),
            parseFloat(source.lighting.directional.b)
        );
        
        mat4.identity(matrix.mv);
        
        mat4.translate(matrix.mv, [0, 0, -10]); //move camera back 6 z (towards viewer)
        
        mat4.multiply(matrix.mv, matrix.moonRotation);
        
        main.draw();
        this.GL.flush();
        window.requestAnimationFrame(function() {
            main.tick();
        });
    },
    
    start: function() {
        if (!window.WebGLRenderingContext) { // Checks if the browser understands WebGL
            alert("Your browser is not WebGL compatible");
            window.location = "http://get.webgl.org"; // Go get that WebGL
        }    
        this.CANVAS = document.getElementById("solarsystem");
        this.GL = this.initGL(this.CANVAS);
        
        this.initShaders();
        
        this.initBuffers();
        
        this.initTextures();
        
        matrix.mv = mat4.create();
        this.mvMatrixStack = [];
        this.pMatrix = mat4.create();
        
        this.GL.clearColor(0.0, 0.0, 0.0 ,1.0);
        this.GL.enable(this.GL.DEPTH_TEST);
        this.GL.depthFunc(this.GL.LEQUAL);
        
        /* Mouse Input */
        this.mouseDown = false;
        this.lastMouseX = null;
        this.lastMouseY = null;
        
        /* Prep */
        matrix.moonRotation = mat4.create();
        mat4.identity(matrix.moonRotation);
        
        this.CANVAS.onmousedown = util.handleMouseDown;
        document.onmouseup = util.handleMouseUp;
        document.onmousemove = util.handleMouseMove;
        
        this.tick();
    }
};