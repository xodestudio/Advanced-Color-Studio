import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiCopy,
  FiX,
  FiUpload,
  FiEye,
  FiEyeOff,
  FiShare2,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import {
  MdPalette,
  MdColorLens,
  MdGradient,
  MdFormatColorFill,
  MdColorize,
  MdInvertColors,
} from "react-icons/md";
import { HexColorPicker, HexColorInput } from "react-colorful";
import tinycolor from "tinycolor2";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";

const App = () => {
  // Core State
  const [primaryColor, setPrimaryColor] = useState("#6d28d9");
  const [secondaryColor, setSecondaryColor] = useState("#f59e0b");
  const [activeColor, setActiveColor] = useState("primary");
  const [savedPalettes, setSavedPalettes] = useState(() => {
    const localPalettes = localStorage.getItem("colorPalettes");
    return localPalettes
      ? JSON.parse(localPalettes)
      : [
          {
            id: "1",
            name: "Brand Colors",
            colors: ["#6d28d9", "#059669", "#2563eb", "#d946ef"],
            createdAt: new Date().toISOString(),
          },
        ];
  });
  const [currentFormat, setCurrentFormat] = useState("hex");
  const [activeTab, setActiveTab] = useState("picker");
  const [workspaceMode, setWorkspaceMode] = useState("solid");
  const [colorHarmony, setColorHarmony] = useState("complementary");
  const [exportFormat, setExportFormat] = useState("css");
  const [showContrastGrid, setShowContrastGrid] = useState(false);
  const [imageColors, setImageColors] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [copiedNotification, setCopiedNotification] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [paletteName, setPaletteName] = useState("");
  const [showPaletteNameInput, setShowPaletteNameInput] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [pickedColor, setPickedColor] = useState(null);
  const appRef = useRef(null);
  const imageRef = useRef(null);

  // Save palettes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("colorPalettes", JSON.stringify(savedPalettes));
  }, [savedPalettes]);

  // Advanced Color Calculations
  const currentColor =
    activeColor === "primary" ? primaryColor : secondaryColor;
  const contrastScore = tinycolor(currentColor).isLight() ? "AAA" : "A";
  const colorHarmonies = {
    complementary: tinycolor(currentColor).complement().toHexString(),
    analogous: tinycolor(currentColor)
      .analogous(15, 15)
      .map((c) => c.toHexString()),
    triadic: tinycolor(currentColor)
      .triad()
      .map((c) => c.toHexString()),
    tetradic: tinycolor(currentColor)
      .tetrad()
      .map((c) => c.toHexString()),
    monochromatic: tinycolor(currentColor)
      .monochromatic()
      .map((c) => c.toHexString()),
    splitComplementary: tinycolor(currentColor)
      .splitcomplement()
      .map((c) => c.toHexString()),
  };

  // Improved Image Color Extraction
  const extractColorsFromImage = (imageData) => {
    try {
      // Simplified color extraction - in a real app you'd use a proper algorithm
      const colors = [];
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);

        // Sample colors from different areas of the image
        const samplePoints = [
          { x: 0.2, y: 0.2 }, // top-left
          { x: 0.8, y: 0.2 }, // top-right
          { x: 0.5, y: 0.5 }, // center
          { x: 0.2, y: 0.8 }, // bottom-left
          { x: 0.8, y: 0.8 }, // bottom-right
        ];

        samplePoints.forEach((point) => {
          const pixel = tempCtx.getImageData(
            point.x * img.width,
            point.y * img.height,
            1,
            1
          ).data;
          const hex = `#${(
            (1 << 24) +
            (pixel[0] << 16) +
            (pixel[1] << 8) +
            pixel[2]
          )
            .toString(16)
            .slice(1)}`;
          colors.push(hex);
        });

        setImageColors(colors);
      };

      img.src = imageData;
    } catch (error) {
      console.error("Color extraction failed:", error);
      setImageColors([]);
    }
  };

  // Color Picker from Image
  const handleImageClick = (e) => {
    if (!imageRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;
    ctx.drawImage(imageRef.current, 0, 0);

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
      .toString(16)
      .slice(1)}`;

    setPickedColor(hex);
    setPrimaryColor(hex);
  };

  const handleImageMouseMove = (e) => {
    if (!isDragging || !imageRef.current) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;
    ctx.drawImage(imageRef.current, 0, 0);

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    setCursorPosition({ x, y });

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
      .toString(16)
      .slice(1)}`;
    setPickedColor(hex);
  };

  // Color Conversion Utilities
  const formatColor = (color, format = currentFormat) => {
    const tc = tinycolor(color);
    switch (format) {
      case "hex":
        return tc.toHexString().toUpperCase();
      case "rgb":
        return tc.toRgbString();
      case "hsl":
        return tc.toHslString();
      case "cmyk": {
        const rgb = tc.toRgb();
        let c = 1 - rgb.r / 255;
        let m = 1 - rgb.g / 255;
        let y = 1 - rgb.b / 255;
        const k = Math.min(c, m, y);

        c = ((c - k) / (1 - k)) * 100;
        m = ((m - k) / (1 - k)) * 100;
        y = ((y - k) / (1 - k)) * 100;

        return `cmyk(${Math.round(c)}%, ${Math.round(m)}%, ${Math.round(
          y
        )}%, ${Math.round(k * 100)}%)`;
      }
      default:
        return tc.toHexString();
    }
  };

  // Palette Management
  const saveCurrentPalette = () => {
    if (!paletteName.trim()) return;

    const newPalette = {
      id: Date.now().toString(),
      name: paletteName,
      colors: [primaryColor, secondaryColor],
      createdAt: new Date().toISOString(),
    };
    setSavedPalettes([newPalette, ...savedPalettes]);
    setPaletteName("");
    setShowPaletteNameInput(false);
  };

  const deletePalette = (id) => {
    setSavedPalettes(savedPalettes.filter((palette) => palette.id !== id));
  };

  // Export Functionality
  const exportColorScheme = async (type) => {
    setIsExporting(true);
    try {
      if (type === "image") {
        const canvas = await html2canvas(appRef.current);
        canvas.toBlob((blob) => {
          saveAs(blob, `color-scheme-${new Date().getTime()}.png`);
        });
      } else {
        let content = "";
        if (type === "css") {
          content = `:root {\n  --primary-color: ${formatColor(
            primaryColor,
            "hex"
          )};\n  --secondary-color: ${formatColor(secondaryColor, "hex")};\n}`;
        } else if (type === "scss") {
          content = `$primary-color: ${formatColor(
            primaryColor,
            "hex"
          )};\n$secondary-color: ${formatColor(secondaryColor, "hex")};`;
        } else if (type === "json") {
          content = JSON.stringify(
            {
              primary: formatColor(primaryColor, "hex"),
              secondary: formatColor(secondaryColor, "hex"),
              harmonies: colorHarmonies,
            },
            null,
            2
          );
        }
        const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
        saveAs(blob, `color-scheme.${type}`);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to Clipboard with Notification
  const copyToClipboard = (text, format) => {
    navigator.clipboard.writeText(text);
    setCopiedNotification(`Copied ${format} to clipboard`);
    setTimeout(() => setCopiedNotification(null), 2000);
  };

  // Color Manipulation Functions
  const adjustColor = (property, value) => {
    const tc = tinycolor(currentColor);
    const adjusted = tc[property](value).toHexString();
    (activeColor === "primary" ? setPrimaryColor : setSecondaryColor)(adjusted);
  };

  const invertColor = () => {
    const inverted = tinycolor(currentColor).spin(180).toHexString();
    (activeColor === "primary" ? setPrimaryColor : setSecondaryColor)(inverted);
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match("image.*")) {
      setCopiedNotification("Please upload an image file");
      setTimeout(() => setCopiedNotification(null), 2000);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      extractColorsFromImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      ref={appRef}
      className="w-full h-screen overflow-hidden flex flex-col items-center justify-center relative bg-gray-50"
    >
      {/* Dynamic Workspace Background */}
      <div
        className="absolute inset-0 transition-all duration-500"
        style={
          workspaceMode === "gradient"
            ? {
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
              }
            : workspaceMode === "harmony"
            ? {
                background: Array.isArray(colorHarmonies[colorHarmony])
                  ? colorHarmonies[colorHarmony][0]
                  : colorHarmonies[colorHarmony],
              }
            : { backgroundColor: primaryColor }
        }
      />

      {/* Main Application Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 w-full max-w-6xl h-[90vh] bg-white bg-opacity-90 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-white border-opacity-30"
      >
        {/* Application Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white bg-opacity-80">
          <div className="flex items-center space-x-4">
            <MdColorLens className="text-2xl text-purple-600" />
            <h1 className="text-xl font-bold text-gray-800">
              Advanced Color Studio
            </h1>
          </div>

          <div className="flex space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium flex items-center"
              onClick={() => setShowContrastGrid(!showContrastGrid)}
            >
              {showContrastGrid ? (
                <FiEyeOff className="mr-2" />
              ) : (
                <FiEye className="mr-2" />
              )}
              {showContrastGrid ? "Hide Grid" : "Show Grid"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center"
              onClick={() => exportColorScheme(exportFormat)}
              disabled={isExporting}
            >
              <FiShare2 className="mr-2" />
              {isExporting ? "Exporting..." : "Export"}
            </motion.button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Tools */}
          <div className="w-64 border-r border-gray-200 bg-white bg-opacity-80 p-4 flex flex-col">
            <div className="space-y-6">
              {/* Workspace Mode Selector */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Workspace Mode
                </h3>
                <div className="space-y-2">
                  {["solid", "gradient", "harmony"].map((mode) => (
                    <motion.button
                      key={mode}
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center ${
                        workspaceMode === mode
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-700"
                      }`}
                      onClick={() => setWorkspaceMode(mode)}
                    >
                      {mode === "solid" && (
                        <MdFormatColorFill className="mr-2" />
                      )}
                      {mode === "gradient" && <MdGradient className="mr-2" />}
                      {mode === "harmony" && <MdPalette className="mr-2" />}
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Color Format Selector */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Color Format
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {["hex", "rgb", "hsl", "cmyk"].map((format) => (
                    <motion.button
                      key={format}
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-3 py-2 rounded-md text-xs font-medium ${
                        currentFormat === format
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-700"
                      }`}
                      onClick={() => setCurrentFormat(format)}
                    >
                      {format.toUpperCase()}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Export Format Selector */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Export Format
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {["css", "scss", "json", "image"].map((format) => (
                    <motion.button
                      key={format}
                      whileHover={{ backgroundColor: "#f3f4f6" }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-2 py-1 rounded-md text-xs font-medium ${
                        exportFormat === format
                          ? "bg-purple-100 text-purple-700"
                          : "text-gray-700"
                      }`}
                      onClick={() => setExportFormat(format)}
                    >
                      {format}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Active Color Selector */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Active Color
                </h3>
                <div className="flex space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 py-2 rounded-md flex items-center justify-center ${
                      activeColor === "primary" ? "ring-2 ring-purple-500" : ""
                    }`}
                    style={{ backgroundColor: primaryColor }}
                    onClick={() => setActiveColor("primary")}
                  >
                    <span className="text-xs font-medium px-2 py-1 bg-black bg-opacity-30 text-white rounded">
                      Primary
                    </span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 py-2 rounded-md flex items-center justify-center ${
                      activeColor === "secondary"
                        ? "ring-2 ring-purple-500"
                        : ""
                    }`}
                    style={{ backgroundColor: secondaryColor }}
                    onClick={() => setActiveColor("secondary")}
                  >
                    <span className="text-xs font-medium px-2 py-1 bg-black bg-opacity-30 text-white rounded">
                      Secondary
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Color Adjustments */}
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Adjustments
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Lighten/Darken
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      defaultValue="0"
                      onChange={(e) =>
                        adjustColor("lighten", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Saturate/Desaturate
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      defaultValue="0"
                      onChange={(e) =>
                        adjustColor("saturate", parseInt(e.target.value))
                      }
                      className="w-full"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center px-3 py-2 bg-gray-100 rounded-md text-sm"
                    onClick={invertColor}
                  >
                    <MdInvertColors className="mr-2" />
                    Invert Color
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Saved Palettes Section */}
            <div className="mt-auto pt-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Saved Palettes
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-purple-600 text-xs font-medium flex items-center"
                  onClick={() => setShowPaletteNameInput(true)}
                >
                  <FiPlus size={12} className="mr-1" />
                  Save
                </motion.button>
              </div>

              {showPaletteNameInput && (
                <div className="mb-4 flex items-center space-x-2">
                  <input
                    type="text"
                    value={paletteName}
                    onChange={(e) => setPaletteName(e.target.value)}
                    placeholder="Palette name"
                    className="flex-1 text-xs border rounded px-2 py-1"
                    autoFocus
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-green-600 text-xs font-medium"
                    onClick={saveCurrentPalette}
                  >
                    Save
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-gray-500 text-xs"
                    onClick={() => setShowPaletteNameInput(false)}
                  >
                    <FiX />
                  </motion.button>
                </div>
              )}

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {savedPalettes.length > 0 ? (
                  savedPalettes.map((palette) => (
                    <motion.div
                      key={palette.id}
                      whileHover={{ y: -2 }}
                      className="bg-gray-50 rounded-lg p-3 cursor-pointer border border-gray-200 relative group"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">
                          {palette.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(palette.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex h-6 rounded overflow-hidden">
                        {palette.colors.slice(0, 5).map((color) => (
                          <div
                            key={color}
                            className="flex-1"
                            style={{ backgroundColor: color }}
                            onClick={() => setPrimaryColor(color)}
                          />
                        ))}
                        {palette.colors.length > 5 && (
                          <div className="w-6 bg-gray-200 flex items-center justify-center text-xs">
                            +{palette.colors.length - 5}
                          </div>
                        )}
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePalette(palette.id);
                        }}
                      >
                        <FiTrash2 size={14} />
                      </motion.button>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No palettes saved yet
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Main Workspace */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 flex bg-white bg-opacity-80">
              {["picker", "harmonies", "extract", "contrast"].map((tab) => (
                <button
                  key={tab}
                  className={`px-6 py-3 text-sm font-medium relative ${
                    activeTab === tab
                      ? "text-purple-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="tabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto p-6">
              {activeTab === "picker" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      {activeColor === "primary" ? "Primary" : "Secondary"}{" "}
                      Color Picker
                    </h3>
                    <div className="space-y-4">
                      <HexColorPicker
                        color={currentColor}
                        onChange={
                          activeColor === "primary"
                            ? setPrimaryColor
                            : setSecondaryColor
                        }
                        className="w-full h-64 rounded-xl overflow-hidden border border-gray-200"
                      />

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            HEX
                          </label>
                          <HexColorInput
                            color={currentColor}
                            onChange={
                              activeColor === "primary"
                                ? setPrimaryColor
                                : setSecondaryColor
                            }
                            prefixed
                            className="w-full p-2 border border-gray-200 rounded-md font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            RGB
                          </label>
                          <input
                            type="text"
                            value={formatColor(currentColor, "rgb")}
                            onChange={(e) => {
                              const color = tinycolor(e.target.value);
                              if (color.isValid()) {
                                (activeColor === "primary"
                                  ? setPrimaryColor
                                  : setSecondaryColor)(color.toHexString());
                              }
                            }}
                            className="w-full p-2 border border-gray-200 rounded-md font-mono text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            HSL
                          </label>
                          <input
                            type="text"
                            value={formatColor(currentColor, "hsl")}
                            onChange={(e) => {
                              const color = tinycolor(e.target.value);
                              if (color.isValid()) {
                                (activeColor === "primary"
                                  ? setPrimaryColor
                                  : setSecondaryColor)(color.toHexString());
                              }
                            }}
                            className="w-full p-2 border border-gray-200 rounded-md font-mono text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Color Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Current Color</p>
                          <p className="font-mono font-bold text-lg">
                            {formatColor(currentColor)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-gray-200 rounded-md"
                            onClick={() =>
                              copyToClipboard(
                                formatColor(currentColor),
                                currentFormat
                              )
                            }
                          >
                            <FiCopy />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="p-2 bg-gray-200 rounded-md"
                            onClick={() => {
                              const color = tinycolor.random().toHexString();
                              (activeColor === "primary"
                                ? setPrimaryColor
                                : setSecondaryColor)(color);
                            }}
                          >
                            <MdColorize />
                          </motion.button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">
                            Contrast Ratio
                          </p>
                          <p className="font-medium">{contrastScore} (WCAG)</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Luminance</p>
                          <p className="font-medium">
                            {tinycolor(currentColor).getLuminance().toFixed(3)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Hue</p>
                          <p className="font-medium">
                            {tinycolor(currentColor).toHsl().h.toFixed(0)}°
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Saturation</p>
                          <p className="font-medium">
                            {(tinycolor(currentColor).toHsl().s * 100).toFixed(
                              0
                            )}
                            %
                          </p>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-2">
                          All Formats
                        </p>
                        <div className="space-y-2">
                          {["hex", "rgb", "hsl", "cmyk"].map((format) => (
                            <div
                              key={format}
                              className="flex justify-between items-center"
                            >
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {format.toUpperCase()}
                              </span>
                              <div className="flex items-center">
                                <span className="text-xs font-mono mr-2">
                                  {formatColor(currentColor, format)}
                                </span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="text-gray-400 hover:text-gray-600"
                                  onClick={() =>
                                    copyToClipboard(
                                      formatColor(currentColor, format),
                                      format
                                    )
                                  }
                                >
                                  <FiCopy size={12} />
                                </motion.button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "harmonies" && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(colorHarmonies).map(([name, colors]) => (
                      <motion.div
                        key={name}
                        whileHover={{ y: -5 }}
                        className={`rounded-lg overflow-hidden border ${
                          colorHarmony === name
                            ? "border-purple-500 ring-2 ring-purple-200"
                            : "border-gray-200"
                        }`}
                        onClick={() => setColorHarmony(name)}
                      >
                        <div className="h-32 flex">
                          {Array.isArray(colors) ? (
                            colors.map((color) => (
                              <div
                                key={color}
                                className="flex-1"
                                style={{ backgroundColor: color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPrimaryColor(color);
                                }}
                              />
                            ))
                          ) : (
                            <div
                              className="flex-1"
                              style={{ backgroundColor: colors }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrimaryColor(colors);
                              }}
                            />
                          )}
                        </div>
                        <div className="p-3 bg-white">
                          <h4 className="text-sm font-medium capitalize">
                            {name}
                          </h4>
                          {Array.isArray(colors) && (
                            <p className="text-xs text-gray-500">
                              {colors.length} colors
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {colorHarmony && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 capitalize">
                          {colorHarmony} Harmony
                        </h3>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1 bg-purple-600 text-white rounded-md text-xs font-medium"
                          onClick={() => {
                            const colors = Array.isArray(
                              colorHarmonies[colorHarmony]
                            )
                              ? colorHarmonies[colorHarmony]
                              : [colorHarmonies[colorHarmony]];
                            setSavedPalettes([
                              {
                                id: Date.now().toString(),
                                name: `${colorHarmony} Harmony`,
                                colors,
                                createdAt: new Date().toISOString(),
                              },
                              ...savedPalettes,
                            ]);
                          }}
                        >
                          Save Palette
                        </motion.button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.isArray(colorHarmonies[colorHarmony]) ? (
                          colorHarmonies[colorHarmony].map((color) => (
                            <div
                              key={color}
                              className="flex items-center space-x-3 p-2 bg-white rounded-md"
                            >
                              <div
                                className="w-10 h-10 rounded-md border border-gray-200"
                                style={{ backgroundColor: color }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-mono truncate">
                                  {color.toUpperCase()}
                                </p>
                                <div className="flex space-x-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="text-xs text-purple-600"
                                    onClick={() => setPrimaryColor(color)}
                                  >
                                    Set Primary
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="text-xs text-purple-600"
                                    onClick={() => setSecondaryColor(color)}
                                  >
                                    Set Secondary
                                  </motion.button>
                                </div>
                              </div>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="text-gray-400 hover:text-gray-600"
                                onClick={() => copyToClipboard(color, "hex")}
                              >
                                <FiCopy size={14} />
                              </motion.button>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center space-x-3 p-2 bg-white rounded-md">
                            <div
                              className="w-10 h-10 rounded-md border border-gray-200"
                              style={{
                                backgroundColor: colorHarmonies[colorHarmony],
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-mono truncate">
                                {colorHarmonies[colorHarmony].toUpperCase()}
                              </p>
                              <div className="flex space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="text-xs text-purple-600"
                                  onClick={() =>
                                    setPrimaryColor(
                                      colorHarmonies[colorHarmony]
                                    )
                                  }
                                >
                                  Set Primary
                                </motion.button>
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className="text-xs text-purple-600"
                                  onClick={() =>
                                    setSecondaryColor(
                                      colorHarmonies[colorHarmony]
                                    )
                                  }
                                >
                                  Set Secondary
                                </motion.button>
                              </div>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-gray-400 hover:text-gray-600"
                              onClick={() =>
                                copyToClipboard(
                                  colorHarmonies[colorHarmony],
                                  "hex"
                                )
                              }
                            >
                              <FiCopy size={14} />
                            </motion.button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "extract" && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 transition-colors">
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <div className="max-w-md mx-auto">
                        <FiUpload className="mx-auto text-3xl text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-1">
                          Drag & drop an image or click to browse
                        </p>
                        <p className="text-xs text-gray-400">
                          Supports JPG, PNG, WEBP (Max 5MB)
                        </p>
                      </div>
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </div>

                  {uploadedImage && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          Original Image
                        </h3>
                        <div
                          className="rounded-lg overflow-hidden border border-gray-200 relative"
                          onMouseDown={() => setIsDragging(true)}
                          onMouseUp={() => setIsDragging(false)}
                          onMouseLeave={() => setIsDragging(false)}
                          onMouseMove={handleImageMouseMove}
                          onClick={handleImageClick}
                        >
                          <img
                            ref={imageRef}
                            src={uploadedImage}
                            alt="Uploaded for color extraction"
                            className="w-full h-auto cursor-crosshair"
                          />
                          {isDragging && (
                            <div
                              className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
                              style={{
                                left: cursorPosition.x - 8,
                                top: cursorPosition.y - 8,
                                backgroundColor: pickedColor || "transparent",
                              }}
                            />
                          )}
                        </div>
                        {pickedColor && (
                          <div className="mt-2 flex items-center">
                            <div
                              className="w-8 h-8 rounded border border-gray-200 mr-2"
                              style={{ backgroundColor: pickedColor }}
                            />
                            <span className="font-mono text-sm">
                              {pickedColor.toUpperCase()}
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="ml-2 text-gray-400 hover:text-gray-600"
                              onClick={() =>
                                copyToClipboard(pickedColor, "hex")
                              }
                            >
                              <FiCopy size={14} />
                            </motion.button>
                          </div>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          Extracted Colors
                        </h3>
                        {imageColors.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {imageColors.map((color, index) => (
                              <motion.div
                                key={index}
                                whileHover={{ y: -3 }}
                                className="rounded-lg overflow-hidden border border-gray-200"
                              >
                                <div
                                  className="h-20"
                                  style={{ backgroundColor: color }}
                                  onClick={() => setPrimaryColor(color)}
                                />
                                <div className="p-2 bg-white">
                                  <p className="text-xs font-mono truncate">
                                    {color.toUpperCase()}
                                  </p>
                                  <div className="flex justify-between items-center mt-1">
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="text-xs text-purple-600"
                                      onClick={() => setPrimaryColor(color)}
                                    >
                                      Primary
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.05 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="text-xs text-purple-600"
                                      onClick={() => setSecondaryColor(color)}
                                    >
                                      Secondary
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      className="text-gray-400 hover:text-gray-600"
                                      onClick={() =>
                                        copyToClipboard(color, "hex")
                                      }
                                    >
                                      <FiCopy size={12} />
                                    </motion.button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-400">
                            <p>No colors extracted yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "contrast" && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">
                      Contrast Checker
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            Foreground
                          </span>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: primaryColor }}
                            />
                            <span className="text-xs font-mono">
                              {primaryColor.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <HexColorPicker
                          color={primaryColor}
                          onChange={setPrimaryColor}
                          className="w-full h-40 rounded-lg border border-gray-200"
                        />
                        <HexColorInput
                          color={primaryColor}
                          onChange={setPrimaryColor}
                          prefixed
                          className="w-full p-2 border border-gray-200 rounded-md font-mono text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-500">
                            Background
                          </span>
                          <div className="flex items-center space-x-2">
                            <div
                              className="w-4 h-4 rounded-full border border-gray-200"
                              style={{ backgroundColor: secondaryColor }}
                            />
                            <span className="text-xs font-mono">
                              {secondaryColor.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <HexColorPicker
                          color={secondaryColor}
                          onChange={setSecondaryColor}
                          className="w-full h-40 rounded-lg border border-gray-200"
                        />
                        <HexColorInput
                          color={secondaryColor}
                          onChange={setSecondaryColor}
                          prefixed
                          className="w-full p-2 border border-gray-200 rounded-md font-mono text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium">Contrast Ratio</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            tinycolor.readability(
                              primaryColor,
                              secondaryColor
                            ) >= 4.5
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tinycolor
                            .readability(primaryColor, secondaryColor)
                            .toFixed(2)}
                          :1
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            WCAG AA (Normal Text)
                          </span>
                          <span className="text-xs font-medium">
                            {tinycolor.readability(
                              primaryColor,
                              secondaryColor
                            ) >= 4.5
                              ? "✅ Pass"
                              : "❌ Fail"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            WCAG AA (Large Text)
                          </span>
                          <span className="text-xs font-medium">
                            {tinycolor.readability(
                              primaryColor,
                              secondaryColor
                            ) >= 3
                              ? "✅ Pass"
                              : "❌ Fail"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            WCAG AAA (Normal Text)
                          </span>
                          <span className="text-xs font-medium">
                            {tinycolor.readability(
                              primaryColor,
                              secondaryColor
                            ) >= 7
                              ? "✅ Pass"
                              : "❌ Fail"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {showContrastGrid && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Contrast Grid
                      </h3>
                      <div className="overflow-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="p-2"></th>
                              {[
                                primaryColor,
                                secondaryColor,
                                "#ffffff",
                                "#000000",
                                ...(savedPalettes[0]?.colors?.slice(0, 3) ||
                                  []),
                              ].map((color) => (
                                <th key={color} className="p-2">
                                  <div
                                    className="w-8 h-8 mx-auto rounded border border-gray-200"
                                    style={{ backgroundColor: color }}
                                  />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              primaryColor,
                              secondaryColor,
                              "#ffffff",
                              "#000000",
                              ...(savedPalettes[0]?.colors?.slice(0, 3) || []),
                            ].map((rowColor) => (
                              <tr key={rowColor}>
                                <td className="p-2">
                                  <div
                                    className="w-8 h-8 mx-auto rounded border border-gray-200"
                                    style={{ backgroundColor: rowColor }}
                                  />
                                </td>
                                {[
                                  primaryColor,
                                  secondaryColor,
                                  "#ffffff",
                                  "#000000",
                                  ...(savedPalettes[0]?.colors?.slice(0, 3) ||
                                    []),
                                ].map((colColor) => {
                                  const ratio = tinycolor.readability(
                                    rowColor,
                                    colColor
                                  );
                                  return (
                                    <td
                                      key={`${rowColor}-${colColor}`}
                                      className={`p-2 text-center text-xs font-mono ${
                                        ratio >= 7
                                          ? "bg-green-50 text-green-800"
                                          : ratio >= 4.5
                                          ? "bg-yellow-50 text-yellow-800"
                                          : "bg-red-50 text-red-800"
                                      }`}
                                    >
                                      {ratio.toFixed(1)}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Notification Toast */}
      <AnimatePresence>
        {copiedNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50"
          >
            {copiedNotification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
