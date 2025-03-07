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
  }
});

// Mesh
const mesh = new THREE.Mesh(geometry, material);
scene.add(mesh);



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
const mouse = new THREE.Vector2();
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
  const intersects = raycaster.intersectObject(mesh);

  if(intersects.length > 0){
    // ぶつかったオブジェクトに対してなんかする
    // 交差した位置をログに出力
    // console.log("交差位置:", intersects[0].point);
        
    // 3D座標をmeshのローカル座標系に変換
    const localPoint = mesh.worldToLocal(intersects[0].point.clone());

    // ローカル座標を使用して2D座標を計算
    const canvas_x = (localPoint.x * 10 + sizes.width * window.devicePixelRatio / 2);
    const canvas_y = -(localPoint.y * 10 - sizes.height * window.devicePixelRatio / 2);
    material.uniforms.uLocalPoint.value = localPoint;
    // console.log(material.uniforms.uLocalPoint);
  }

});








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
/**
 * Animate
 */
const clock = new THREE.Clock();

const animate = () => {
  //時間取得
  const elapsedTime = clock.getElapsedTime();
  material.uniforms.uTime.value = elapsedTime;
  controls.update();

  renderer.render(scene, camera);




  window.requestAnimationFrame(animate);
};

animate();