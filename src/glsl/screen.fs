#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_screen;
uniform float u_opacity;
varying vec2 v_index;

void main() {
    vec4 color = texture2D(u_screen, v_index);
    gl_FragColor = vec4(floor(255.0 * color * u_opacity) / 255.0);
}