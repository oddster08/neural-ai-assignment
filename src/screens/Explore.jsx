import React, { useEffect, useState, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { useNavigate } from "react-router-dom";

const Explore = ({ setBackgroundSkybox }) => {
  const [styles, setStyles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const renderers = useRef({});
  const controls = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const response = await fetch("http://localhost:5002/api/skybox/getSkyboxStyles");
        const data = await response.json();
        setStyles(data);
      } catch (err) {
        setError("Failed to load styles");
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();

    return () => {
      // Cleanup renderers and controls
      Object.values(renderers.current).forEach((renderer) => {
        if (renderer) renderer.dispose();
      });
      Object.values(controls.current).forEach((control) => {
        if (control) control.dispose();
      });
    };
  }, []);

  const initScene = async (index, imageUrl) => {
    const container = document.getElementById(`skybox-${index}`);
    if (!container) return;

    container.innerHTML = "";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    renderers.current[index] = renderer;

    const control = new OrbitControls(camera, renderer.domElement);
    control.enableZoom = false;
    control.enablePan = false;
    control.rotateSpeed = 0.5;
    controls.current[index] = control;

    try {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.setCrossOrigin('anonymous');

      const texture = await new Promise((resolve, reject) => {
        textureLoader.load(
          imageUrl,
          (loadedTexture) => {
            loadedTexture.encoding = THREE.sRGBEncoding;
            resolve(loadedTexture);
          },
          undefined,
          (error) => {
            console.error("Error loading texture:", error);
            reject(error);
          }
        );
      });

      const geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);
      
      const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        side: THREE.DoubleSide
      });
      
      const sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
      camera.position.set(0, 0, 0.1);

      const animate = () => {
        control.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      };

      animate();

      const handleResize = () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);

    } catch (err) {
      console.error("Error initializing scene:", err);
      // Fallback to displaying the image directly
      container.innerHTML = `<img src="${imageUrl}" alt="skybox preview" class="w-full h-full object-cover" crossorigin="anonymous" />`;
    }
  };

  useEffect(() => {
    styles.forEach((style, index) => {
      if (style.image || style.image_jpg) {
        initScene(index, style.image || style.image_jpg);
      }
    });
  }, [styles]);

  const handleClick = (style) => {
    setBackgroundSkybox(style);  // Set as background on main page
    navigate('/');  // Navigate to home page
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading environments...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-12">Explore VR Environments</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {styles.map((style, index) => (
          <div
            key={style.id}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-xl transform transition-transform hover:scale-105 cursor-pointer"
            onClick={() => handleClick(style)}
          >
            <div id={`skybox-${index}`} className="w-full h-64 relative">
              {!style.image && !style.image_jpg && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                  No image available
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-2">{style.name}</h2>
              <p className="text-gray-400 text-sm">{style.description || 'Click to set as background'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Explore;