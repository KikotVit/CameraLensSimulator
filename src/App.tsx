import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
} from 'react-native-vision-camera';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import Exif from 'react-native-exif';

const MainLayout = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { bottom, left, right, top } = useSafeAreaInsets();
	

  // States for camera and parameter management
  const [equivalentFocalLength, setEquivalentFocalLength] = useState<
    number | null
  >(null);
  const [selectedLens, setSelectedLens] = useState<number>(24);
  const [zoom, setZoom] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');
  const [isPhotoTaken, setIsPhotoTaken] = useState<boolean>(false);
  const [selectedCameraType, setSelectedCameraType] = useState<
    'wide-angle-camera' | 'ultra-wide-angle-camera'
  >('wide-angle-camera');
  const [isAutoPhotoPending, setIsAutoPhotoPending] = useState<boolean>(false);

  const cameraRef = useRef<Camera | null>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  // Request camera permission
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Detect available cameras
  const wideCamera = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera'],
  });
  const ultraWideCamera = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera'],
  });

  // List of available lenses
  const availableLenses = ultraWideCamera ? [16, 24, 35, 50] : [35, 50];

  // Select camera depending on selected lens
  const device = (() => {
    if (!wideCamera) {
      return undefined;
    }
    if (selectedLens < 28 && ultraWideCamera) {
      return ultraWideCamera;
    }
    return wideCamera;
  })();

  // Select format with priority for photo mode and high resolution
  const format = useCameraFormat(device, [
    { photoAspectRatio: aspectRatio === '4:3' ? 4 / 3 : 16 / 9 },
    { photoResolution: 'max' },
    { videoResolution: { width: 1920, height: 1080 } },
    { videoResolution: { width: 1440, height: 1080 } },
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);

  // Function to take a photo and get EXIF
  const takePhoto = async () => {
    if (cameraRef.current && !isPhotoTaken) {
      try {
        const photo = await cameraRef.current.takePhoto({
          enableShutterSound: false,
        });
        const uri = photo.path;
        Exif.getExif(uri)
          .then((exifData: Record<string, unknown >) => {
            if (
              exifData &&
              typeof exifData.exif === 'object' &&
              exifData.exif !== null &&
              '{Exif}' in exifData.exif &&
              typeof (exifData.exif as Record<string, unknown>)['{Exif}'] === 'object'
            ) {
              console.log(
                'EXIF Data:',
                exifData.exif,
              );
              const focalLength35mm = (exifData.exif as Record<string, Record<string, unknown>>)['{Exif}']?.FocalLenIn35mmFilm;
              if (typeof focalLength35mm === 'number') {
                setEquivalentFocalLength(focalLength35mm);
                setIsPhotoTaken(true);
                if (device) {
                  const zoomFactor = selectedLens / focalLength35mm;
                  const adjustedZoom = Math.max(
                    device.minZoom || 1,
                    Math.min(zoomFactor, device.maxZoom || 10),
                  );
                  setZoom(adjustedZoom);
                }
              } else {
                console.log('FocalLengthIn35mmFilm not found in EXIF');
                // Fallback value for ultra-wide camera
                if (selectedCameraType === 'ultra-wide-angle-camera') {
                  setEquivalentFocalLength(13); // Typical value for ultra-wide
                  setIsPhotoTaken(true);
                  const zoomFactor = selectedLens / 13;
                  const adjustedZoom = Math.max(
                    device?.minZoom || 1,
                    Math.min(zoomFactor, device?.maxZoom || 10),
                  );
                  setZoom(adjustedZoom);
                }
              }
            } else {
              console.log('EXIF data structure unexpected:', exifData);
              // Fallback value for ultra-wide camera
              if (selectedCameraType === 'ultra-wide-angle-camera') {
                setEquivalentFocalLength(13); // Typical value for ultra-wide
                setIsPhotoTaken(true);
                const zoomFactor = selectedLens / 13;
                const adjustedZoom = Math.max(
                  device?.minZoom || 1,
                  Math.min(zoomFactor, device?.maxZoom || 10),
                );
                setZoom(adjustedZoom);
              }
            }
          })
          .catch(error => {
            console.error('Error getting EXIF:', error);
          })
          .finally(() => {
            setIsAutoPhotoPending(false); // Reset flag after completion
          });
      } catch (error) {
        console.error('Photo capture error:', error);
        setIsAutoPhotoPending(false); // Reset flag on error
      }
    } else {
      setIsAutoPhotoPending(false); // Reset flag if capture is not possible
    }
  };

  // Update camera type, reset state and trigger auto photo
  useEffect(() => {
    if (!wideCamera || !device) {
      return;
    }

    const newCameraType =
      selectedLens < 28 && ultraWideCamera
        ? 'ultra-wide-angle-camera'
        : 'wide-angle-camera';

    if (newCameraType !== selectedCameraType) {
      // Camera type changed
      setSelectedCameraType(newCameraType);
      setIsPhotoTaken(false);
      setEquivalentFocalLength(null);
      setZoom(
        newCameraType === 'ultra-wide-angle-camera'
          ? ultraWideCamera?.neutralZoom || 1
          : wideCamera.neutralZoom || 1,
      );
      // Trigger auto photo
      setIsAutoPhotoPending(true);
    } else if (equivalentFocalLength) {
      // If camera did not change, recalculate zoom
      const zoomFactor = selectedLens / equivalentFocalLength;
      const adjustedZoom = Math.max(
        device.minZoom || 1,
        Math.min(zoomFactor, device.maxZoom || 10),
      );
      setZoom(adjustedZoom);
    }
  }, [selectedLens, ultraWideCamera, wideCamera, selectedCameraType, device]);

  // Auto photo when isAutoPhotoPending
  useEffect(() => {
    if (isAutoPhotoPending && device && cameraRef.current) {
      takePhoto();
    }
  }, [isAutoPhotoPending, device]);

  if (!hasPermission || !device) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {!hasPermission
            ? 'No permission to use camera'
            : 'Camera unavailable'}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        backgroundColor: '#36454F',
        paddingLeft: left,
        paddingRight: right,
        paddingTop: top || 16,
        paddingBottom: bottom,
        columnGap: 12,
      }}>
      <View style={[styles.cameraContainer]}>
        {equivalentFocalLength === null && (
          <View
            style={{
              backgroundColor: '#2B373F',
              position: 'absolute',
              width: '100%',
              height: '100%',
              zIndex: 2,
            }}>
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <ActivityIndicator animating={equivalentFocalLength === null} />
            </View>
          </View>
        )}

        <Camera
          key={`${aspectRatio}-${selectedCameraType}`}
          ref={cameraRef}
          format={format}
          photo={true}
          resizeMode='contain'
          zoom={zoom}
          style={{ flex: 1, zIndex: 1 }}
          device={device}
          isActive={true}
        />
      </View>

      <View style={styles.controlsContainer}>
        {/* Aspect ratio selection */}
        <View style={styles.aspectRatioContainer}>
          <Text style={styles.label}>Aspect Ratio:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.button,
                aspectRatio === '4:3' ? styles.buttonActive : null,
              ]}
              onPress={() => setAspectRatio('4:3')}>
              <Text style={styles.buttonText}>4:3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                aspectRatio === '16:9' ? styles.buttonActive : null,
              ]}
              onPress={() => setAspectRatio('16:9')}>
              <Text style={styles.buttonText}>16:9</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Full-frame lens selection */}
        <View style={styles.lensContainer}>
          <Text style={styles.label}>Lens:</Text>
          <FlatList
            horizontal
            data={availableLenses}
            keyExtractor={item => item.toString()}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.button,
                  selectedLens === item ? styles.buttonActive : null,
                ]}
                onPress={() => setSelectedLens(item)}>
                <Text style={styles.buttonText}>{item} mm</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            FF Equivalent: {equivalentFocalLength?.toFixed(2) || 'N/A'} mm
          </Text>
          <Text style={styles.infoText}>Zoom: {zoom.toFixed(2)}x</Text>
          <Text style={styles.infoText}>Aspect Ratio: {aspectRatio}</Text>
          <Text style={styles.infoText}>
            Camera:{' '}
            {selectedCameraType === 'ultra-wide-angle-camera'
              ? 'Ultra-wide'
              : 'Wide'}
          </Text>
          <Text style={styles.infoText}>
            Status:{' '}
            {isAutoPhotoPending
              ? 'Updating data...'
              : 'Camera data collected'}
          </Text>
          {wideCamera?.neutralZoom && (
            <Text style={styles.infoText}>
              Neutral Zoom (wide): {wideCamera.neutralZoom.toFixed(2)}x
            </Text>
          )}
          {ultraWideCamera?.neutralZoom && (
            <Text style={styles.infoText}>
              Neutral Zoom (ultra-wide):{' '}
              {ultraWideCamera.neutralZoom.toFixed(2)}x
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

export const App = () => {
  return (
    <SafeAreaProvider>
      <MainLayout />
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 0.8,
    backgroundColor: '#2B373F',
    borderRadius: 10,
    overflow: 'hidden',
  },
  controlsContainer: {
    flex: 0.2,
    flexDirection: 'column',
    alignItems: 'stretch',
    rowGap: 10,
  },
  aspectRatioContainer: {},
  lensContainer: {},
  infoContainer: {},
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 5,
    marginHorizontal: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  buttonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#36454F',
  },
  errorText: {
    color: 'white',
    fontSize: 18,
  },
});
