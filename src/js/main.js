require('../scss/main.scss');

import * as util from './util';
import Pixel from './pixel';

var document = window.document;

const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

var pixels = [];

var canvas = document.getElementById("canvas");
var gl = util.getWebGLContext(canvas);

var positionProgram = util.program(gl, 'quad.vs', 'update-position.fs');
var velocityProgram = util.program(gl, 'quad.vs', 'update-velocity.fs');
var renderProgram = util.program(gl, 'render.vs', 'render.fs');
var screenProgram = util.program(gl, 'quad.vs', 'screen.fs');

var numParticles, statesize;
var mouse = new Float32Array([-2, -2]);

var originalPositions = [], currentPositions = [], velocity = [];

var op, cp0, cp1, v0, v1, screenTexture, backgroundTexture;

var indexes;

var fbo = util.framebuffer(gl);
var buffer = util.buffer(gl);

resize();

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

    
    fbo.bind(screenTexture);
    clear();
    gl.useProgram(screenProgram);
    backgroundTexture.bind(0, screenProgram.u_screen);
    buffer.data(QUAD, screenProgram.a_quad, 2);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length / 2);
    
    gl.useProgram(renderProgram);
    cp1.bind(0, renderProgram.u_position);
    buffer.data(indexes, renderProgram.a_index, 2)
    gl.uniform2fv(renderProgram.u_statesize, new Float32Array([statesize, statesize]));
    gl.uniform2fv(renderProgram.u_worldsize, new Float32Array([canvas.width, canvas.height]));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.drawArrays(gl.POINTS, 0, numParticles);

    gl.useProgram(screenProgram);
    screenTexture.bind(0, screenProgram.u_screen);
    buffer.data(QUAD, screenProgram.a_quad, 2);
    fbo.unbind();
    gl.viewport(0, 0, canvas.width, canvas.height);
    clear();
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, QUAD.length / 2);
    gl.disable(gl.BLEND);

    var tmp = cp0;
    cp0 = cp1;
    cp1 = tmp;

    tmp = v0;
    v0 = v1;
    v1 = tmp;

    tmp = screenTexture;
    screenTexture = backgroundTexture;
    backgroundTexture = tmp;
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    getTextPixels('Hello!');
}

function clear() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

function encode(x, y) {
    var cw = canvas.width;
    var ch = canvas.height;
    var px = x / cw;
    y /= cw / ch;
    y = ch - y;
    var py = y / ch;
    var r = (px * 255) - Math.floor(px * 255);
    var b = Math.floor(px * 255) / 255;
    var g = (py * 255) - Math.floor(py * 255);
    var a = Math.floor(py * 255) / 255;
    return [
        Math.floor(r * 256),
        Math.floor(g * 256),
        Math.floor(b * 256),
        Math.floor(a * 256)
    ];
}

document.addEventListener('mousemove', function (evt) {
    const x = evt.pageX / canvas.width * 2 - 1;
    const y = evt.pageY / canvas.height * -2 + 1;
    mouse = new Float32Array([x, y]);
}, false);

window.addEventListener('resize', resize, false);

function getTextPixels(text) {
    var cvs = document.createElement('canvas');
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    var ctx = cvs.getContext('2d');
    var fontSize = Math.floor(window.innerWidth / 8);
    if (fontSize > 120) fontSize = 120;
    ctx.textBaseline = 'top';
    ctx.font = `bold ${fontSize}px arial`;
    ctx.fillText(text, 0, 0);
    var metrics = ctx.measureText(text);
    var width = Math.ceil(metrics.width);
    var data = ctx.getImageData(0, 0, width, Math.ceil(fontSize * 1.2));
    var tw = data.width,
        th = data.height;
    var buff = new Uint32Array(data.data.buffer);
    for (var y = 0; y < th; y += 1) {
        for (var x = 0; x < tw; x += 1) {
            var index = y * tw + x;
            if (buff[index] > 0) {
                pixels.push(new Pixel(x, y, buff[index]));
            }
        }
    }
    setup(tw, th);
}

function setup(textWidth, textHeight) {

    var t0 = performance.now();

    numParticles = pixels.length;
    statesize = Math.ceil(Math.sqrt(numParticles));
    var statesize2 = statesize * statesize;

    var cw = canvas.width;
    var ch = canvas.height;
    var offsetX = (canvas.width - textWidth) / 2;
    var offsetY = (canvas.width - textHeight) / 2;

    originalPositions = [];
    for (var i = 0; i < statesize2; ++i) {
        var x = pixels[i] ? pixels[i].x : 0;
        var y = pixels[i] ? pixels[i].y : 0;
        originalPositions = originalPositions.concat(encode(
            x + offsetX,
            y + offsetY
        ));
    }

    var t1 = performance.now();

    currentPositions = [];
    for (var i = 0; i < statesize2; ++i) {
        currentPositions.push(
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256),
            Math.floor(Math.random() * 256)
        );
    }

    var t2 = performance.now();

    velocity = [];
    for (var i = 0; i < statesize2; ++i) {
        velocity.push(
            Math.floor(Math.random() * 20 + 118),
            Math.floor(Math.random() * 20 + 118),
            Math.floor(Math.random() * 20 + 118),
            Math.floor(Math.random() * 20 + 118)
        );
    }

    var t3 = performance.now();

    op = util.texture(gl, statesize, statesize, new Uint8Array(originalPositions));
    cp0 = util.texture(gl, statesize, statesize, new Uint8Array(currentPositions));
    cp1 = util.texture(gl, statesize, statesize, null);
    v0 = util.texture(gl, statesize, statesize, new Uint8Array(velocity));
    v1 = util.texture(gl, statesize, statesize, null);
    screenTexture = util.texture(gl, cw, ch, new Uint8Array(cw * ch * 4));
    backgroundTexture = util.texture(gl, cw, ch, new Uint8Array(cw * ch * 4));

    indexes = new Float32Array(numParticles * 2);
    for (var y = 0; y < statesize; y++) {
        for (var x = 0; x < statesize; x++) {
            var i = y * statesize * 2 + x * 2;
            if (i < numParticles * 2) {
                indexes[i + 0] = x;
                indexes[i + 1] = y;
            }
        }
    }

    var t4 = performance.now();
    console.log('originalPositions', t1 - t0);
    console.log('currentPositions', t2 - t1);
    console.log('velocity', t3 - t2);
    console.log('indexes', t4 - t3);
    console.log('total', t4 - t0);

    requestAnimationFrame(loop);
}