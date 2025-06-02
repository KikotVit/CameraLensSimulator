import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  StyleSheet,
} from 'react-native';
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Exif from 'react-native-exif';

const getAdjustedZoom = (lens: number, focalLength: number, device: any) => {
  const factor = lens / focalLength;
  return Math.max(device?.minZoom || 1, Math.min(factor, device?.maxZoom || 10));
};

const getFocalLengthFromExif = async (uri: string, selectedCameraType: string): Promise<number | null> => {
  try {
    const exifData = await Exif.getExif(uri);
    const focalLength35mm = exifData?.exif?.['{Exif}']?.FocalLenIn35mmFilm;
    if (typeof focalLength35mm === 'number') return focalLength35mm;
    if (selectedCameraType === 'ultra-wide-angle-camera') return 13;
  } catch (e) {
    console.error('EXIF error:', e);
  }
  return null;
};

export const CameraScreen = () => {
  const insets = useSafeAreaInsets();
  const isDarkMode = useColorScheme() === 'dark';

  const [lens, setLens] = useState(24);
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('4:3');
  const [cropFactor, setCropFactor] = useState(1.0);
  const [equivalentFocal, setEquivalentFocal] = useState<number | null>(null);
  const [cameraType, setCameraType] = useState<'wide-angle-camera' | 'ultra-wide-angle-camera'>('wide-angle-camera');
  const [isPhotoTaken, setPhotoTaken] = useState(false);
  const [isPending, setPending] = useState(false);

  const cameraRef = useRef<Camera | null>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  const wideCamera = useCameraDevice('back', { physicalDevices: ['wide-angle-camera'] });
  
  const ultraWideCamera = useCameraDevice('back', { physicalDevices: ['ultra-wide-angle-camera'] });

  const availableLenses = ultraWideCamera ? [16, 24, 35, 50] : [35, 50];
  const device = lens * cropFactor < 28 && ultraWideCamera ? ultraWideCamera : wideCamera;
  const format = useCameraFormat(device, [
    { photoAspectRatio: aspectRatio === '4:3' ? 4 / 3 : 16 / 9 },
    { photoResolution: 'max', videoResolution: 'max' },
    { fps: 30 },
  ]);

  useEffect(() => {
    requestPermission().then(granted => {
      if (!granted) {
        console.warn('Camera permission not granted');
      }
    });
  }, [requestPermission]);

  useEffect(() => {
    if (!device || !wideCamera) return;

    const newType = lens * cropFactor < 28 && ultraWideCamera ? 'ultra-wide-angle-camera' : 'wide-angle-camera';
    console.log('newType:', newType, 'current cameraType:', cameraType);

    if (newType !== cameraType) {
      console.log('Changing cameraType from', cameraType, 'to', newType);
      setCameraType(newType);
      setPhotoTaken(false);
      setEquivalentFocal(null);
      setZoom((newType === 'ultra-wide-angle-camera' ? ultraWideCamera : wideCamera)?.neutralZoom || 1);
      setPending(true);
    } else if (equivalentFocal) {
      console.log('equivalentFocal:', equivalentFocal);
      setZoom(getAdjustedZoom(lens * cropFactor, equivalentFocal, device));
    }
  }, [lens, cropFactor, ultraWideCamera, wideCamera, cameraType, equivalentFocal, device]);

  useEffect(() => {
    if (isPending && cameraRef.current && device) {
      console.log('Taking photo with device:', device);
      takePhoto();
    }
  }, [isPending, device]);
  
  const takePhoto = async () => {
    if (!cameraRef.current || isPhotoTaken) return;
    try {
      const photo = await cameraRef.current.takePhoto({ enableShutterSound: false });
      const focal = await getFocalLengthFromExif(photo.path, cameraType);
      console.log('cameraType: ', cameraType);
      console.log('focal: ', focal);
      if (focal !== null) {
        setEquivalentFocal(focal);
        setPhotoTaken(true);
        setZoom(getAdjustedZoom(lens, focal, device));
      }
    } finally {
      setPending(false);
    }
  };

  if (!hasPermission || !device) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {!hasPermission ? 'No permission to use camera' : 'Camera unavailable'}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: 16, paddingBottom: 16, paddingLeft: insets.left, paddingRight: insets.right }]}>
      <View style={styles.cameraContainer}>
        {!equivalentFocal && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator />
          </View>
        )}
        <Camera
          key={`${aspectRatio}-${cameraType}`}
          ref={cameraRef}
          format={format}
          photo
          resizeMode='contain'
          zoom={zoom}
          style={{ flex: 1 }}
          device={device}
          isActive
        />
      </View>

      <View style={styles.controlsContainer}>
        {/* Crop factor */}
        <View>
          <Text style={styles.label}>Crop Factor:</Text>
          <FlatList
            horizontal
            data={[
              { label: 'Full Frame (1.0×)', value: 1 },
              { label: 'Canon APS-C (1.6×)', value: 1.6 },
              { label: 'Sony/Nikon APS-C (1.5×)', value: 1.5 },
              { label: 'Micro Four Thirds (2.0×)', value: 2 },
            ]}
            contentContainerStyle={{ gap: 10 }}
            keyExtractor={item => item.value.toString()}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.button, cropFactor === item.value && styles.buttonActive]}
                onPress={() => setCropFactor(item.value)}
              >
                <Text style={styles.buttonText}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
        {/* Aspect Ratio */}
        <View>
          <Text style={styles.label}>Aspect Ratio:</Text>
          <FlatList
            horizontal
            data={['4:3', '16:9']}
            contentContainerStyle={{ gap: 10 }}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.button, aspectRatio === item && styles.buttonActive]}
                onPress={() => setAspectRatio(item)}
              >
                <Text style={styles.buttonText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Lens Selection */}
        <View>
          <Text style={styles.label}>Lens:</Text>
          <FlatList
            horizontal
            data={availableLenses}
            keyExtractor={item => item.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.button, lens === item && styles.buttonActive]}
                onPress={() => setLens(item)}
              >
                <Text style={styles.buttonText}>{item} mm</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Info */}
        <View>
          <Text style={styles.infoText}>FF Equivalent: {(lens * cropFactor)?.toFixed(2) || 'N/A'} mm</Text>
          <Text style={styles.infoText}>Zoom: {(zoom).toFixed(2)}x</Text>
          <Text style={styles.infoText}>Aspect Ratio: {aspectRatio}</Text>
          <Text style={styles.infoText}>Camera: {cameraType.includes('ultra') ? 'Ultra-wide' : 'Wide'}</Text>
          <Text style={styles.infoText}>Status: {isPending ? 'Updating data...' : 'Camera data collected'}</Text>
          {wideCamera?.neutralZoom && (
            <Text style={styles.infoText}>Neutral Zoom (wide): {wideCamera.neutralZoom.toFixed(2)}x</Text>
          )}
          {ultraWideCamera?.neutralZoom && (
            <Text style={styles.infoText}>Neutral Zoom (ultra-wide): {ultraWideCamera.neutralZoom.toFixed(2)}x</Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles =  StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#36454F',
    columnGap: 12,
  },
  cameraContainer: {
    flex: 0.7,
    backgroundColor: '#2B373F',
    borderRadius: 10,
    overflow: 'hidden',
  },
  controlsContainer: {
    flex: 0.3,
    justifyContent: 'flex-start',
    rowGap: 10,
  },
  button: {
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: 'rgba(0,0,0,0.3)',
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
  loadingOverlay: {
    backgroundColor: '#2B373F',
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
