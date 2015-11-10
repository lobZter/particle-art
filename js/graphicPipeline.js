var gl,
    shaderProgram,
    vertices,
    velocities,
    ratio,
    numLines = 100000;

function initGL() {  
    //    Get the WebGL context
    var canvas = document.getElementById("webGLCanvas");
    gl = gl = canvas.getContext('webgl') || canvas.getContext("experimental-webgl");
    //    Check whether the WebGL context is available or not
    //    if it's not available exit
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
    //    Load the vertex shader that's defined in a separate script
    //    block at the top of this page.
    //    More info about shaders: http://en.wikipedia.org/wiki/Shader_Model
    //    More info about GLSL: http://en.wikipedia.org/wiki/GLSL
    //    More info about vertex shaders: http://en.wikipedia.org/wiki/Vertex_shader

    //    Grab the script element
    var vertexShaderScript = document.getElementById("shader-vs");
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderScript.text);
    gl.compileShader(vertexShader);
    if(!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        alert("Couldn't compile the vertex shader");
        gl.deleteShader(vertexShader);
        return;
    }
    
    //    Load the fragment shader that's defined in a separate script
    //    More info about fragment shaders: http://en.wikipedia.org/wiki/Fragment_shader
    var fragmentShaderScript = document.getElementById("shader-fs");
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderScript.text);
    gl.compileShader(fragmentShader);
    if(!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        alert("Couldn't compile the fragment shader");
        gl.deleteShader(fragmentShader);
        return;
    }

    //    Create a shader program.
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
    //    Install the program as part of the current rendering state
    gl.useProgram(shaderProgram);
    //    Get the vertexPosition attribute from the shader program
    shaderProgram.vertexPosition = gl.getAttribLocation(shaderProgram, "vertexPosition");
    //     Get the location of the "perspectiveMatrix" uniform variable from the 
    //     shader program
    shaderProgram.perspectiveMatrix = gl.getUniformLocation(shaderProgram, "perspectiveMatrix");
    //     Get the location of the "modelViewMatrix" uniform variable from the 
    //     shader program
    shaderProgram.modelViewMatrix = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
    //    Enable the vertexPosition vertex attribute array. If enabled, the array
    //    will be accessed an used for rendering when calls are made to commands like
    //    gl.drawArrays, gl.drawElements, etc.
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

    //     Create the perspective matrix. The OpenGL function that's normally used for this,
    //     glFrustum() is not included in the WebGL API. That's why we have to do it manually here.
    //     More info: http://www.cs.utk.edu/~vose/c-stuff/opengl/glFrustum.html
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

    //     Create the modelview matrix
    //     More info about the modelview matrix: http://3dengine.org/Modelview_matrix
    //     More info about the identity matrix: http://en.wikipedia.org/wiki/Identity_matrix
    var modelViewMatrix = [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];

    //     Set the values
    gl.uniformMatrix4fv(shaderProgram.perspectiveMatrix, false, new Float32Array(perspectiveMatrix));
    gl.uniformMatrix4fv(shaderProgram.modelViewMatrix, false, new Float32Array(modelViewMatrix));
}

function initScene() {
    //    Now create a shape.
    //    Specify the vertex positions (x, y, z)
    vertices = [];
    var numHeight = 80, numWidth = 160;

    for (var i = 0; i < numWidth; i++) {
        for(var j = 0; j < numHeight; j++) {
            var offset_x = ( (i - numWidth/2) / 20);
            var offset_y = ( (j - numHeight/2) / 20 );
                
            vertices.push(offset_x, offset_y, 3.0 - offset_x*offset_x/3);

        }
    }
console.log(vertices);
    vertices = new Float32Array( vertices );

    //    First create a vertex position buffer in which we can store our data.
    var vertexPositionBuffer = gl.createBuffer();
    //    Bind the buffer object to the ARRAY_BUFFER target.
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW); 
    //    Specify the location and format of the vertex position attribute
    gl.vertexAttribPointer(shaderProgram.vertexPosition, 3.0, gl.FLOAT, false, 0, 0);
    clearBuffers();
    // gl.lineWidth(2.6);
    gl.drawArrays( gl.POINTS, 0, vertices.length / 3 );
    gl.flush();
}

function animate() {
    requestAnimationFrame( animate );
    drawScene();
}

function clearBuffers() {
    //    Clear the color buffer (r, g, b, a) with the specified color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    //    Clear the depth buffer. The value specified is clamped to the range [0,1].
    //    More info about depth buffers: http://en.wikipedia.org/wiki/Depth_buffer
    gl.clearDepth(1.0);
    //    Enable depth testing. This is a technique used for hidden surface removal.
    //    It assigns a value (z) to each pixel that represents the distance from this
    //    pixel to the viewer. When another pixel is drawn at the same location the z
    //    values are compared in order to determine which pixel should be drawn.
    //gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.DEPTH_TEST);
    //    Specify which function to use for depth buffer comparisons. It compares the
    //    value of the incoming pixel against the one stored in the depth buffer.
    //    Possible values are (from the OpenGL documentation):
    //    GL_NEVER - Never passes.
    //    GL_LESS - Passes if the incoming depth value is less than the stored depth value.
    //    GL_EQUAL - Passes if the incoming depth value is equal to the stored depth value.
    //    GL_LEQUAL - Passes if the incoming depth value is less than or equal to the stored depth value.
    //    GL_GREATER - Passes if the incoming depth value is greater than the stored depth value.
    //    GL_NOTEQUAL - Passes if the incoming depth value is not equal to the stored depth value.
    //    GL_GEQUAL - Passes if the incoming depth value is greater than or equal to the stored depth value.
    //    GL_ALWAYS - Always passes.                        
    //gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    //    Clear the color buffer and the depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}


function webGLStart() {
    initGL();
    initShaders();
    initViewingAndTransformation();
    initScene();
}