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

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  

  // Стани для управління камерою та параметрами
  const [focalLength, setFocalLength] = useState<number | null>(null);
  const [sensorDiagonal, setSensorDiagonal] = useState<number>(7.356);
  const [equivalentFocalLength, setEquivalentFocalLength] = useState<number | null>(null);
  const [selectedLens, setSelectedLens] = useState<number>(24);
  const [zoom, setZoom] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<string>('4:3');

  const cameraRef = useRef<Camera | null>(null);
  const { hasPermission, requestPermission } = useCameraPermission();

  // Запит дозволу на використання камери
  useEffect(() => {
    if (!hasPermission) {requestPermission();}
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
    { videoResolution: { width: 1920, height: 1080 } }, // Спробувати 1080p
    { videoResolution: { width: 1440, height: 1080 } }, // Альтернатива для 4:3
    { videoResolution: { width: 1280, height: 720 } }, // Спробувати 720p
    { fps: 30 },
  ]);

  // Дебагінг обраного формату
  useEffect(() => {
    if (format) {
      console.log('Обраний формат:', JSON.stringify(format, null, 2));
    }
  }, [format]);

  // Отримання фізичної фокусної відстані
  useEffect(() => {
    if (format?.focalLength) {
      setFocalLength(format.focalLength);
    } else {
      setFocalLength(4);
    }
  }, [format]);

  // Розрахунок еквівалентної фокусної відстані та зуму
  useEffect(() => {
    if (!focalLength) {return;}

    const fullFrameDiagonal = 43.3;
    const cropFactor = fullFrameDiagonal / sensorDiagonal;
    const equivalent = focalLength * cropFactor;
    setEquivalentFocalLength(equivalent);

    const zoomFactor = selectedLens / equivalent;
    setZoom(Math.max(1, zoomFactor));
  }, [focalLength, sensorDiagonal, selectedLens]);

  if (!hasPermission || !device) {return null;}

  return (
    <SafeAreaView style={{ flex: 1, flexDirection: 'row', padding: 16 }}>
      <View style={[styles.cameraContainer]}>
        <Camera
          key={aspectRatio} // Примусове оновлення компонента при зміні aspectRatio
          ref={cameraRef}
          format={format}
          resizeMode="contain"
          zoom={zoom}
          style={{flex: 1,}}
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
            <Picker.Item label="24 мм" value={24} />
            <Picker.Item label="35 мм" value={35} />
            <Picker.Item label="50 мм" value={50} />
          </Picker>
        </View>

        {/* Інформація */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Фокусна відстань: {focalLength?.toFixed(2)} мм</Text>
          <Text style={styles.infoText}>Діагональ сенсора: {sensorDiagonal.toFixed(2)} мм</Text>
          <Text style={styles.infoText}>Еквівалент FF: {equivalentFocalLength?.toFixed(2)} мм</Text>
          <Text style={styles.infoText}>Зум: {zoom.toFixed(2)}x</Text>
          <Text style={styles.infoText}>Співвідношення: {aspectRatio}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    padding: 16,
    flex: 1,
    overflow: 'hidden',
  },
  controlsContainer: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  aspectRatioContainer: {
    marginBottom: 10,
  },
  lensContainer: {
    marginBottom: 10,
  },
  infoContainer: {
    marginTop: 10,
  },
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
    color: 'black',
    fontSize: 16,
  },
  label: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  picker: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'black',
    borderRadius: 5,
  },
  infoText: {
    color: 'black',
    fontSize: 14,
    marginVertical: 2,
  },
});

export default App;
