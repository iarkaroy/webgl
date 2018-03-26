#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_position;
uniform sampler2D u_displacement;
uniform vec2 u_mouse;
varying vec2 v_index;

vec2 decode(vec4 data) {
    return vec2(
        data.r / 255.0 + data.b,
        data.g / 255.0 + data.a
    );
}

vec4 encode(vec2 data) {
    return vec4(
        fract(data * 255.0),
        floor(data * 255.0) / 255.0
    );
}

void main() {
    vec2 position = decode(texture2D(u_position, v_index)) * 2.0 - 1.0;
    vec2 displacement = decode(texture2D(u_displacement, v_index)) * 2.0 - 1.0;
    float dist = distance(position, u_mouse);
    if(dist < 0.1) {
        displacement = normalize(position - u_mouse) / 10.0;
    } else {
        displacement *= 0.95;
    }
    // displacement *= 0.95;
    gl_FragColor = encode((displacement + 1.0) / 2.0);
}