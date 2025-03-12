//fragmentShader
uniform float uParticleNumber;
uniform float uTime;
varying vec2 vTexcoord;
uniform sampler2D uTexture;
uniform vec3 uLocalPoint;
uniform float uRate;
uniform float uMaxDist;
// 500個の緑の点（右半分）
vec2 greenPos[500]; // 緑の点の位置を保持する配列
// ランダム関数
float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
// 衝突検知のための範囲
float collisionRadius = 0.2;
void main() {
    // vec3 color = vec3(0.0);  // 背景は黒

    // vec2 dotPos = uLocalPoint.xy;
    // // float dist = length(uv - dotPos);
    // float dist = length(vTexcoord - dotPos);
    // if (dist < uMaxDist && dist >= 0.0001) {  // 点のサイズ（半径0.05）
    //     // color = vec3(1.0, 1.0, 0.0);  // 赤
    //     // gl_FragColor = vec4(color, 1.0);  // 点の色を設定
    //     vec2 newCord = vTexcoord;
    //     // uLocalPoint.x, vTexcoord.x, uLocalPoint.y: $SPC, vTexcoord.y: $MAX

    //     float dx = (vTexcoord.x - uLocalPoint.x);
    //     float dy = (vTexcoord.y - uLocalPoint.y); 
    //     float paramX = abs(dx/dist);
    //     float paramY = abs(dy/dist);
    //     float powNum = 1.0;
    //     float rateSpecial = 1.0 - pow((uMaxDist-dist)/uMaxDist, uRate);
    //     float beta =  dy / dx;

    //     float idea = (1.0 - dist) * 0.1;




    //     newCord.x = vTexcoord.x;
    //     if(vTexcoord.x > uLocalPoint.x) {
    //         newCord.x = uLocalPoint.x + rateSpecial * dist * dx / dist ;
    //     } else {
    //         newCord.x = uLocalPoint.x + rateSpecial * dist * dx / dist ;
    //     }
    //     newCord.y = vTexcoord.y;
    //     if(vTexcoord.y > uLocalPoint.y) {
    //         newCord.y = uLocalPoint.y + rateSpecial * dist * dy / dist ;
    //     } else {
    //         newCord.y = uLocalPoint.y + rateSpecial * dist * dy / dist ;
    //     }

    //     //         uLocalPoint.xy
                
    //     // (1.0 - dist) *  (vTexcoord.y - uLocalPoint.y)/dist

    //     //         (2, 2)  (x, y)

    //     vec4 textureColor = texture2D(uTexture, newCord);
    //     gl_FragColor = textureColor;
    // } else {
    //     vec4 textureColor = texture2D(uTexture, vTexcoord);
    //     gl_FragColor = textureColor;
    // }

    vec4 textureColor = texture2D(uTexture, vTexcoord);
    gl_FragColor = textureColor;
}