var source = {
/* MY SHADER SOURCE */
    shader: {
        vertex: "\n\
            attribute vec3 aVertexPosition;\n\
            attribute vec3 aVertexNormal;\n\
            attribute vec2 aTextureCoord;\n\
            uniform mat4 uMVMatrix;\n\
            uniform mat4 uPMatrix;\n\
            uniform mat3 uNMatrix;\n\
            uniform vec3 uAmbientColor;\n\
            uniform vec3 uPointLightingLocation;\n\
            uniform vec3 uPointLightingColor;\n\
            uniform bool uUseLighting;\n\
            varying vec2 vTextureCoord;\n\
            varying vec3 vLightWeighting;\n\
            void main(void) {\n\
                vec4 mvPosition = uMVMatrix * vec4(aVertexPosition, 1.0);\n\
                gl_Position = uPMatrix * mvPosition;\n\
                vTextureCoord = aTextureCoord;\n\
                if (!uUseLighting) {\n\
                    vLightWeighting = vec3(1.0, 1.0, 1.0);\n\
                } else {\n\
                    vec3 lightDirection = normalize(uPointLightingLocation - mvPosition.xyz);\n\
                    vec3 transformedNormal = uNMatrix * aVertexNormal;\n\
                    float directionalLightWeighting = max(dot(transformedNormal, lightDirection), 0.0);\n\
                    vLightWeighting = uAmbientColor + uPointLightingColor * directionalLightWeighting;\n\
                }\n\
            }",

        fragment: "\n\
            precision mediump float;\n\
            varying vec2 vTextureCoord;\n\
            varying vec3 vLightWeighting;\n\
            uniform sampler2D uSampler;\n\
            void main(void) {\n\
                vec4 textureColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
                gl_FragColor = vec4(textureColor.rgb * vLightWeighting, textureColor.a);\n\
            }"
    },
/* MY TEXTURE SOURCE */
    texture: {
        sun: 'images/textures/sunmap.jpg',
        earth: 'images/textures/earthmap1k.jpg',
        moon: 'images/textures/moon.gif'
    }
};

var worldObjects = {
    camera: null,
    
    lighting: {
        ambient: {
            r: 0.8,
            g: 0.8,
            b: 0.8
        },
        point: {
            x: 0.0,
            y: 0.0,
            z: -20.0,
            r: 0.8,
            g: 0.8,
            b: 0.8
        }
    },
    
    space: {
        radius:40,
        latitudeBands: 60,
        longitudeBands: 60
    },
    
    sun: {
        angle: 180,
        orbitAngle: 180,
        orbitSpeed: 0.05,
        orbitDistance: 0,
        rotateSpeed: 1,
        speed: 0.05,
        radius: 5,
        latitudeBands: 60,
        longitudeBands: 60
    },
    
    earth: {
        angle: 180,
        orbitAngle: 180,
        orbitSpeed: 0.05,
        orbitDistance: 9,
        rotateSpeed: 1,
        speed: 0.05,
        radius: 2,
        latitudeBands: 60,
        longitudeBands: 60
    },
    
    moon: {
        angle: 270,
        orbitAngle: 270,
        orbitSpeed: 0.05,
        orbitDistance: 8,
        rotateSpeed: 1,
        speed: 0.05,
        radius: 1,
        latitudeBands: 60,
        longitudeBands: 60
    }
};

var buffer = {};

var texture = {};

var matrix = {};


var util = {
    
    degToRad: function(degrees) {
        return degrees * Math.PI / 180;
    },
    
    setMatrixUniforms: function() {
        main.GL.uniformMatrix4fv(main.SHADER_PROGRAM.pMatrixUniform, false, matrix.p);
        main.GL.uniformMatrix4fv(main.SHADER_PROGRAM.mvMatrixUniform, false, matrix.mv);
        
        var normalMatrix = mat3.create();
        mat4.toInverseMat3(matrix.mv, normalMatrix);
        mat3.transpose(normalMatrix);
        main.GL.uniformMatrix3fv(main.SHADER_PROGRAM.nMatrixUniform, false, normalMatrix);
    },
    
    compileShader: function(source, type) {
        var shader = main.GL.createShader(type);
        main.GL.shaderSource(shader, source);
        main.GL.compileShader(shader);
        if (!main.GL.getShaderParameter(shader, main.GL.COMPILE_STATUS)) {
            alert('ERROR Shader: ' + type);
            System.exit(1);
        } else {
            return shader;
        }
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
        matrix.mv = main.mvMatrixStack.pop();
    }
    
    /* Mouse Events */

};


