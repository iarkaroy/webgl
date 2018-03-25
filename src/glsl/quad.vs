#ifdef GL_ES
precision highp float;
#endif

attribute vec2 a_quad;
varying vec2 v_index;

void main() {
    v_index = (a_quad + 1.0) / 2.0;
    gl_Position = vec4(a_quad, 0, 1);
}