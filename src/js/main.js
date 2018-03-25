require('../scss/main.scss');

import * as util from './util';

var document = window.document;

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

var canvas = document.getElementById("canvas");
var gl = util.getWebGLContext(canvas);
resize();

var updateProgram = util.program(gl, 'quad.vs', 'update.fs');
var renderProgram = util.program(gl, 'render.vs', 'render.fs');

var width = 10,
    height = 10;

var positions = [];
for (var i = 0; i < width * height; ++i) {
    positions = positions.concat(encode(
        Math.floor(Math.random() * window.innerWidth),
        Math.floor(Math.random() * window.innerHeight)
    ))
}

var displacements = [];
for (var i = 0; i < width * height; ++i) {
    displacements.push(
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
    );
}

var p0 = util.texture(gl, width, height, new Uint8Array(positions));
var d0 = util.texture(gl, width, height, new Uint8Array(displacements));
var d1 = util.texture(gl, width, height, null);

var indexes = new Float32Array(width * height * 2);
for (var y = 0; y < height; y++) {
    for (var x = 0; x < width; x++) {
        var i = y * width * 2 + x * 2;
        indexes[i + 0] = x;
        indexes[i + 1] = y;
    }
}

var fbo = util.framebuffer(gl);
var buffer = util.buffer(gl);

requestAnimationFrame(loop);

function loop() {
    requestAnimationFrame(loop);

    gl.useProgram(updateProgram);
    d0.bind(0, updateProgram.u_displacement);
    buffer.data(QUAD, updateProgram.a_quad, 2);
    fbo.bind(d1);
    gl.viewport(0, 0, width, height);
    clear();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length / 2);

    /* var pixels = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log(pixels); */

    gl.useProgram(renderProgram);
    p0.bind(0, renderProgram.u_position);
    d1.bind(1, renderProgram.u_displacement);
    buffer.data(indexes, renderProgram.a_index, 2)
    gl.uniform2fv(renderProgram.u_statesize, new Float32Array([width, height]));
    fbo.unbind();
    gl.viewport(0, 0, canvas.width, canvas.height);
    clear();
    gl.drawArrays(gl.POINTS, 0, width * height);

    var tmp = d0;
    d0 = d1;
    d1 = tmp;
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function clear() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function encode(x, y) {
    var px = x / window.innerWidth;
    y = window.innerHeight - y;
    var py = y / window.innerHeight;
    var r = (px * 255) - Math.floor(px * 255);
    var b = Math.floor(px * 255) / 255;
    var g = (py * 255) - Math.floor(py * 255);
    var a = Math.floor(py * 255) / 255;
    return [
        Math.floor(r * 255),
        Math.floor(g * 255),
        Math.floor(b * 255),
        Math.floor(a * 255)
    ];
}