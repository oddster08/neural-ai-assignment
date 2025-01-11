import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Components/Header";
import MainSection from "./Components/MainSection";
import Footer from "./Components/Footer";
import History from "./screens/History";
import Explore from "./screens/Explore";
import SkyboxFullScreen from "./screens/SkyboxFullScreen";

function App() {
  const [backgroundSkybox, setBackgroundSkybox] = useState(null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [backgroundSkybox]);

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        {/* Skybox Background Layer */}
        {backgroundSkybox && (
          <div className="absolute inset-0 z-0">
            <SkyboxFullScreen 
              key={key}
              isBackground={true} 
              skyboxData={backgroundSkybox} 
            />
          </div>
        )}
        
        {/* Main Content Layer */}
        <div className="relative flex flex-col h-screen z-10">
          {/* Header - fixed height */}
          <div className="flex-none">
            <Header />
          </div>

          {/* Main content - scrollable */}
          <div className="flex-1 overflow-y-auto">
            <Routes>
              <Route 
                path="/" 
                element={
                  <MainSection 
                    setBackgroundSkybox={setBackgroundSkybox}
                  />
                } 
              />
              <Route 
                path="/explore" 
                element={
                  <Explore 
                    setBackgroundSkybox={setBackgroundSkybox} 
                  />
                } 
              />
              <Route path="/skybox/:id" element={<SkyboxFullScreen />} />
              <Route path="/history" element={<History />} />
            </Routes>
          </div>

          {/* Footer - fixed height */}
          <div className="flex-none">
            <Footer />
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
