//fragmentShader
uniform float uParticleNumber;
uniform float uTime;
varying vec2 vTexcoord;
uniform sampler2D uTexture;
uniform vec3 uLocalPoint;
// 500個の緑の点（右半分）
vec2 greenPos[500]; // 緑の点の位置を保持する配列
// ランダム関数
float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
// 衝突検知のための範囲
float collisionRadius = 0.2;
void main() {
    vec2 uv = vTexcoord * 10.0 - vec2(5.0, 5.0);  // 平面を [-5, 5] の範囲にマッピング
    vec3 color = vec3(0.0);  // 背景は黒

    vec2 dotPos = uLocalPoint.xy * 10.0;
    float dist = length(uv - dotPos);
    if (dist < 0.05) {  // 点のサイズ（半径0.05）
        color = vec3(1.0, 0.0, 0.0);  // 赤
        gl_FragColor = vec4(color, 1.0);  // 点の色を設定
    } else {
        vec4 textureColor = texture2D(uTexture, vTexcoord);
        gl_FragColor = textureColor;
    }
}