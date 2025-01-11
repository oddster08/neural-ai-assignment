import React, { useState, useEffect } from "react";
import axios from "axios";

const MainSection = ({ setBackgroundSkybox }) => {
  const [showNegativeTextInput, setShowNegativeTextInput] = useState(false);
  const [skyboxStyles, setSkyboxStyles] = useState([]);
  const [selectedSkybox, setSelectedSkybox] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [negativeText, setNegativeText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [showStylePreview, setShowStylePreview] = useState(false);

  useEffect(() => {
    const fetchSkyboxStyles = async () => {
      try {
        const response = await axios.get("http://localhost:5002/api/skybox/getSkyboxStyles");
        setSkyboxStyles(response.data);
      } catch (error) {
        console.error("Error fetching skybox styles:", error);
        setError("Failed to load skybox styles");
      }
    };

    fetchSkyboxStyles();
  }, []);

  const generateSkybox = async () => {
    if (!prompt || !selectedSkybox) {
      setError("Please provide a prompt and select a skybox style");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setShowStylePreview(false); // Hide the style preview when generating

    try {
      // Generate the skybox
      const generateResponse = await axios.post("http://localhost:5002/api/imagine/generateImagine", {
        prompt: prompt,
        skybox_style_id: selectedSkybox.id,
        negative_text: showNegativeTextInput ? negativeText : null
      });

      // Get the generated image ID
      const imageId = generateResponse.data.id;

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await axios.get(`http://localhost:5002/api/imagine/getImagineById?id=${imageId}`);
          const status = statusResponse.data;

          if (status.status === "complete") {
            clearInterval(pollInterval);
            // Update the background with the completed skybox
            const skyboxData = {
              image: status.file_url,
              image_jpg: status.file_url,
              title: status.title,
              prompt: status.prompt
            };
            setBackgroundSkybox(skyboxData);
            setIsGenerating(false);
          } else if (status.status === "failed" || status.error_message) {
            clearInterval(pollInterval);
            setError(status.error_message || "Generation failed");
            setIsGenerating(false);
          }
        } catch (error) {
          clearInterval(pollInterval);
          console.error("Error polling status:", error);
          setError("Failed to check generation status");
          setIsGenerating(false);
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup interval on component unmount
      return () => clearInterval(pollInterval);
    } catch (error) {
      console.error("Error generating skybox:", error);
      setError("Failed to generate skybox");
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full w-full flex items-end justify-center pb-20">
      <div className="w-[95%] max-w-6xl p-6 bg-gray-900 bg-opacity-65 text-gray-200 shadow-lg rounded-md">
        {error && (
          <div className="mb-4 p-3 bg-red-500 bg-opacity-50 rounded-md">
            {error}
          </div>
        )}

        <div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2">Prompt</label>
            <textarea
              maxLength={600}
              placeholder="Write your prompt here..."
              className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="flex items-start space-x-4 mb-4">
            <div className="flex-1">
              <label className="block text-gray-300 mb-2">Negative Text</label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 focus:ring-blue-400"
                  checked={showNegativeTextInput}
                  onChange={() => setShowNegativeTextInput(!showNegativeTextInput)}
                />
                {showNegativeTextInput && (
                  <input
                    type="text"
                    placeholder="Optional negative text..."
                    className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={negativeText}
                    onChange={(e) => setNegativeText(e.target.value)}
                  />
                )}
              </div>
            </div>

            <div className="w-1/3">
              <label className="block text-gray-300 mb-2">Skybox Style</label>
              <select
                className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onChange={(e) => {
                  const style = skyboxStyles.find(
                    (style) => style.id === parseInt(e.target.value)
                  );
                  setSelectedSkybox(style);
                  setShowStylePreview(true);
                }}
                value={selectedSkybox?.id || ""}
              >
                <option value="" disabled>
                  -- Choose a Skybox Style --
                </option>
                {skyboxStyles.map((style) => (
                  <option key={style.id} value={style.id}>
                    {style.name} (Model: {style.model})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showStylePreview && selectedSkybox && (
            <div className="p-4 h-[200px]bg-gray-800 border border-gray-700 rounded-md mt-4">
              <div className="  flex justify-between items-center">
                <h3 className="text-lg font-medium">{selectedSkybox.name}</h3>
                <button
                  onClick={() => setShowStylePreview(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
              {selectedSkybox.description && (
                <p className="text-sm text-gray-400 mb-2">{selectedSkybox.description}</p>
              )}
              {selectedSkybox.image_jpg && (
                <img
                  src={selectedSkybox.image_jpg}
                  alt={selectedSkybox.name}
                  className="w-full h-auto rounded mt-2"
                />
              )}
            </div>
          )}

          <button
            className={`w-32 ${
              isGenerating
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white py-1 rounded-md mt-4`}
            onClick={generateSkybox}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainSection;