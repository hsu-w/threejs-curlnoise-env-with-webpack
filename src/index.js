import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as dat from "lil-gui";
import vertexShader from "./shaders/vertexShader";
import fragmentShader from "./shaders/fragmentShader";
import skyImage from "./textures/sky.jpg";

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};


const mouse = new THREE.Vector2();

// Canvas
const canvas = document.querySelector(".webgl");

// Scene
const scene = new THREE.Scene();

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader();
const skyTexture = textureLoader.load(skyImage);


// Geometry
const geometry = new THREE.PlaneGeometry(1, 1, 32, 32);

// Material
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  transparent: true,
  side: THREE.DoubleSide,
  // wireframe: true
  uniforms: {
    uTime: {
      value: 0
    },
    uParticleNumber: {
      value: 100
    },
    uTexture: {
      value: skyTexture
    },
    uMouseX: {
      value: 0
    },
    uMouseZ: {
      value: 0
    },
    uLocalPoint: {
      value: new THREE.Vector3(0, 0, 0),
    },
    uRate: {
      value: 2.0,
    },
    uMaxDist: {
      value: 0.5,
    },
  }
});

// Mesh
const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);



// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  sizes.width / sizes.height,
  0.1,
  100
);
camera.position.set(0, 0, 1);
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

const raycaster = new THREE.Raycaster();
// 原点を決める
const rayOrigin = new THREE.Vector3(0, 0, 0);
// 向きを決める
const rayDirection = new THREE.Vector3(0, 0, 0);
// 正規化する
rayDirection.normalize();
// セット
raycaster.set(rayOrigin, rayDirection);
//カーソルの位置を取得してみよう
const cursor = {};
const cursorPre = {};
cursor.x = 0;
cursor.y = 0;
cursorPre.x = 0;
cursorPre.y = 0;


const gui = new dat.GUI({
  width: 300
});
//デバッグ
gui
  .add(material.uniforms.uRate, "value")
  .min(0.001)
  .max(5)
  .step(0.001)
  .name("uRate");
gui
  .add(material.uniforms.uMaxDist, "value")
  .min(0.1)
  .max(0.8)
  .step(0.1)
  .name("uMaxDist");




/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

window.addEventListener("resize", () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});







// シミュレーション用のテクスチャ解像度
const SIM_RESOLUTION = 256 * 4; 

// 速度（velocity）用のフレームバッファ
let velocityA = new THREE.WebGLRenderTarget(SIM_RESOLUTION, SIM_RESOLUTION, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
});
let velocityB = velocityA.clone(); // ダブルバッファ




const velocityMaterial = new THREE.ShaderMaterial({
  fragmentShader: `precision highp float;
  uniform sampler2D velocityTexture;
  uniform vec2 mouse;
  uniform float dt;
  uniform vec2 resolution;
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 velocity =  texture2D(velocityTexture,uv).xy;
    float dist = length(uv - mouse);
    vec2 force = 20.0 * normalize(uv - mouse) * exp(-dist * 20.0);
    velocity += force * dt;
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }`,
  uniforms: {
    velocityTexture: { value: new THREE.Vector2(0.0, 0.0) },
    mouse: { value: new THREE.Vector2(-1.0, -1.0) },
    dt: { value: 0.016 },
    resolution: { value: new THREE.Vector2(SIM_RESOLUTION, SIM_RESOLUTION) },
  },
});

let baseSize = 10.0;

// 描画用のオブジェクト
const velocityPass = new THREE.Mesh(
  new THREE.PlaneGeometry(baseSize, baseSize),
  velocityMaterial
);
const velocityScene = new THREE.Scene();
velocityScene.add(velocityPass);
const velocityCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// シミュレーションの更新
function updateVelocity(renderer) {
  renderer.setRenderTarget(velocityB);
  renderer.render(velocityScene, velocityCamera);
  renderer.setRenderTarget(null);

  // ダブルバッファの切り替え
  [velocityA, velocityB] = [velocityB, velocityA];
  velocityMaterial.uniforms.velocityTexture.value = velocityA.texture;
}

