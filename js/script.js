var source = {
/* MY SHADERS */
    shaderVertex: "\n\
attribute vec3 aVertexPosition;\n\
uniform mat4 uMVMatrix;\n\
uniform mat4 uPMatrix;\n\
void main(void) { //pre-built function\n\
gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n\
}",

    
/*"\n\
attribute vec2 position; //the position of the point\n\
void main(void) { //pre-built function\n\
gl_Position = vec4(position, 0., 1.); //0. is the z, and 1 is w\n\
}",*/

    shaderFragment: "\n\
precision mediump float;\n\
void main(void) {\n\
gl_FragColor = vec4(1.0,1.0,1.0, 1.0);\n\
}",

/* MYCOORD ARRAYS */
    triangle: {
        vertices: [
        -1.0, -1.0,  0.0,
         1.0, -1.0,  0.0,
         1.0,  1.0,  0.0
        ],
        
        size: 3,
        
        items: 3,        
    }     
};


var buffer = {};


var util = {
    translate: function translate(value, direction){
    },
    
    scale: function scale(value){
    },
    
    rotate: function rotate(value, pivot){
    }
};


var main = {
    initGL: function initGL(canvas) {
        var GL = canvas.getContext("webgl") || canvas.getContext("experimental-webgl"); //webgl > experimental
        GL.viewportWidth = canvas.width; // remove this
        GL.viewportHeight = canvas.height; // and this when css is in place.
        return GL;
    },

    
    initShaders: function initShaders(GL, vertexSrc, fragmentSrc) {
        var compileShader = function compile(source, type) {
            var shader = GL.createShader(type);
            GL.shaderSource(shader, source);
            GL.compileShader(shader);
            if (!GL.getShaderParameter(shader, GL.COMPILE_STATUS)) {
                console.log('ERROR Shader: ' + type);
            } else {
                return shader;
            }
        };
        var shaderVertex = compileShader(vertexSrc, GL.VERTEX_SHADER);
        var shaderFragment = compileShader(fragmentSrc, GL.FRAGMENT_SHADER);
        
        main.SHADER_PROGRAM = GL.createProgram();
        GL.attachShader(main.SHADER_PROGRAM, shaderVertex);
        GL.attachShader(main.SHADER_PROGRAM, shaderFragment);
        
        GL.linkProgram(main.SHADER_PROGRAM);
        
        if (!GL.getProgramParameter(main.SHADER_PROGRAM, GL.LINK_STATUS)) {
            console.log("Could not initialise shaders");
        }
        
        GL.useProgram(main.SHADER_PROGRAM);
        
        main.SHADER_PROGRAM.vertexPositionAttribute = GL.getAttribLocation(main.SHADER_PROGRAM, "aVertexPosition");     
        GL.enableVertexAttribArray(main.SHADER_PROGRAM.vertexPositionAttribute);
        
        main.SHADER_PROGRAM.pMatrixUniform = GL.getUniformLocation(main.SHADER_PROGRAM, "uPMatrix");
        main.SHADER_PROGRAM.mvMatrixUniform = GL.getUniformLocation(main.SHADER_PROGRAM, "uMVMatrix");        
    },
    
    
    initBuffers: function initBuffers(GL) {
        buffer.triangleVertices = GL.createBuffer();
        GL.bindBuffer(GL.ARRAY_BUFFER, buffer.triangleVertices);
        GL.bufferData(GL.ARRAY_BUFFER, new Float32Array(source.triangle.vertices), GL.STATIC_DRAW);
    },
    
    
    setMatrixUniforms: function setMatrixUniforms(GL, mvMatrix, pMatrix) {
        GL.uniformMatrix4fv(main.SHADER_PROGRAM.mvMatrixUniform, false, mvMatrix);
        GL.uniformMatrix4fv(main.SHADER_PROGRAM.pMatrixUniform, false, pMatrix);
    },
    
    
    draw: function draw(GL, mvMatrix, pMatrix) {
        mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);        
        GL.bindBuffer(GL.ARRAY_BUFFER, buffer.triangleVertices);
        GL.vertexAttribPointer(this.SHADER_PROGRAM.vertexPositionAttribute, source.triangle.size, GL.FLOAT, false, 0, 0);        
        main.setMatrixUniforms(GL, mvMatrix, pMatrix);
        GL.drawArrays(GL.TRIANGLES, 0, source.triangle.items);
    },
    
    
    tick: function tick(GL, mvMatrix, pMatrix) {        
        GL.viewport(0.0, 0.0, GL.viewportWidth, GL.viewportHeight);
        GL.clear(GL.COLOR_BUFFER_BIT | GL.DEPTH_BUFFER_BIT);
        
        mat4.perspective(45, GL.viewportWidth / GL.viewportHeight, 0.1, 100.0, pMatrix);
        
        mat4.identity(mvMatrix);
        
        main.draw(GL, mvMatrix, pMatrix);
        GL.flush();
        window.requestAnimationFrame(function() {
            main.tick(GL, mvMatrix, pMatrix);
        });
    },
    
    start: function start() {
        if (!window.WebGLRenderingContext) { // Checks if the browser understands WebGL
            alert("Your browser is not WebGL compatible");
            window.location = "http://get.webgl.org"; // Go get that WebGL
        }    
        var CANVAS = document.getElementById("solarsystem");
        var GL = main.initGL(CANVAS);
        
        this.initShaders(GL, source.shaderVertex, source.shaderFragment);
        
        this.initBuffers(GL);
        
        var mvMatrix = mat4.create();
        var pMatrix = mat4.create();
        
        GL.clearColor(0.0, 0.0, 0.0 ,1.0);
        GL.enable(GL.DEPTH_TEST);
        
        this.tick(GL, mvMatrix, pMatrix);
    }
};