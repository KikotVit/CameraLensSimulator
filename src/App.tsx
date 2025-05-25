import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Camera, useCameraDevice, CameraDeviceFormat } from 'react-native-vision-camera';
import { Picker } from '@react-native-picker/picker';

const CAMERAS = [
  { label: 'Canon R8 (Full Frame)', cropFactor: 1.0 },
  { label: 'Canon R7 (APS-C)', cropFactor: 1.6 },
];

const LENS_OPTIONS = [
  { label: '24mm', focalLength: 24 },
  { label: '35mm', focalLength: 35 },
  { label: '50mm', focalLength: 50 },
  { label: '85mm', focalLength: 85 },
];

const ASPECT_RATIOS = [
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '1:1', value: 1 },
];

export default function App() {
  const device = useCameraDevice('back');
  const [hasPermission, setHasPermission] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [phoneFocalLength, setPhoneFocalLength] = useState(26); // Example focal length
  const [selectedCamera, setSelectedCamera] = useState(CAMERAS[0].label);
  const [selectedLens, setSelectedLens] = useState(LENS_OPTIONS[0].label);
  const [selectedFormat, setSelectedFormat] = useState<CameraDeviceFormat | undefined>(undefined);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(ASPECT_RATIOS[0].label);
  const [orientation, setOrientation] = useState('portrait');

  // Handle orientation changes
  useEffect(() => {
    const updateOrientation = () => {
      const { width, height } = Dimensions.get('window');
      setOrientation(width > height ? 'landscape' : 'portrait');
    };
    updateOrientation();
    const subscription = Dimensions.addEventListener('change', updateOrientation);
    return () => subscription.remove();
  }, []);

  // Request camera permission
  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      setHasPermission(permission === 'granted');
    })();
  }, []);

  // Select camera format based on aspect ratio
  useEffect(() => {
    if (device && device.formats.length > 0) {
      const selectedRatio = ASPECT_RATIOS.find(r => r.label === selectedAspectRatio)?.value || 4 / 3;
      const format = device.formats.find((f) => {
        const formatAspectRatio = f.videoWidth / f.videoHeight;
        return Math.abs(formatAspectRatio - selectedRatio) < 0.1;
      }) || device.formats[0];
      setSelectedFormat(format);
    }
  }, [device, selectedAspectRatio]);

  // Calculate zoom
  useEffect(() => {
    const camera = CAMERAS.find(c => c.label === selectedCamera);
    const lens = LENS_OPTIONS.find(l => l.label === selectedLens);

    if (camera && lens && phoneFocalLength) {
      const targetEq = lens.focalLength * camera.cropFactor;
      const calculatedZoom = targetEq / phoneFocalLength;
      setZoom(Math.min(Math.max(device?.minZoom || 1, calculatedZoom), device?.maxZoom || 16));
    }
  }, [selectedCamera, selectedLens, phoneFocalLength, device]);

  // Calculate camera view dimensions based on format
  const getCameraDimensions = () => {
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    const aspectRatio = selectedFormat ? selectedFormat.videoWidth / selectedFormat.videoHeight : 4 / 3;

    let cameraWidth = screenWidth * 0.8; // Use 80% of screen width
    let cameraHeight = cameraWidth / aspectRatio;

    // Adjust if height exceeds screen height
    if (cameraHeight > screenHeight * 0.8) {
      cameraHeight = screenHeight * 0.8;
      cameraWidth = cameraHeight * aspectRatio;
    }

    return { width: cameraWidth, height: cameraHeight };
  };

  if (!device || !hasPermission) {
    return <Text style={styles.text}>Waiting for camera permission...</Text>;
  }

  const cameraDimensions = getCameraDimensions();

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Camera
          style={[styles.camera, {
            width: cameraDimensions.width,
            height: cameraDimensions.height,
          }]}
          device={device}
          isActive={true}
          zoom={zoom}
          format={selectedFormat}
        />
      </View>
      <View style={[styles.pickerContainer, orientation === 'landscape' ? styles.pickerContainerLandscape : {}]}>
        <Text style={styles.label}>Select Camera</Text>
        <Picker
          selectedValue={selectedCamera}
          onValueChange={(itemValue) => setSelectedCamera(itemValue)}
          style={styles.picker}
        >
          {CAMERAS.map((cam) => (
            <Picker.Item key={cam.label} label={cam.label} value={cam.label} />
          ))}
        </Picker>

        <Text style={styles.label}>Select Lens</Text>
        <Picker
          selectedValue={selectedLens}
          onValueChange={(itemValue) => setSelectedLens(itemValue)}
          style={styles.picker}
        >
          {LENS_OPTIONS.map((lens) => (
            <Picker.Item key={lens.label} label={lens.label} value={lens.label} />
          ))}
        </Picker>

        <Text style={styles.label}>Select Format</Text>
        <Picker
          selectedValue={selectedAspectRatio}
          onValueChange={(itemValue) => setSelectedAspectRatio(itemValue)}
          style={styles.picker}
        >
          {ASPECT_RATIOS.map((ratio) => (
            <Picker.Item key={ratio.label} label={ratio.label} value={ratio.label} />
          ))}
        </Picker>

        <Text style={styles.debugText}>
          Zoom: {zoom.toFixed(2)}x | {selectedLens} on {selectedCamera} | Format: {selectedAspectRatio}
          {selectedFormat ? ` (${selectedFormat.videoWidth}x${selectedFormat.videoHeight})` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black', // Black letterbox
  },
  camera: {
    borderWidth: 1,
    borderColor: 'white', // Optional: visual border for clarity
  },
  text: {
    marginTop: 100,
    textAlign: 'center',
    fontSize: 18,
    color: 'white',
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingVertical: 10,
  },
  pickerContainerLandscape: {
    bottom: 'auto',
    top: 20,
    right: 20,
    width: 250,
    paddingHorizontal: 10,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 5,
  },
  picker: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    marginBottom: 10,
    borderRadius: 5,
  },
  debugText: {
    color: 'white',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
});