// **FBO（レンダーターゲット）の作成**
const fboSize = SIM_RESOLUTION;
const renderTarget = new THREE.WebGLRenderTarget(fboSize, fboSize);

// **FBO用のシーンとカメラ**
const fboScene = new THREE.Scene();
const fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1);
fboCamera.position.z = 1;

// **FBOにレンダリングするオブジェクト**
const fboMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const debugMaterial = new THREE.ShaderMaterial({
  fragmentShader: `
//version 300 es
precision highp float;

uniform sampler2D velocityTexture;
uniform vec2 resolution;
// out vec4 fragColor; // WebGL2 では gl_FragColor は使えない

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;
    vec2 velocity = texture(velocityTexture, uv).xy; // WebGL2 では texture() を使う

    // 速度を 0 ~ 1 にマッピング
    vec3 color = vec3(velocity * 0.5 + 0.5, 0.0);

    gl_FragColor = vec4(color, 1.0); // WebGL2 では fragColor に出力
}
  `,
  uniforms: {
    texture: { value: velocityA.texture },
    resolution: { value: new THREE.Vector2(fboSize, fboSize) },
  },
});

// const fboPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fboMaterial);
const fboPlane = new THREE.Mesh(new THREE.PlaneGeometry(baseSize, baseSize), debugMaterial);
fboScene.add(fboPlane);

// **メインシーンのオブジェクト（FBOのテクスチャを適用）**
const mainMaterial = new THREE.MeshBasicMaterial({ map: renderTarget.texture });
const mainPlane = new THREE.Mesh(new THREE.PlaneGeometry(baseSize, baseSize), mainMaterial);
scene.add(mainPlane);

// **カメラの位置**
camera.position.z = 3;

function debugRender(renderer) {
 // **FBOへのレンダリング**
 renderer.setRenderTarget(renderTarget);
 renderer.render(fboScene, fboCamera);
 renderer.setRenderTarget(null);
}





window.addEventListener("mousemove", (event) => {
  // cursor.x = 2 * (event.clientX / sizes.width - 0.5);
  // cursor.y = 2 * (event.clientY / sizes.height - 0.5);

  const element = event.currentTarget;
  // canvas要素上のXY座標
  const x = event.clientX;
  const y = event.clientY;
  // canvas要素の幅・高さ
  const w = sizes.width;
  const h = sizes.height;

  // -1〜+1の範囲で現在のマウス座標を登録する
  mouse.x = ( x / w ) * 2 - 1;
  mouse.y = -( y / h ) * 2 + 1;
  // console.log(mouse);

  // レイキャスト = マウス位置からまっすぐに伸びる光線ベクトルを生成
  raycaster.setFromCamera(mouse, camera);
  // その光線とぶつかったオブジェクトを得る
  const intersects = raycaster.intersectObject(mainPlane);

  if(intersects.length > 0){
    // ぶつかったオブジェクトに対してなんかする
    // 交差した位置をログに出力
    // console.log("交差位置:", intersects[0].point);
        
    // 3D座標をmainPlaneのローカル座標系に変換
    let localPoint = mainPlane.worldToLocal(intersects[0].point.clone());

    localPoint.x =  (1/baseSize) * (localPoint.x + baseSize / 2);

    localPoint.y =  (1/baseSize) * (localPoint.y + baseSize / 2);
    // ローカル座標を使用して2D座標を計算
    const canvas_x = (localPoint.x * 10 + sizes.width * window.devicePixelRatio / 2);
    const canvas_y = -(localPoint.y * 10 - sizes.height * window.devicePixelRatio / 2);
    material.uniforms.uLocalPoint.value = localPoint;
    velocityMaterial.uniforms.mouse.value.set(localPoint.x, localPoint.y);
    console.log(localPoint.x,localPoint.y);
  }

});







/**
 * Animate
 */
const clock = new THREE.Clock();

const animate = () => {
  //時間取得
  const elapsedTime = clock.getElapsedTime();
  material.uniforms.uTime.value = elapsedTime;
  controls.update();


  // **FBOへのレンダリング**
  updateVelocity(renderer);
  debugRender(renderer);


  // **メインシーンを描画**
  renderer.render(scene, camera);

  window.requestAnimationFrame(animate);
};

animate();








