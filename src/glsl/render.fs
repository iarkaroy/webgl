#ifdef GL_ES
precision highp float;
#endif
#extension GL_EXT_shader_texture_lod : enable
#extension GL_OES_standard_derivatives : enable

void main() {
    float r = 0.0, delta = 0.0, alpha = 1.0;
    /*
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    r = dot(cxy, cxy);
    #ifdef GL_OES_standard_derivatives
        delta = fwidth(r);
        alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    #endif
    */
    gl_FragColor = vec4(0.0,0.8,1.0,1.0) * alpha;
}