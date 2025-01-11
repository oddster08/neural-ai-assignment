import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const SkyboxFullscreen = ({ isBackground = false, skyboxData = null }) => {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const [style, setStyle] = useState(skyboxData || state?.style || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStyle = async () => {
      if (!style && id) {
        try {
          const response = await fetch(`http://localhost:5002/api/skybox/${id}`);
          if (!response.ok) throw new Error("Failed to fetch skybox data");
          const data = await response.json();
          setStyle(data);
        } catch (err) {
          console.error("Error fetching skybox:", err);
          setError("Failed to load skybox");
        }
      }
    };

    fetchStyle();
  }, [id, style]);

  useEffect(() => {
    if (skyboxData) {
      setStyle(skyboxData);
    }
  }, [skyboxData]);

  useEffect(() => {
    if (!style?.image && !style?.image_jpg) return;

    const container = containerRef.current;
    if (!container) return;

    let animationFrameId;

    const initScene = async () => {
      try {
        // Create Scene
        sceneRef.current = new THREE.Scene();

        // Create and Setup Camera
        cameraRef.current = new THREE.PerspectiveCamera(
          75,
          container.clientWidth / container.clientHeight,
          0.1,
          1000
        );
        cameraRef.current.position.set(0, 0, 0.1);

        // Create and Setup Renderer
        rendererRef.current = new THREE.WebGLRenderer({
          antialias: true,
          powerPreference: "high-performance",
          precision: "highp",
          preserveDrawingBuffer: true,
        });
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        rendererRef.current.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = "";
        container.appendChild(rendererRef.current.domElement);

        // Create and Setup Controls
        controlsRef.current = new OrbitControls(
          cameraRef.current,
          rendererRef.current.domElement
        );
        controlsRef.current.enableZoom = false;
        controlsRef.current.enablePan = false;
        controlsRef.current.rotateSpeed = 0.5;
        if (isBackground) {
          controlsRef.current.autoRotate = true;
          controlsRef.current.autoRotateSpeed = 0.5;
        }

        // Load Texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.setCrossOrigin("anonymous");

        const texture = await new Promise((resolve, reject) => {
          textureLoader.load(
            style.image || style.image_jpg,
            (tex) => {
              tex.minFilter = THREE.LinearMipMapLinearFilter;
              tex.magFilter = THREE.LinearFilter;
              tex.format = THREE.RGBAFormat;
              tex.encoding = THREE.sRGBEncoding;
              resolve(tex);
            },
            undefined,
            reject
          );
        });

        // Create Geometry
        const geometry = new THREE.SphereGeometry(500, 128, 128);
        geometry.scale(-1, 1, 1);

        // Create Material
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          side: THREE.DoubleSide,
        });

        // Create Mesh and Add to Scene
        const sphere = new THREE.Mesh(geometry, material);
        sceneRef.current.add(sphere);

        // Animation Loop
        const animate = () => {
          controlsRef.current.update();
          rendererRef.current.render(sceneRef.current, cameraRef.current);
          animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        setLoading(false);

        // Handle Resize
        const handleResize = () => {
          const width = container.clientWidth;
          const height = container.clientHeight;
          
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
        };

        window.addEventListener("resize", handleResize);

        // Cleanup Function
        return () => {
          window.removeEventListener("resize", handleResize);
          cancelAnimationFrame(animationFrameId);
          
          if (controlsRef.current) {
            controlsRef.current.dispose();
          }
          
          if (rendererRef.current) {
            rendererRef.current.dispose();
          }
          
          geometry.dispose();
          material.dispose();
          texture.dispose();
          
          // Clear all references
          sceneRef.current = null;
          rendererRef.current = null;
          cameraRef.current = null;
          controlsRef.current = null;
        };
      } catch (err) {
        console.error("Error in initScene:", err);
        setError("Failed to initialize 3D environment");
        setLoading(false);
      }
    };

    const cleanup = initScene();

    return () => {
      if (cleanup && typeof cleanup === "function") {
        cleanup();
      }
    };
  }, [style, isBackground]);

  if (error && !isBackground) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="text-xl mb-4">{error}</div>
        <button
          className="bg-gray-800 px-4 py-2 rounded-lg hover:bg-gray-700"
          onClick={() => navigate("/explore")}
        >
          Return to Explore
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${isBackground ? 'w-full h-full' : 'w-full h-screen'} bg-black`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white text-xl">
          Loading environment...
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      {!isBackground && (
        <button
          className="absolute top-4 left-4 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          onClick={() => navigate("/explore")}
        >
          Back to Explore
        </button>
      )}
    </div>
  );
};

export default SkyboxFullscreen;