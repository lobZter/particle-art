var gl,
    shaderProgram,
    vertices,
    velocities,
    ratio,
    centerX,
    centerY,
    enable = false,
    m = 3.0,
    n = 5.0,
    t = 0.0,
    a = 0.6,
    randomX = 0.0,
    randomY = 0.0,
    numLines = 50000,
    interval_circle,
    interval_rose;

// setTimeout(function(){
//     var x = 0,
//         y = 0;
//     centerX = 0.03 * Math.cos(x / 360.0 * Math.PI);
//     centerY = 0.03 * Math.sin(y / 360.0 * Math.PI);

//     interval_circle = setInterval(function(){
//         x+=135;
//         centerX = randomX + 0.05 * Math.cos(x / 360.0 * Math.PI);
//         y+=135;
//         centerY = randomY + 0.05 * Math.sin(y / 360.0 * Math.PI);
//     },50);

// }, 2000);

setTimeout(function(){
    setInterval(function(){
        enable = false;
        setTimeout(function(){enable = true;}, 100);
    },4000);
}, 2000);


// for random path 
setTimeout(function(){

    clearInterval(interval_circle);
    setInterval(function(){
        m = Math.random() * 100;
        n = Math.random() * 100;
    },200);
    interval_rose = setInterval(function(){
        t = t + 37.0;
        centerX = a * Math.cos(t/360.0*Math.PI) * Math.cos(m/n*t/360.0*Math.PI)*ratio;
        centerY = a * Math.sin(t/360.0*Math.PI) * Math.cos(m/n*t/360.0*Math.PI);
    },50);
}, 2000);


function initGL() {

    var canvas = document.getElementById("webGLCanvas");
    gl = gl = canvas.getContext('webgl') || canvas.getContext("experimental-webgl");

    if (!gl) {
        alert("There's no WebGL context available, sorry :-(");
        return;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    ratio = gl.viewportWidth / gl.viewportHeight;
    console.log(gl.viewportWidth);
    console.log(gl.viewportHeight);
}

function initShaders() {

    var vertexShaderScript = document.getElementById("shader-vs");
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderScript.text);
    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert("Couldn't compile the vertex shader");
        gl.deleteShader(vertexShader);
        return;
    }
    
    var fragmentShaderScript = document.getElementById("shader-fs");
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderScript.text);
    gl.compileShader(fragmentShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert("Couldn't compile the fragment shader");
        gl.deleteShader(fragmentShader);
        return;
    }

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Unable to initialise shaders");
        gl.deleteProgram(shaderProgram);
        gl.deleteProgram(vertexShader);
        gl.deleteProgram(fragmentShader);
        return;
    }

    gl.useProgram(shaderProgram);
    shaderProgram.vertexPosition = gl.getAttribLocation(shaderProgram, "vertexPosition");
    shaderProgram.perspectiveMatrix = gl.getUniformLocation(shaderProgram, "perspectiveMatrix");
    shaderProgram.modelViewMatrix = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
    gl.enableVertexAttribArray(shaderProgram.vertexPosition);
}

function initViewingAndTransformation() {
    gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

    var fieldOfView = 30.0;
    var aspectRatio = gl.viewportWidth / gl.viewportHeight;
    var near = 1.0;
    var far = 10000.0;
    var top = near * Math.tan(fieldOfView / 360.0 * Math.PI);
    var bottom = -top;
    var right = top * aspectRatio;
    var left = -right;

    var a = (right + left) / (right - left);
    var b = (top + bottom) / (top - bottom);
    var c = (far + near) / (far - near);
    var d = (2 * far * near) / (far - near);
    var x = (2 * near) / (right - left);
    var y = (2 * near) / (top - bottom);
    var perspectiveMatrix = [
        x, 0, a, 0,
        0, y, b, 0,
        0, 0, c, d,
        0, 0, -1, 0
    ];

    var modelViewMatrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];

    gl.uniformMatrix4fv(shaderProgram.perspectiveMatrix, false, new Float32Array(perspectiveMatrix));
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrix, false, new Float32Array(modelViewMatrix));
}

function initScene() {
 
    var vertexPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    vertices = [];
    velocities = [];
    for (var i = 0; i < numLines; i++) {
        vertices.push(0.0, 0.0, 1.83);
        var r = Math.random() * 2.0 - 1.0;
        var vx = Math.random() * 2.0 - 1.0;
        var vy = Math.sqrt(1.0 - (vx * vx));
        velocities.push(vx*0.04, vy*0.04*r/Math.abs(r), 0.925 + Math.random() * 0.02 );
    }
    vertices = new Float32Array( vertices );
    velocities = new Float32Array( velocities );
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(shaderProgram.vertexPosition, 3.0, gl.FLOAT, false, 0, 0);
}

function animate() {
    requestAnimationFrame( animate );
    drawScene();
}

function clearBuffers() {
 
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function integrate () {
    var i, p, bp, tx, ty, inertia;
    for(i = 0; i < numLines; i+=2) {

        bp = i*3;
        // copy old positions
        vertices[bp] = vertices[bp+3];
        vertices[bp+1] = vertices[bp+4];
        
        // inertia
        velocities[bp] *= velocities[bp+2];
        velocities[bp+1] *= velocities[bp+2];
        
        // horizontal
        vertices[bp+3] += velocities[bp];
        
        // vertical
        vertices[bp+4] += velocities[bp+1];

        if(!enable) {
            var dx = centerX - vertices[bp],
            dy = centerY - vertices[bp+1],
            d = Math.sqrt(dx * dx + dy * dy);
            
            if ( d < 5 )
            {
                if ( d < 0.03 )
                {
                    vertices[bp] = (Math.random() * 2 - 1)*ratio;
                    vertices[bp+1] = Math.random() * 2 - 1;
                    vertices[bp+3] = vertices[bp];
                    vertices[bp+4] = vertices[bp+1];
                    velocities[bp] = 0;
                    velocities[bp+1] = 0;
                } else {
                    dx /= d;
                    dy /= d;
                    d = ( 3 - d ) / 2;
                    d *= d;
                    velocities[bp] += dx * d * .01;
                    velocities[bp+1] += dy * d * .01;
                }
            }
        }
    }
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
}

function drawScene() {
    clearBuffers();
    integrate();
    gl.lineWidth(2.6);
    gl.drawArrays( gl.POINTS, 0, numLines );
    gl.drawArrays( gl.LINES, 0, numLines );
    gl.flush();
}

function webGLStart() {
    initGL();
    initShaders();
    initViewingAndTransformation();
    initScene();
    animate();
}