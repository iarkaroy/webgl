#ifdef GL_ES
precision highp float;
#endif

attribute vec2 a_index;
uniform sampler2D u_position;
uniform sampler2D u_displacement;
uniform vec2 u_statesize;

vec2 decode(vec4 data) {
    return vec2(
        data.r / 255.0 + data.b,
        data.g / 255.0 + data.a
    );
}

void main() {
    vec2 position = decode(texture2D(u_position, a_index / u_statesize));
    vec2 displacement = decode(texture2D(u_displacement, a_index)) * 2.0 - 1.0;
    // displacement /= 1.0;
    position += displacement;
    gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
    gl_PointSize = 2.0;
}