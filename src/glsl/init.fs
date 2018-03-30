#ifdef GL_ES
precision highp float;
#endif

varying vec2 v_position;
uniform vec2 u_worldsize;

vec4 encode(vec2 data) {
    return vec4(
        fract(data * 255.0),
        floor(data * 255.0) / 255.0
    );
}

void main() {
    vec2 pos = v_position;
    float px = pos.x / u_worldsize.x;
    pos.y /= u_worldsize.x / u_worldsize.y;
    pos.y = u_worldsize.y - pos.y;
    float py = pos.y / pos.y;
    gl_FragColor = encode(vec2(px, py));
}