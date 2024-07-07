// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");

const glsl = require('glslify')

const settings = {
  duration: 4,
  fps:20,
  //mp4
  dimensions: [ 640, 640 ],
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

  const vertexShader = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vPosition;
    void main(){
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
    }
  `
  const fragmentShader = glsl(/* glsl */`
    #pragma glslify: noise = require('glsl-noise/simplex/3d');
    #pragma glslify: aastep = require('glsl-aastep');
    varying vec2 vUv;
    varying vec3 vPosition;

    uniform mat4 modelMatrix;

    float sphereRim (vec3 spherePosition) {
      vec3 normal = normalize(spherePosition.xyz);
      vec3 worldNormal = normalize(mat3(modelMatrix) * normal.xyz);
      vec3 worldPosition = (modelMatrix * vec4(spherePosition, 1.0)).xyz;
      vec3 V = normalize(cameraPosition - worldPosition);
      float rim = 1.0 - max(dot(V, worldNormal), 0.0);
      return pow(smoothstep(0.0, 1.0, rim), 0.5);
    }

    uniform vec3 color;
    uniform float time;
    uniform vec3 points[POINT_COUNT];
    void main(){
      float dist = 10000.0;
      for (int i = 0; i < POINT_COUNT; i++){
        vec3 p = points[i];
        float d = distance(vPosition, p);
        dist = min(d, dist);
      }
      float mask = aastep(0.15, dist);
      mask = 1.0 - mask;
      vec3 fragColor = mix(color, vec3(1), mask);
      // gl_FragColor = vec4(vec3(fragColor.x,sin(vPosition.x), sin(mask)*vPosition*2.0)+0.5, 1.0);
      float rim = sphereRim(vPosition);
      fragColor += rim * 0.5;
      gl_FragColor = vec4(fragColor, 1.0);
      if (mask > 0.5) discard;
    }
  `)

  // Setup a material
  const material = new THREE.ShaderMaterial({
    defines:{
      POINT_COUNT: uniquePoints.length
    },
    side: THREE.DoubleSide,
    extensions:{
      derivatives: true
    },
    uniforms:{
      points:{value: uniquePoints},
      time:{value:0},
      color:{ value: new THREE.Color('tomato')}
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
    render({ time, playhead }) {
      mesh.rotation.y = time;
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
