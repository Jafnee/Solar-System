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
            varying vec2 vTextureCoord;\n\
            varying vec3 vTransformedNormal;\n\
            varying vec4 vPosition;\n\
            void main(void) {\n\
                vPosition = uMVMatrix * vec4(aVertexPosition, 1.0);\n\
                gl_Position = uPMatrix * vPosition;\n\
                vTextureCoord = aTextureCoord;\n\
                vTransformedNormal = uNMatrix * aVertexNormal;\n\
            }",

        fragment: "\n\
            precision mediump float;\n\
            varying vec2 vTextureCoord;\n\
            varying vec3 vTransformedNormal;\n\
            varying vec4 vPosition;\n\
            uniform float uMaterialShininess;\n\
            uniform bool uShowSpecularHighlights;\n\
            uniform bool uUseLighting;\n\
            uniform bool uUseTextures;\n\
            uniform vec3 uAmbientColor;\n\
            uniform vec3 uPointLightingLocation;\n\
            uniform vec3 uPointLightingSpecularColor;\n\
            uniform vec3 uPointLightingDiffuseColor;\n\
            uniform sampler2D uSampler;\n\
            void main(void) {\n\
                vec3 lightWeighting;\n\
                if (!uUseLighting) {\n\
                    lightWeighting = vec3(1.0, 1.0, 1.0);\n\
                } else {\n\
                    vec3 lightDirection = normalize(uPointLightingLocation - vPosition.xyz);\n\
                    vec3 normal = normalize(vTransformedNormal);\n\
                    float specularLightWeighting = 0.0;\n\
                    if (uShowSpecularHighlights) {\n\
                        vec3 eyeDirection = normalize(-vPosition.xyz);\n\
                        vec3 reflectionDirection = reflect(-lightDirection, normal);\n\
                        specularLightWeighting = pow(max(dot(reflectionDirection, eyeDirection), 0.0), uMaterialShininess);\n\
                    }\n\
                    float diffuseLightWeighting = max(dot(normal, lightDirection), 0.0);\n\
                    lightWeighting = uAmbientColor + uPointLightingSpecularColor * specularLightWeighting + uPointLightingDiffuseColor * diffuseLightWeighting;\n\
                }\n\
                vec4 fragmentColor;\n\
                if (uUseTextures) {\n\
                    fragmentColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t));\n\
                } else {\n\
                    fragmentColor = vec4(1.0, 1.0, 1.0, 1.0);\n\
                }\n\
                gl_FragColor = vec4(fragmentColor.rgb * lightWeighting, fragmentColor.a);\n\
            }"    
    },
    
/* MY TEXTURE SOURCE */
    texture: {        
        sun: 'images/textures/sunmap.jpg',
        mercury: 'images/textures/mercurymap.jpg',
        venus: 'images/textures/venusmap.jpg',
        earth: 'images/textures/earthmap1k.jpg',
        moon: 'images/textures/moon.gif',
        mars: 'images/textures/marsmap1k.jpg',
        jupiter: 'images/textures/jupitermap.jpg',
        saturn: 'images/textures/saturnmap.jpg',
        saturnRing: 'images/textures/ringsRGBA.png',
        uranus: 'images/textures/uranusmap.jpg',
        neptune: 'images/textures/neptunemap.jpg',
        space: 'images/textures/spacemap.png'
    }
};

