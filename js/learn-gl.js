"use strict"

var gl;

function initGL(canvas) {
  try {
    gl = canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch (e) {
  }
  if (!gl) {
    alert("Could not initialise WebGL, sorry :-(");
  }
}

function getShader(gl, id) {
  var shaderScript = document.getElementById(id);
  if (!shaderScript) {
    return null;
  }

  //XXX console.log(id+': ');
  //XXX console.log(shaderScript);

  var str = "";
  var k = shaderScript.firstChild;
  while (k) {
    if (k.nodeType == 3) {
      str += k.textContent;
    }
    k = k.nextSibling;
  }
  //XXX console.log(str)

  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;
  }

  gl.shaderSource(shader, str);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}


var shaderProgram;

function initShaders() {
  var fragmentShader = getShader(gl, 'shader-fs');
  var vertexShader = getShader(gl, 'shader-vs');

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

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



var triangleVertexPositionBuffer;
var squareVertexPositionBuffer;

function initBuffers() {
  triangleVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  var vertices = [
    0.0,  1.0,  0.0,
    -1.0, -1.0,  0.0,
    1.0, -1.0,  0.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  triangleVertexPositionBuffer.itemSize = 3;
  triangleVertexPositionBuffer.numItems = 3;

  squareVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  vertices = [
    1.0,  1.0,  -3.0,
    -1.0,  1.0,  -3.0,
    1.0, -1.0,  -2.0,
    -1.0, -1.0,  -1.0
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  squareVertexPositionBuffer.itemSize = 3;
  squareVertexPositionBuffer.numItems = 4;
}


function drawScene() {
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  mat4.identity(mvMatrix);

  mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);


  mat4.translate(mvMatrix, [3.0, 0.0, 0.0]);
  gl.bindBuffer(gl.ARRAY_BUFFER, squareVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, squareVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);
  setMatrixUniforms();
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, squareVertexPositionBuffer.numItems);
}

function Variable(txt) {
  this.text = txt;
}

function fibTest() {
  var numIter = 10;
  var ls = {
    alphabet: { A: new Variable('A'),
                B: new Variable('B')
    },
    constants: {},
    start: 'A',
    rules: { A: ['AB', 1.0],
             B: ['A',  1.0]
    }
  };
  //XXX console.log(ls);
  var outputDiv = document.getElementById('canvas-padding');
  $('div#canvas-padding').append(ls.start);

  var buffer = [ls.start];
  for (var i = 0; i < numIter; ++i) {
    var newBuffer = [];
    buffer.forEach(function (x) {
      //XXX console.log('processing \''+x+'\'');
      var match = '';
      var begin = 0;
      // try increasing length substrings until one matches
      for (var j = 1; j <= x.length; ++j) {
        //XXX console.log(x.substring(begin, j));
        var substr = x.substring(begin, j);
        var token = ls.alphabet[substr]
        if (token && ls.rules[token.text]) {
          //XXX console.log('substring match \''+substr+'\'');
          var product = ls.rules[token.text][0];
          newBuffer.push(product);
          // update the new beginning of substring
          begin = j;
        }
      }
    });
    //outputDiv.innerHTML = outputDiv.innerHTML + '\n' + newBuffer.join(' ');
    $('div#canvas-padding').append('<br/>' + newBuffer.join(' '));
    buffer = newBuffer;
  }
}

function runLSystemTest() {
  fibTest();
}

function webGLStart() {
  var canvas = document.getElementById("lesson01-canvas");
  initGL(canvas);
  initShaders();
  initBuffers();

  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  drawScene();
}

function start() {
  var editor = ace.edit("editor");
  editor.setTheme("ace/theme/monokai");
  editor.getSession().setMode("ace/mode/javascript");

  var generatorEditor = ace.edit("generator-editor");
  generatorEditor.setTheme("ace/theme/monokai");
  generatorEditor.getSession().setMode("ace/mode/javascript");
  generatorEditor.getSession().on("change", function() {
      runLSystemTest();
    }
  );

  webGLStart();

  runLSystemTest();
}

