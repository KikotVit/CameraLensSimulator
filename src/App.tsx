import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevice, useCameraFormat, useCameraPermission } from 'react-native-vision-camera';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

const MainLayout = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { bottom, left, right, top } = useSafeAreaInsets();

  // Стани для управління камерою та параметрами
  const [focalLength, setFocalLength] = useState<number | null>(null);
  const [fieldOfView, setFieldOfView] = useState<number | null>(null);
  const [sensorDiagonal, setSensorDiagonal] = useState<number | null>(null);
  const [equivalentFocalLength, setEquivalentFocalLength] = useState<number | null>(null);
  const [selectedLens, setSelectedLens] = useState<number>(24);
  const [zoom, setZoom] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');

  const cameraRef = useRef<Camera | null>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  // Запит дозволу на використання камери
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Вибір задньої камери (ширококутної)
  const device = useCameraDevice('back', {
    physicalDevices: ['wide-angle-camera'],
  });

  // Дебагінг доступних форматів
  useEffect(() => {
    if (device) {
      console.log('Доступні формати камери:', JSON.stringify(device.formats, null, 2));
    }
  }, [device]);

  // Вибір формату з чітким пріоритетом співвідношення сторін
  const format = useCameraFormat(device, [
    { videoAspectRatio: aspectRatio === '4:3' ? 4 / 3 : 16 / 9 },
    { videoResolution: { width: 1920, height: 1080 } },
    { videoResolution: { width: 1440, height: 1080 } },
    { videoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);

  // Дебагінг обраного формату
  useEffect(() => {
    if (format) {
      console.log('Обраний формат:', JSON.stringify(format, null, 2));
    }
  }, [format]);

  // Отримання фокусної відстані та кута огляду
  useEffect(() => {
    if (format) {
      console.log('format: ', format);
      setFocalLength(format.focalLength || 4.25); // Запасне значення, якщо focalLength недоступний
      setFieldOfView(format.fieldOfView || null); // Отримуємо кут огляду
    }
  }, [format]);

  // Обчислення розміру сенсора та еквівалентної фокусної відстані
  useEffect(() => {
    if (!focalLength || !fieldOfView) {
      setSensorDiagonal(7.356); // Запасне значення, якщо дані недоступні
      return;
    }

    // Обчислення ширини сенсора (по горизонталі)
    const horizontalSensorSize = 2 * focalLength * Math.tan((fieldOfView * Math.PI / 180) / 2);

    // Обчислення діагоналі сенсора на основі співвідношення сторін
    const aspectRatioValue = aspectRatio === '4:3' ? 4 / 3 : 16 / 9;
    const verticalSensorSize = horizontalSensorSize / aspectRatioValue;
    const diagonalSensorSize = Math.sqrt(
      horizontalSensorSize ** 2 + verticalSensorSize ** 2
    );

    setSensorDiagonal(diagonalSensorSize);

    // Обчислення кроп-фактора та еквівалентної фокусної відстані
    const fullFrameDiagonal = 43.3; // Діагональ повнокадрового сенсора
    const cropFactor = fullFrameDiagonal / diagonalSensorSize;
    const equivalent = focalLength * cropFactor;
    setEquivalentFocalLength(equivalent);

    // Обчислення зуму
    const zoomFactor = selectedLens / equivalent;
    setZoom(Math.max(1, zoomFactor));
  }, [focalLength, fieldOfView, aspectRatio, selectedLens]);

  if (!hasPermission || !device) {
    return null;
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
      }}
    >
      <View style={[styles.cameraContainer]}>
        <Camera
          key={aspectRatio}
          ref={cameraRef}
          format={format}
          resizeMode="contain"
          zoom={zoom}
          style={{ flex: 1 }}
          device={device}
          isActive={true}
        />
      </View>

      <View style={styles.controlsContainer}>
        {/* Вибір співвідношення сторін */}
        <View style={styles.aspectRatioContainer}>
          <Text style={styles.label}>Співвідношення сторін:</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, aspectRatio === '4:3' ? styles.buttonActive : null]}
              onPress={() => setAspectRatio('4:3')}
            >
              <Text style={styles.buttonText}>4:3</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, aspectRatio === '16:9' ? styles.buttonActive : null]}
              onPress={() => setAspectRatio('16:9')}
            >
              <Text style={styles.buttonText}>16:9</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Вибір повнокадрового об’єктива */}
        <View style={styles.lensContainer}>
          <Text style={styles.label}>Об'єктив:</Text>
          <Picker
            selectedValue={selectedLens}
            style={styles.picker}
            onValueChange={(value) => setSelectedLens(value)}
          >
            <Picker.Item color="white" label="24 мм" value={24} />
            <Picker.Item color="white" label="35 мм" value={35} />
            <Picker.Item color="white" label="50 мм" value={50} />
          </Picker>
        </View>

        {/* Інформація */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Фокусна відстань: {focalLength?.toFixed(2)} мм</Text>
          <Text style={styles.infoText}>Кут огляду: {fieldOfView?.toFixed(2) || 'Н/Д'}°</Text>
          <Text style={styles.infoText}>
            Діагональ сенсора: {sensorDiagonal?.toFixed(2) || 'Н/Д'} мм
          </Text>
          <Text style={styles.infoText}>
            Еквівалент FF: {equivalentFocalLength?.toFixed(2) || 'Н/Д'} мм
          </Text>
          <Text style={styles.infoText}>Зум: {zoom.toFixed(2)}x</Text>
          <Text style={styles.infoText}>Співвідношення: {aspectRatio}</Text>
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
    flex: 0.7,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  controlsContainer: {
    flex: 0.3,
    padding: 12,
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
  picker: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    borderRadius: 5,
  },
  infoText: {
    color: 'white',
    fontSize: 14,
  },
});