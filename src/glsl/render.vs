#ifdef GL_ES
precision highp float;
#endif

attribute vec2 a_index;
uniform sampler2D u_position;
uniform vec2 u_statesize;
uniform vec2 u_worldsize;
uniform mat4 u_modelview;
uniform mat4 u_projection;

vec2 decode(vec4 data) {
    return vec2(
        data.r / 255.0 + data.b,
        data.g / 255.0 + data.a
    );
}

void main() {
    vec2 position = decode(texture2D(u_position, a_index / u_statesize)) * 2.0 - 1.0;
    position.y *= u_worldsize.x / u_worldsize.y;
    gl_Position = vec4(position, 0.0, 1.0);
    gl_PointSize = 2.0;
}