var gl; // A global variable for the WebGL context
function initGL(canvas) {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
}


function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.noteType ==3)
            str += k.textContent;
        k = k.nextSibling;
    }
}

function compileShader(shader, shaderSrc) {
    gl.shaderSource(shader, shaderSrc);
    gl.compileShader(shader);
}

//Shader src
var vertexShaderSrc =   "attribute vec3 aVertexPosition;"+
                        "uniform mat4 uMVMatrix;"+
                        "uniform mat4 uPMatrix"+
                        "void main(void) {"+
                        "   gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);"+
                        "}";
var fragmentShaderSrc = "precision mediump float;"+
                        "void main(void) {"+
                        "   gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);"+
                        "}";

var shaderProgram;
function initShaders() {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    //compileShader(vertexShader, vertexShaderSrc);
    //compileShader(fragmentShader, fragmentShaderSrc);
    var vertexShader = getShader(gl, "shader-vs");
    var fragmentShader = getShader(gl, "shader-fs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}


var mvMatrix = mat4.create();
var pMatrix = mat4.create();

function setMatrixUniforms() {
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

var myVertexPositionBuffer;
var squareVertexPositionBuffer;
function initBuffers() {
    var vertices;
    myVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, myVertexPositionBuffer);
    vertices = [
         0.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  1.0,  0.0,
         2.0,  1.0,  0.0,
         2.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         1.0, -3.0,  0.0,
        -2.0, -3.0,  0.0,
        -2.0, -2.0,  0.0,
         0.0, -2.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    myVertexPositionBuffer.itemSize = 3;
    myVertexPositionBuffer.numItems = 10;

    squareVertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    vertices = [
         1.0,  1.0,  0.0,
        -1.0,  1.0,  0.0,
         1.0, -1.0,  0.0,
        -1.0, -1.0,  0.0,
         0.0, -2.0,  0.0
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    squareVertexPositionBuffer.itemSize = 3;
    squareVertexPositionBuffer.numItems = 5;
}


function drawScene() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

    mat4.identity(mvMatrix);

    mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, myVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, myVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLES, 0, myVertexPositionBuffer.numItems);

    mat4.translate(mvMatrix, [3.0, 0.0, -7.0]);
    gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
    setMatrixUniforms();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}


function tick() {
    requestAnimationFrame(tick);
    drawScene();
}


function webGLStart() {
    var canvas = document.getElementById("solarsystem");
    initGL(canvas);
    if (gl) {
        initShaders();
        initBuffers();
        //initTexture();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.enable(gl.DEPTH_TEST);
        //gl.depthFunc(gl.LEQUAL);
        //gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        drawScene();
    } else {
        alert("Error initialising WebGL.");
    }
}


function start() {
    if (!window.WebGLRenderingContext) { // Checks if the browser understands WebGL
        window.location = "http://get.webgl.org"; // Go get that WebGL
    } else {
        webGLStart()
    }
}
