require('../scss/main.scss');

import * as util from './util';

var document = window.document;

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

var canvas = document.getElementById("canvas");
var gl = util.getWebGLContext(canvas);
resize();

var positionProgram = util.program(gl, 'quad.vs', 'update-position.fs');
var velocityProgram = util.program(gl, 'quad.vs', 'update-velocity.fs');
var renderProgram = util.program(gl, 'render.vs', 'render.fs');

var numParticles = 10000;
var statesize = Math.ceil(Math.sqrt(numParticles));
var mouse = new Float32Array([-2, -2]);

var originalPositions = [];
var offsetX = 200;
var offsetY = 100;
for (var i = 0; i < statesize; ++i) {
    for (var j = 0; j < statesize; ++j) {
        originalPositions = originalPositions.concat(encode(
            i * 2 + offsetX,
            j * 2 + offsetY
        ));
    }
}

var currentPositions = [];
for (var i = 0; i < statesize * statesize; ++i) {
    currentPositions = currentPositions.concat(encode(
        Math.floor(Math.random() * window.innerWidth),
        Math.floor(Math.random() * window.innerHeight)
    ))
}

var velocity = [];
for (var i = 0; i < statesize * statesize; ++i) {
    velocity.push(
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
    );
}

var op = util.texture(gl, statesize, statesize, new Uint8Array(originalPositions));
var cp0 = util.texture(gl, statesize, statesize, new Uint8Array(currentPositions));
var cp1 = util.texture(gl, statesize, statesize, null);
var v0 = util.texture(gl, statesize, statesize, new Uint8Array(velocity));
var v1 = util.texture(gl, statesize, statesize, null);

var indexes = new Float32Array(numParticles * 2);
for (var y = 0; y < statesize; y++) {
    for (var x = 0; x < statesize; x++) {
        var i = y * statesize * 2 + x * 2;
        if (i < numParticles * 2) {
            indexes[i + 0] = x;
            indexes[i + 1] = y;
        }
    }
}

var fbo = util.framebuffer(gl);
var buffer = util.buffer(gl);

requestAnimationFrame(loop);

function loop() {
    requestAnimationFrame(loop);

    gl.useProgram(positionProgram);
    op.bind(0, positionProgram.u_org_position);
    cp0.bind(1, positionProgram.u_cur_position);
    v0.bind(2, positionProgram.u_velocity);
    buffer.data(QUAD, positionProgram.a_quad, 2);
    gl.uniform2fv(positionProgram.u_mouse, mouse);
    gl.uniform2fv(positionProgram.u_worldsize, new Float32Array([canvas.width, canvas.height]));
    fbo.bind(cp1);
    gl.viewport(0, 0, statesize, statesize);
    clear();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length / 2);

    gl.useProgram(velocityProgram);
    op.bind(0, velocityProgram.u_org_position);
    cp0.bind(1, velocityProgram.u_cur_position);
    v0.bind(2, velocityProgram.u_velocity);
    buffer.data(QUAD, velocityProgram.a_quad, 2);
    gl.uniform2fv(velocityProgram.u_mouse, mouse);
    gl.uniform2fv(velocityProgram.u_worldsize, new Float32Array([canvas.width, canvas.height]));
    fbo.bind(v1);
    gl.viewport(0, 0, statesize, statesize);
    clear();
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length / 2);

    /*
    var pixels = new Uint8Array(statesize * statesize * 4);
    gl.readPixels(0, 0, statesize, statesize, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    console.log(pixels);
    */

    gl.useProgram(renderProgram);
    cp1.bind(0, renderProgram.u_position);
    buffer.data(indexes, renderProgram.a_index, 2)
    gl.uniform2fv(renderProgram.u_statesize, new Float32Array([statesize, statesize]));
    fbo.unbind();
    gl.viewport(0, 0, canvas.width, canvas.height);
    clear();
    gl.drawArrays(gl.POINTS, 0, numParticles);

    var tmp = cp0;
    cp0 = cp1;
    cp1 = tmp;

    tmp = v0;
    v0 = v1;
    v1 = tmp;
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

document.addEventListener('mousemove', function (evt) {
    const x = evt.pageX / canvas.width * 2 - 1;
    const y = evt.pageY / canvas.height * -2 + 1;
    mouse = new Float32Array([x, y]);
}, false);