var main = {
    initGL: function(canvas) {
        var GL;
        GL = canvas.getContext("webgl", {antialias: true}) || canvas.getContext("experimental-webgl", {antialias: true}); //webgl > experimental
        GL.viewportWidth = canvas.width; // temp
        GL.viewportHeight = canvas.height; // see what happens
        
        if(!GL) {
            alert("ERROR: WebGL failed to initialise");
        }
        return GL;
    },

    
    initShaders: function() {        
        var shaderVertex = util.compileShader(source.shader.vertex, this.GL.VERTEX_SHADER);
        var shaderFragment = util.compileShader(source.shader.fragment, this.GL.FRAGMENT_SHADER);
        
        this.SHADER_PROGRAM = this.GL.createProgram();
        this.GL.attachShader(this.SHADER_PROGRAM, shaderVertex);
        this.GL.attachShader(this.SHADER_PROGRAM, shaderFragment);        
        this.GL.linkProgram(this.SHADER_PROGRAM);
        
        if (!this.GL.getProgramParameter(this.SHADER_PROGRAM, this.GL.LINK_STATUS)) {
            alert("ERROR: Shaders failed to link");
        }
        
        this.GL.useProgram(this.SHADER_PROGRAM);
        
        this.SHADER_PROGRAM.vertexPositionAttribute = this.GL.getAttribLocation(this.SHADER_PROGRAM, "aVertexPosition");     
        this.GL.enableVertexAttribArray(this.SHADER_PROGRAM.vertexPositionAttribute);
        
        this.SHADER_PROGRAM.textureCoordAttribute = this.GL.getAttribLocation(this.SHADER_PROGRAM, "aTextureCoord");
        this.GL.enableVertexAttribArray(this.SHADER_PROGRAM.textureCoordAttribute);
        
        this.SHADER_PROGRAM.vertexNormalAttribute = this.GL.getAttribLocation(this.SHADER_PROGRAM, "aVertexNormal");
        this.GL.enableVertexAttribArray(this.SHADER_PROGRAM.vertexNormalAttribute);
        
        this.SHADER_PROGRAM.pMatrixUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uPMatrix");
        this.SHADER_PROGRAM.mvMatrixUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uMVMatrix");
        this.SHADER_PROGRAM.nMatrixUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uNMatrix");
        this.SHADER_PROGRAM.samplerUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uSampler");
        this.SHADER_PROGRAM.userLightingUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uUseLighting");
        this.SHADER_PROGRAM.ambientColorUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uAmbientColor");
        this.SHADER_PROGRAM.lightingDirectionUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uPointLightingLocation");
        this.SHADER_PROGRAM.directionalColorUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uPointLightingColor");
    },
    
    
    initBuffers: function() {
        for (var i = 0; i < main.spheres.length; i++) {
            var target = main.spheres[i];
            var latitudeBands = worldObjects[target].latitudeBands;
            var longitudeBands = worldObjects[target].longitudeBands;
            var radius = worldObjects[target].radius;
            
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
            buffer[target] = {};
            buffer[target].vertexNormal = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer[target].vertexNormal);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(normalData), this.GL.STATIC_DRAW);
            buffer[target].vertexNormalItemSize = 3;
            buffer[target].vertexNormalNumItems = normalData.length / 3;
            
            buffer[target].vertexTextureCoord = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer[target].vertexTextureCoord);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(textureCoordData), this.GL.STATIC_DRAW);
            buffer[target].vertexTextureCoordItemSize = 2;
            buffer[target].vertexTextureCoordNumItems = textureCoordData.length / 2;
            
            buffer[target].vertexPosition = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer[target].vertexPosition);
            this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(vertexPositionData), this.GL.STATIC_DRAW);
            buffer[target].vertexPositionItemSize = 3;
            buffer[target].vertexPositionNumItems = vertexPositionData.length / 3;
            
            buffer[target].vertexIndex = this.GL.createBuffer();
            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, buffer[target].vertexIndex);
            this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), this.GL.STATIC_DRAW);
            buffer[target].vertexIndexItemSize = 1;
            buffer[target].vertexIndexNumItems = indexData.length;
        }               
    },
    
    
    initTextures: function() {
        texture.earth = this.GL.createTexture();
        texture.earth.image = new Image();
        texture.earth.image.onload = function() {
            util.handleLoadedTexture(texture.earth);
        };
        texture.earth.image.src = source.texture.earth;
        
        texture.moon = this.GL.createTexture();
        texture.moon.image = new Image();
        texture.moon.image.onload = function() {
            util.handleLoadedTexture(texture.moon);
        };
        texture.moon.image.src = source.texture.moon;
        
        texture.sun = this.GL.createTexture();
        texture.sun.image = new Image();
        texture.sun.image.onload = function() {
            util.handleLoadedTexture(texture.sun);
        };
        texture.sun.image.src = source.texture.sun;
    },
    
    
    draw: function draw() {
        this.GL.viewport(0.0, 0.0, this.GL.viewportWidth, this.GL.viewportHeight);
        this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
        
        mat4.perspective(45, this.GL.viewportWidth / this.GL.viewportHeight, 0.1, 1000.0, matrix.p);
        
        var lighting = true;
        
        this.GL.uniform1i(this.SHADER_PROGRAM.useLightingUniform, lighting);
        if (lighting) {
            this.GL.uniform3f(
                this.SHADER_PROGRAM.ambientColorUniform,
                parseFloat("0"),
                parseFloat("0"),
                parseFloat("0")
            );

            this.GL.uniform3f(
                this.SHADER_PROGRAM.pointLightingLocationUniform,
                0.0,
                0.0,
                20.0
            );

            this.GL.uniform3f(
                this.SHADER_PROGRAM.pointLightingColorUniform,
                0.0,
                0.0,
                0.0
            );
        }
        
        mat4.identity(matrix.mv);

        mat4.translate(matrix.mv, [0, 0, -70]); //my camera location
        for (var i = 0; i < this.spheres.length; i++) {
            var target = this.spheres[i];
            util.mvPushMatrix();
            mat4.rotate(matrix.mv, util.degToRad(worldObjects[target].angle), [0, 1, 0]); //drawing moon
            mat4.translate(matrix.mv, [worldObjects[target].orbitDistance, 0, 0]); //check dis out
            
            this.GL.activeTexture(this.GL.TEXTURE0);
            this.GL.bindTexture(this.GL.TEXTURE_2D, texture[target]);// look here
            this.GL.uniform1i(this.SHADER_PROGRAM.samplerUniform, 0);

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer[target].vertexPosition);
            this.GL.vertexAttribPointer(this.SHADER_PROGRAM.vertexPositionAttribute, buffer[target].vertexPositionItemSize, this.GL.FLOAT, false, 0, 0);

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer[target].vertexTextureCoord);
            this.GL.vertexAttribPointer(this.SHADER_PROGRAM.textureCoordAttribute, buffer[target].vertexTextureCoordItemSize, this.GL.FLOAT, false, 0, 0);

            this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer[target].vertexNormal);
            this.GL.vertexAttribPointer(this.SHADER_PROGRAM.vertexNormalAttribute, buffer[target].vertexNormalItemSize, this.GL.FLOAT, false, 0, 0);

            this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, buffer[target].vertexIndex);
            util.setMatrixUniforms();
            this.GL.drawElements(this.GL.TRIANGLES, buffer[target].vertexIndexNumItems, this.GL.UNSIGNED_SHORT, 0);
            util.mvPopMatrix();
        }
    },
    
    animate: function() {
        var timeNow = new Date().getTime();
        if (this.lastTime !== 0) {
            var elapsed = timeNow - this.lastTime;
            
            worldObjects.moon.angle += worldObjects.moon.speed * elapsed;
            worldObjects.earth.angle += worldObjects.earth.speed * elapsed;
        }
        this.lastTime = timeNow;
    },
    
    tick: function tick() {
        window.requestAnimationFrame(function() {
            main.tick();
        });
        main.draw();   
        //this.GL.flush();  
        main.animate();
    },
    
    start: function() {
        if (!window.WebGLRenderingContext) { // Checks if the browser understands WebGL
            alert("Your browser is not WebGL compatible");
            window.location = "http://get.webgl.org"; // Go get that WebGL
        }    
        this.CANVAS = document.getElementById("solarsystem");
        this.GL = this.initGL(this.CANVAS);
        
        this.initShaders();
        
        this.spheres = ['earth', 'moon', 'sun']; // Easier to reuse code and process buffers together
        this.initBuffers();
        
        this.initTextures();
        
        matrix.mv = mat4.create();
        this.mvMatrixStack = [];
        matrix.p = mat4.create();
        
        this.GL.clearColor(0.0, 0.0, 0.0 ,1.0);
        this.GL.enable(this.GL.DEPTH_TEST);        
        /* Mouse Input */    
        
        /* Animation */
        this.lastTime = 0;
        
        /* Prep */
        

        
        this.tick();
    }
};