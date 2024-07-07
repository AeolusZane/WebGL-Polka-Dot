// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");
const Random = require("canvas-sketch-util/random");

const canvasSketch = require("canvas-sketch");

const glsl = require('glslify')

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl"
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("#fff", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const geometry = new THREE.SphereGeometry(1, 32, 16);
  const circleGeom = new THREE.CircleGeometry(1,32);

  const baseGeom = new THREE.IcosahedronGeometry(1, 1);
  // get points of icosahedron
  // warning: 新版本用position代替vertices
  const positionAttribute = baseGeom.getAttribute('position');

  // create a set to store unique points
  const uniquePointsSet = new Set();

  // create an array to store unique Vector3 objects
  const uniquePoints = [];

  // iterate through the position attribute and extract unique vertices
  for (let i = 0; i < positionAttribute.count; i++) {
      const vertex = new THREE.Vector3();
      vertex.fromBufferAttribute(positionAttribute, i);

      // create a unique key for each vertex
      const key = `${vertex.x},${vertex.y},${vertex.z}`;

      if (!uniquePointsSet.has(key)) {
          uniquePointsSet.add(key);
          uniquePoints.push(vertex);
      }
  }


  uniquePoints.forEach(point => {
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color('black'),
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(circleGeom, material);
    mesh.position.copy(point);
    // mesh.scale.setScalar(Random.range(0.25, 1)*0.18);

    mesh.scale.setScalar(Random.gaussian()*0.15);
    mesh.lookAt(new THREE.Vector3());
    scene.add(mesh);
  });

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    void main(){
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `
  const fragmentShader = glsl(/* glsl */`
    #pragma glslify: noise = require('glsl-noise/simplex/3d');
    varying vec2 vUv;
    uniform vec3 color;
    uniform float time;
    void main(){
      gl_FragColor = vec4(color, 1.0);
    }
  `)

  // Setup a material
  const material = new THREE.ShaderMaterial({
    uniforms:{
      time:{value:0},
      color:{ value: new THREE.Color('#3e5fe2')}
    },
    vertexShader,
    fragmentShader
  });

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time }) {
      material.uniforms.time.value = time;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
