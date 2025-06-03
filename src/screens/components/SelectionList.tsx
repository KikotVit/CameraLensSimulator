import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button } from '../../components/button/button';

interface ISelectionListProps {
  data: { label: string; value: number }[];
  label?: string;
  activeValue?: number;
  onPress: (value: number) => void;
} 

export const SelectionList = (props: ISelectionListProps) => {

  const { activeValue, onPress, label, data } = props;
  return (
    <View>
      {
        label && <Text style={styles.label}>{label}</Text>
      }
      <FlatList
        horizontal
        data={data}
        contentContainerStyle={{ gap: 10 }}
        keyExtractor={item => item.value.toString()}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Button
            text={item.label}
            onPress={() => onPress(item.value)}
            textStyle={styles.buttonText}
            disabled={activeValue === item.value}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
});
