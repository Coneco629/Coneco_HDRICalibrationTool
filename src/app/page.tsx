"use client";

import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import Images from "./images";
import CroppingResizingViewSettings from "./cropping-resizing-view-settings";
import Navigation from "./navigation";
import Response_and_correction from "./response_and_correction";

const DEBUG = true;
const fakePipeline = false;

export default function Home() {
  // Get default binary paths to populate settings fields based on OS
  useEffect(() => {
    let osPlatform = "";
    // Make a call to the backend to get OS platform
    invoke<string>("query_os_platform", {})
      .then((platform: any) => {
        if (DEBUG) {
          console.log("OS platform successfully queried:", platform);
        }
        // Default path for macOS and Linux
        let radianceDefaultPath = "/usr/local/radiance/bin";
        // If platform is windows, update default path
        if (osPlatform === "windows") {
          radianceDefaultPath = "C:\\Radiance\\bin";
        }
        // Update settings
        setSettings({
          radiancePath: radianceDefaultPath,
          hdrgenPath: "",
          raw2hdrPath: "",
          outputPath: settings.outputPath,
        });
      })
      .catch(() => {
        console.error;
      });
  }, []);

  // Holds the fisheye coordinates and view settings
  const [viewSettings, setViewSettings] = useState({
    // xres: "",
    // yres: "",
    diameter: "",
    xleft: "",
    ydown: "",
    vv: "",
    vh: "",
    targetRes: "1000",
  });

  // display states
  const [progressButton, setProgressButton] = useState<boolean>(false);
  const [processError, setProcessError] = useState<boolean>(false);
  const [showProgress, setShowProgress] = useState<boolean>(false);

  // PATH AND FILE INFORMATION

  // const [imgDirs, setImgDirs] = useState<any[]>([]);
  let imgDirs: any | any[] = [];
  // Holds the file paths for the backend
  const [devicePaths, setDevicePaths] = useState<any[]>([]);
  const [responsePaths, setResponsePaths] = useState<string>("");
  // Correction files fe = fish eye, v= vignetting, nd = neutral density, cf = calibration factor
  const [fe_correctionPaths, set_fe_correctionPaths] = useState<string>("");
  const [v_correctionPaths, set_v_correctionPaths] = useState<string>("");
  const [nd_correctionPaths, set_nd_correctionPaths] = useState<string>("");
  const [cf_correctionPaths, set_cf_correctionPaths] = useState<string>("");

  const [settings, setSettings] = useState({
    radiancePath: "",
    hdrgenPath: "",
    raw2hdrPath: "",
    outputPath: "/home/hdri-app/",
  });

  const handleSettingsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedSettings = JSON.parse(JSON.stringify(settings));
    updatedSettings[event.currentTarget.name] = event.currentTarget.value;
    setSettings(updatedSettings);
  };

  // Reset progress
  function ResetProgress() {
    setShowProgress(false);
    setProgressButton(false);
    setProcessError(false);
  }

  // Update view settings (for cropping, resizing, header editing)
  // when the user enters updates a number input
  const handleViewSettingsChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const updatedViewSettings = JSON.parse(JSON.stringify(viewSettings));
    updatedViewSettings[event.currentTarget.name] = event.currentTarget.value;
    setViewSettings(updatedViewSettings);
  };

  // HARD CODED PATHS FOR TESTING

  // Hardcoded radiance and hdrgen paths
  const fakeRadiancePath = "/usr/local/radiance/bin/";
  const fakeHdrgenPath = "/usr/local/bin/";
  // Hardcoded output path
  const fakeOutputPath = "../output/";

  // Calls the BE pipeline function with the input images the user
  // selected, and hardcoded data for the rest of the inputs
  const handleGenerateHDRImage = () => {
    // Progress
    setShowProgress(true);
    invoke<string>("pipeline", {
      radiancePath: settings.radiancePath,
      hdrgenPath: settings.hdrgenPath,
      raw2hdrPath: settings.raw2hdrPath,
      outputPath: settings.outputPath,
      inputImages: devicePaths,
      responseFunction: responsePaths,
      fisheyeCorrectionCal: fe_correctionPaths,
      vignettingCorrectionCal: v_correctionPaths,
      photometricAdjustmentCal: cf_correctionPaths,
      neutralDensityCal: nd_correctionPaths,
      diameter: viewSettings.diameter,
      xleft: viewSettings.xleft,
      ydown: viewSettings.ydown,
      xdim: viewSettings.targetRes,
      ydim: viewSettings.targetRes,
      verticalAngle: viewSettings.vv,
      horizontalAngle: viewSettings.vh,
    })
      .then((result: any) => console.log("Process finished. Result: ", result))
      .then(() => {
        if (!fakePipeline) {
          setProgressButton(true);
        }
      })
      .catch((error: any) => {
        console.error;
        if (!fakePipeline) {
          setProcessError(true);
        }
      });
  };

  function setConfig(config: any) {
    setResponsePaths(config.responsePaths);
    set_fe_correctionPaths(config.fe_correctionPaths);
    set_v_correctionPaths(config.v_correctionPaths);
    set_nd_correctionPaths(config.nd_correctionPaths);
    set_cf_correctionPaths(config.cf_correctionPaths);
    setViewSettings({
      diameter: config.diameter,
      xleft: config.xleft,
      ydown: config.ydown,
      // xres: viewSettings.xres,
      // yres: viewSettings.yres,
      targetRes: config.targetRes,
      vh: config.vh,
      vv: config.vv,
    });
  }

  return (
    <main className="bg-white flex min-h-screen flex-col items-center justify-between text-black">
      <div>
        <Navigation
          responsePaths={responsePaths}
          fe_correctionPaths={fe_correctionPaths}
          v_correctionPaths={v_correctionPaths}
          nd_correctionPaths={nd_correctionPaths}
          cf_correctionPaths={cf_correctionPaths}
          viewSettings={viewSettings}
          setConfig={setConfig}
          settings={settings}
          setSettings={setSettings}
          handleSettingsChange={handleSettingsChange}
          handleGenerateHDRImage={handleGenerateHDRImage}
          showProgress={showProgress}
          fakePipeline={fakePipeline}
          setProgressButton={setProgressButton}
          setProcessError={setProcessError}
          progressButton={progressButton}
          processError={processError}
          ResetProgress={ResetProgress} />
        <div className="w-3/4 ml-auto pl-3">
          <h1 className="font-bold pt-10">Configuration</h1>
          <Images devicePaths={devicePaths} setDevicePaths={setDevicePaths} />
          <div id="c_r_v">
            <CroppingResizingViewSettings
              viewSettings={viewSettings}
              handleChange={handleViewSettingsChange}
            />
            <Response_and_correction
              responsePaths={responsePaths}
              fe_correctionPaths={fe_correctionPaths}
              v_correctionPaths={v_correctionPaths}
              nd_correctionPaths={nd_correctionPaths}
              cf_correctionPaths={cf_correctionPaths}
              setResponsePaths={setResponsePaths}
              set_fe_correctionPaths={set_fe_correctionPaths}
              set_v_correctionPaths={set_v_correctionPaths}
              set_nd_correctionPaths={set_nd_correctionPaths}
              set_cf_correctionPaths={set_cf_correctionPaths}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
