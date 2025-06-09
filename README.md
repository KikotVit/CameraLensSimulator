# 📷 Camera Lens FOV Simulator

A React Native CLI app that simulates the field of view (FOV) for different camera lenses using your smartphone's actual camera hardware.

## 🛠️ Tech Stack

- **React Native CLI 0.79.2**
- **React 19 + TypeScript**
- **react-native-vision-camera 4.6**
- **react-native-exif** for native EXIF data
- **react-native-safe-area-context**
- **ESLint + Prettier** setup

## ✅ Features

- Simulates full-frame equivalent focal lengths (e.g., 24mm, 50mm, 85mm).
- Crop factor selection: Full Frame, APS-C, Micro 4/3, etc.
- Smart camera switching (wide vs ultra-wide).
- Auto-calculated zoom based on EXIF focal length.
- Aspect ratio toggle (4:3 / 16:9).
- Live info overlay: selected lens, crop factor, zoom multiplier, active camera type.
- Permission fallback UI with “Open Settings” action.

## 📸 How It Works

1. You select:
   - Desired lens (e.g. 85mm)
   - Crop factor (e.g. 1.6)
   - Aspect ratio
2. App picks the optimal physical camera (e.g., wide-angle).
3. Captures a silent preview image to get actual sensor focal length via **EXIF**.
4. Calculates zoom using:

## 🧭 Planned Features
- Android support — coming soon (currently untested)
- 📷 Snapshot capture with metadata overlay (lens, crop, zoom) — saved to gallery for side-by-side FOV comparison

## 🚀 Getting Started

### Prerequisites

- React Native CLI environment
- Node.js ≥ 18
- iOS: Xcode + CocoaPods
- Android: Android Studio

### Installation

```bash
git clone https://github.com/KikotVit/CameraLensSimulator.git
cd CameraLensSimulator
npm install
npm run pods   # Installs iOS pods