var worldObjects = {
    camera: {
        x: 0.0,
        y: -10.0,
        z: -170.0
    },
    
    lighting: {
        ambient: {
            r: 0.09,
            g: 0.09,
            b: 0.09
        },
        point: {
            x: 0.0,
            y: -10.0,
            z: -170.0,
            r: 0.8,
            g: 0.8,
            b: 0.8
        },
        specular: {
            r: 0.5,
            g: 0.5,
            b: 0.5
        },
        diffuse: {
            r: 0.5,
            g: 0.5,
            b: 0.5
        }
    },
/* Planets & Sun */

    sun: {
        currentSpin: 0,
        currentOrbit: 0,
        spinAngle: 0.008,
        orbitAngle: 0,        
        orbitDistance: 0,
        
        radius: 20,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 100
    },
    
    mercury: {
        currentSpin: 0,
        currentOrbit: 20,
        parent: 'sun',
        spinAngle: 0.01,
        orbitAngle: 0.05,        
        orbitDistance: 35,
        
        radius: 3,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 20
    },
    
    venus: {
        currentSpin: 0,
        currentOrbit: 70,
        parent: 'sun',
        spinAngle: 0.01,
        orbitAngle: 0.01,
        orbitDistance: 50,
        
        radius: 3,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 20
    },
    
    earth: {
        currentSpin: 0,
        currentOrbit: 30,
        parent: 'sun',
        spinAngle: 0.4,
        orbitAngle: 0.02,
        orbitDistance: 70,
        
        radius: 5,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 40
    },
    
    moon: {
        currentSpin: 0,
        currentOrbit: 0,
        parent: 'earth',
        spinAngle: 0.01,
        orbitAngle: 0.09,
        orbitDistance: 10,
        
        radius: 2,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 1
    },
    
    mars: {
        currentSpin: 0,
        currentOrbit: 11,
        parent: 'sun',
        spinAngle: 0.2,
        orbitAngle: 0.04,        
        orbitDistance: 84,
        
        radius: 3,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 10
    },
    
    jupiter: {
        currentSpin: 0,
        currentOrbit: 300,
        parent: 'sun',
        spinAngle: -0.2,
        orbitAngle: 0.01,        
        orbitDistance: 105,
        
        radius: 9,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 70
    },
    
    saturn: {
        currentSpin: 0,
        currentOrbit: 270,
        parent: 'sun',
        spinAngle: 0.02,
        orbitAngle: 0.0199,        
        orbitDistance: 140,
        
        radius: 7.6,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 70,
        ringScale: 18
    },
    
    uranus: {
        currentSpin: 0,
        currentOrbit: 170,
        parent: 'sun',
        spinAngle: 0.02,
        orbitAngle: 0.004,        
        orbitDistance: 190,
        
        radius: 4.5,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 60
    },
    
    neptune: {
        currentSpin: 0,
        currentOrbit: 0,
        parent: 'sun',
        spinAngle: 0.02,
        orbitAngle: 0.002,        
        orbitDistance: 210,
        
        radius: 4.6,
        latitudeBands: 60,
        longitudeBands: 60,
        shine: 60
    },
/* Background */
    space: {
        currentSpin: 0,
        currentOrbit: 0,
        parent: 'sun',
        spinAngle: 0,
        orbitAngle: 0,        
        orbitDistance: 0,
        
        radius: 300,
        latitudeBands: 80,
        longitudeBands: 80,
        shine: 30
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
        this.SHADER_PROGRAM.useTexturesUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uUseTextures");
        this.SHADER_PROGRAM.useLightingUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uUseLighting");
        this.SHADER_PROGRAM.ambientColorUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uAmbientColor");
        this.SHADER_PROGRAM.pointLightingLocationUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uPointLightingLocation");
        this.SHADER_PROGRAM.pointLightingColorUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uPointLightingColor");
        this.SHADER_PROGRAM.materialShininessUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uMaterialShininess");
        this.SHADER_PROGRAM.showSpecularHighlightsUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uShowSpecularHighlights");
        this.SHADER_PROGRAM.pointLightingSpecularColorUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uPointLightingSpecularColor");
        this.SHADER_PROGRAM.pointLightingDiffuseColorUniform = this.GL.getUniformLocation(this.SHADER_PROGRAM, "uPointLightingDiffuseColor");
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
        
        buffer.saturnRing = {};
        buffer.saturnRing.vertexPosition = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.saturnRing.vertexPosition);
        var vertices = [
            -1.0, 0.0,  1.0,
             1.0, 0.0,  1.0,
             1.0,  0.0,  1.0,
            -1.0,  0.0,  1.0,

            -1.0, 0.0, -1.0,
            -1.0,  0.0, -1.0,
             1.0,  0.0, -1.0,
             1.0, 0.0, -1.0,

            -1.0,  0.0, -1.0,
            -1.0,  0.0,  1.0,
             1.0,  0.0,  1.0,
             1.0,  0.0, -1.0,

            -1.0, 0.0, -1.0,
             1.0, 0.0, -1.0,
             1.0, 0.0,  1.0,
            -1.0, 0.0,  1.0,

             1.0, 0.0, -1.0,
             1.0,  0.0, -1.0,
             1.0,  0.0,  1.0,
             1.0, 0.0,  1.0,

            -1.0, 0.0, -1.0,
            -1.0, 0.0,  1.0,
            -1.0,  0.0,  1.0,
            -1.0,  0.0, -1.0
        ];
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(vertices), this.GL.STATIC_DRAW);
        buffer.saturnRing.vertexPositionItemSize = 3;
        buffer.saturnRing.vertexPositionNumItems = 24;
        
        buffer.saturnRing.vertexNormal = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.saturnRing.vertexNormal);
        var vertexNormals = [
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,
             0.0,  0.0,  1.0,

             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,
             0.0,  0.0, -1.0,

             0.0,  0,  0.0,
             0.0,  0,  0.0,
             0.0,  0,  0.0,
             0.0,  0,  0.0,

             0.0, 0,  0.0,
             0.0, 0,  0.0,
             0.0, 0,  0.0,
             0.0, 0,  0.0,

             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,
             1.0,  0.0,  0.0,

            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0,
            -1.0,  0.0,  0.0
        ];
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(vertexNormals), this.GL.STATIC_DRAW);
        buffer.saturnRing.vertexNormalItemSize = 3;
        buffer.saturnRing.vertexNormalNumItems = 24;
        
        buffer.saturnRing.vertexTextureCoord = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.saturnRing.vertexTextureCoord);
        var textureCoords = [
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,

            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,

            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,
            1.0, 0.0,

            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0,
            0.0, 0.0,

            0.0, 0.0,
            1.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ];
        this.GL.bufferData(this.GL.ARRAY_BUFFER, new Float32Array(textureCoords), this.GL.STATIC_DRAW);
        buffer.saturnRing.vertexTextureCoordItemSize = 2;
        buffer.saturnRing.vertexTextureCoordNumItems = 24;
        
        buffer.saturnRing.vertexIndex = this.GL.createBuffer();
        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, buffer.saturnRing.vertexIndex);
        var cubeVertexIndices = [
            0, 1, 2,      0, 2, 3,   
            4, 5, 6,      4, 6, 7,  
            8, 9, 10,     8, 10, 11, 
            12, 13, 14,   12, 14, 15,
            16, 17, 18,   16, 18, 19,
            20, 21, 22,   20, 22, 23 
        ];
        this.GL.bufferData(this.GL.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), this.GL.STATIC_DRAW);
        buffer.saturnRing.vertexIndexItemSize = 1;
        buffer.saturnRing.vertexIndexNumItems = 36;
    },
    
    
    initTextures: function() {
        texture.sun = this.GL.createTexture();
        texture.sun.image = new Image();
        texture.sun.image.onload = function() {
            util.handleLoadedTexture(texture.sun);
        };
        texture.sun.image.src = source.texture.sun;
        
        texture.mercury = this.GL.createTexture();
        texture.mercury.image = new Image();
        texture.mercury.image.onload = function() {
            util.handleLoadedTexture(texture.mercury);
        };
        texture.mercury.image.src = source.texture.mercury;
        
        texture.venus = this.GL.createTexture();
        texture.venus.image = new Image();
        texture.venus.image.onload = function() {
            util.handleLoadedTexture(texture.venus);
        };
        texture.venus.image.src = source.texture.venus;
        
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
        
        texture.mars = this.GL.createTexture();
        texture.mars.image = new Image();
        texture.mars.image.onload = function() {
            util.handleLoadedTexture(texture.mars);
        };
        texture.mars.image.src = source.texture.mars;
        
        texture.jupiter = this.GL.createTexture();
        texture.jupiter.image = new Image();
        texture.jupiter.image.onload = function() {
            util.handleLoadedTexture(texture.jupiter);
        };
        texture.jupiter.image.src = source.texture.jupiter;
        
        texture.saturn = this.GL.createTexture();
        texture.saturn.image = new Image();
        texture.saturn.image.onload = function() {
            util.handleLoadedTexture(texture.saturn);
        };
        texture.saturn.image.src = source.texture.saturn;
        
        texture.saturnRing = this.GL.createTexture();
        texture.saturnRing.image = new Image();
        texture.saturnRing.image.onload = function() {
            util.handleLoadedTexture(texture.saturnRing);
        };
        texture.saturnRing.image.src = source.texture.saturnRing;
        
        texture.uranus = this.GL.createTexture();
        texture.uranus.image = new Image();
        texture.uranus.image.onload = function() {
            util.handleLoadedTexture(texture.uranus);
        };
        texture.uranus.image.src = source.texture.uranus;
        
        texture.neptune = this.GL.createTexture();
        texture.neptune.image = new Image();
        texture.neptune.image.onload = function() {
            util.handleLoadedTexture(texture.neptune);
        };
        texture.neptune.image.src = source.texture.neptune;

        texture.space = this.GL.createTexture();
        texture.space.image = new Image();
        texture.space.image.onload = function() {
            util.handleLoadedTexture(texture.space);
        };
        texture.space.image.src = source.texture.space;
    },
    
    
    draw: function draw() {
        this.CANVAS.width = window.innerWidth;
        this.CANVAS.height = window.innerHeight;
        this.GL.viewportWidth = this.CANVAS.width;
        this.GL.viewportHeight = this.CANVAS.height;
        this.GL.viewport(0.0, 0.0, this.GL.viewportWidth, this.GL.viewportHeight);
        this.GL.clear(this.GL.COLOR_BUFFER_BIT | this.GL.DEPTH_BUFFER_BIT);
        
        mat4.perspective(45, this.GL.viewportWidth / this.GL.viewportHeight, 0.1, 1000.0, matrix.p);
        
        var specularHighlights = true;
        this.GL.uniform1i(this.SHADER_PROGRAM.showSpecularHighlightsUniform, specularHighlights);        
        this.GL.uniform3f(
            this.SHADER_PROGRAM.ambientColorUniform,
            worldObjects.lighting.ambient.r,
             worldObjects.lighting.ambient.g,
             worldObjects.lighting.ambient.b
        );

        this.GL.uniform3f(
            this.SHADER_PROGRAM.pointLightingLocationUniform,
            worldObjects.lighting.point.x,
            worldObjects.lighting.point.y,
            worldObjects.lighting.point.z
        );
        
        this.GL.uniform3f(
            this.SHADER_PROGRAM.pointLightingSpecularColorUniform,
            worldObjects.lighting.specular.r,
            worldObjects.lighting.specular.g,
            worldObjects.lighting.specular.b
        );

        this.GL.uniform3f(
            this.SHADER_PROGRAM.pointLightingDiffuseColorUniform,
            worldObjects.lighting.diffuse.r,
            worldObjects.lighting.diffuse.g,
            worldObjects.lighting.diffuse.b
        );
            
        var textures = true; // for debug;
        this.GL.uniform1i(this.SHADER_PROGRAM.useTexturesUniform, textures);
        
        mat4.identity(matrix.mv);

        for (var i = 0; i < this.spheres.length; i++) {
            this.GL.disable(this.GL.BLEND);
            this.GL.enable(this.GL.DEPTH_TEST);
            var target = this.spheres[i];
            
            util.mvPushMatrix();
            
            this.GL.uniform1f(this.SHADER_PROGRAM.materialShininessUniform, worldObjects[target].shine);
            if (target === 'sun') {
                this.GL.uniform1i(this.SHADER_PROGRAM.useLightingUniform, false);
            } else {
                this.GL.uniform1i(this.SHADER_PROGRAM.useLightingUniform, true);
            }
            mat4.translate(matrix.mv, [worldObjects.camera.x, worldObjects.camera.y, worldObjects.camera.z]); //goes to my 'origin'
            mat4.rotate(matrix.mv, util.degToRad(20), [1, 0, 0]);
            if (target !== 'moon') {
                mat4.rotate(matrix.mv, util.degToRad(worldObjects[target].currentOrbit), [0, 1, 0]);
                mat4.translate(matrix.mv, [worldObjects[target].orbitDistance, 0, 0]); // draws planet x distance from sun
                mat4.rotate(matrix.mv, util.degToRad(worldObjects[target].currentSpin), [0, 1, 0]);
            } else {
                mat4.rotate(matrix.mv, util.degToRad(worldObjects.earth.currentOrbit), [0, 1, 0]);
                mat4.translate(matrix.mv, [worldObjects.earth.orbitDistance, 0, 0]);
                mat4.rotate(matrix.mv, util.degToRad(worldObjects[target].currentOrbit), [0, 1, 0]);
                mat4.translate(matrix.mv, [worldObjects[target].orbitDistance, 0, 0]);                
                mat4.rotate(matrix.mv, util.degToRad(worldObjects[target].currentSpin), [0, 1, 0]);                
            }
                
            this.GL.activeTexture(this.GL.TEXTURE0);
            this.GL.bindTexture(this.GL.TEXTURE_2D, texture[target]);
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
        this.GL.uniform1i(this.SHADER_PROGRAM.useLightingUniform, true);
        util.mvPushMatrix();
        this.GL.blendFunc(this.GL.SRC_ALPHA, this.GL.ONE);
        this.GL.enable(this.GL.BLEND);
        this.GL.disable(this.GL.DEPTH_TEST);
        this.GL.uniform1f(this.SHADER_PROGRAM.alphaUniform, 1);
        // saturn ring
        mat4.translate(matrix.mv, [worldObjects.camera.x, worldObjects.camera.y, worldObjects.camera.z]); //goes to my 'origin'
        var scale = worldObjects.saturn.ringScale;
        mat4.rotate(matrix.mv, util.degToRad(20), [1, 0, 0]);        
        mat4.rotate(matrix.mv, util.degToRad(worldObjects.saturn.currentOrbit), [0, 1, 0]);
        mat4.translate(matrix.mv, [worldObjects.saturn.orbitDistance, 0, 0]); 
        mat4.rotate(matrix.mv, util.degToRad(worldObjects.saturn.currentSpin), [0, 1, 0]);
        mat4.scale(matrix.mv,[scale,0,scale]);
        mat4.rotate(matrix.mv, util.degToRad(20), [0, -1, 0]);
        
        this.GL.activeTexture(this.GL.TEXTURE0);
        this.GL.bindTexture(this.GL.TEXTURE_2D, texture.saturnRing);
        this.GL.uniform1i(this.SHADER_PROGRAM.samplerUniform, 0);

        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.saturnRing.vertexPosition);
        this.GL.vertexAttribPointer(this.SHADER_PROGRAM.vertexPositionAttribute, buffer.saturnRing.vertexPositionItemSize, this.GL.FLOAT, false, 0, 0);

        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.saturnRing.vertexTextureCoord);
        this.GL.vertexAttribPointer(this.SHADER_PROGRAM.textureCoordAttribute, buffer.saturnRing.vertexTextureCoordItemSize, this.GL.FLOAT, false, 0, 0);

        this.GL.bindBuffer(this.GL.ARRAY_BUFFER, buffer.saturnRing.vertexNormal);
        this.GL.vertexAttribPointer(this.SHADER_PROGRAM.vertexNormalAttribute, buffer.saturnRing.vertexNormalItemSize, this.GL.FLOAT, false, 0, 0);

        this.GL.bindBuffer(this.GL.ELEMENT_ARRAY_BUFFER, buffer.saturnRing.vertexIndex);
        util.setMatrixUniforms();
        this.GL.drawElements(this.GL.TRIANGLES, buffer.saturnRing.vertexIndexNumItems, this.GL.UNSIGNED_SHORT, 0);
        
        util.mvPopMatrix();        
    },
    
    animate: function() {
        var timeNow = new Date().getTime();
        if (this.lastTime !== 0) {
            var elapsed = timeNow - this.lastTime;
            for (var i =0; i < this.spheres.length; i++) {
                var target = this.spheres[i];
                worldObjects[target].currentSpin += worldObjects[target].spinAngle * elapsed;
                worldObjects[target].currentOrbit += worldObjects[target].orbitAngle * elapsed;
            }
        }
        this.lastTime = timeNow;
    },
    
    tick: function tick() {
        window.requestAnimationFrame(function() {
            main.tick();
        });
        main.draw();   
        this.GL.flush();  
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
        //'sun','mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'space'
        this.spheres = ['sun','mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'space']; // Easier to reuse code and process buffers together
        this.initBuffers();
        
        this.initTextures();
        
        matrix.mv = mat4.create();
        this.mvMatrixStack = [];
        matrix.p = mat4.create();
        
        this.GL.clearColor(0.0, 0.0, 0.0 ,1.0);
        this.GL.enable(this.GL.DEPTH_TEST);
        this.GL.depthFunc(this.GL.LEQUAL);
        /* Mouse Input */    
        
        /* Animation */
        this.lastTime = 0;
        /* Prep */     
        this.tick();
    }
};