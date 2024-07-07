// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");

const settings = {
  
  // Make the loop animated
  pixelsPerInch:300,
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
  renderer.setClearColor("#000", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 1, 100);
  camera.position.set(3, 3, 5);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const geometry = new THREE.TorusGeometry(1, 0.6, 32,64);

  const loader = new THREE.TextureLoader();
  const texture = loader.load('brick-diffuse.jpg');
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2,1).multiplyScalar(4);

  
  const normalMap = loader.load('brick-normal.jpg');
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.copy(texture.repeat);

  const normalStrength = 1.5;
  // Setup a material
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.85,
    metalness: 0.5,
    normalScale: new THREE.Vector2(normalStrength, normalStrength),
    normalMap,
    map:texture
  });

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const light = new THREE.PointLight('white',2);
  light.position.set(1,1,2);
  scene.add(light);

  scene.add(new THREE.GridHelper(5,50,'yellow'));
  scene.add(new THREE.PointLightHelper(light,0.15));

  const axesHelper = new THREE.AxesHelper(5);
  scene.add(axesHelper);
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
      mesh.rotation.y = time * 0.15;
      // scene.rotation.y = time * 0.02
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
