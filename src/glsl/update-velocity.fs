#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_org_position;
uniform sampler2D u_cur_position;
uniform sampler2D u_velocity;
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
    vec2 o_position = decode(texture2D(u_org_position, v_index)) * 2.0 - 1.0;
    vec2 c_position = decode(texture2D(u_cur_position, v_index)) * 2.0 - 1.0;
    float dist = distance(o_position, c_position);
    float force = dist * 0.01;
    float angle = atan(o_position.y - c_position.y, o_position.x - c_position.x);
    vec2 velocity = decode(texture2D(u_velocity, v_index)) * 2.0 - 1.0;
    float mouse_force = 0.0;
    float mouse_angle = 0.0;
    if(u_mouse.x > -2. && u_mouse.y > -2.) {
        float mouse_dist = distance(c_position, u_mouse);
        mouse_force = min(0.003/(mouse_dist * mouse_dist),0.003);
        mouse_angle = atan(c_position.y - u_mouse.y, c_position.x - u_mouse.x);
    }
    velocity.x += force * cos(angle) + mouse_force * cos(mouse_angle);
    velocity.y += force * sin(angle) + mouse_force * sin(mouse_angle);
    velocity *= 0.92;
    gl_FragColor = encode((velocity + 1.0) / 2.0);
}