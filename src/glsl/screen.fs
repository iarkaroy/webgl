#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_screen;
varying vec2 v_index;

void main() {
    vec4 color = texture2D(u_screen, v_index);
    gl_FragColor = vec4(floor(255.0 * color * 0.95) / 255.0);
}