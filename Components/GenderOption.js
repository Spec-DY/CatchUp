import React from "react";
import { View, TouchableOpacity, Text } from "react-native";

// colors
const COLORS = {
  blue: "#3b82f6",
  gray: "#1f2937",
  dark: "#374151",
};

const GenderOption = ({ type, icon, selected, onSelect }) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect(type)}
      style={styles.container(selected)}
      activeOpacity={0.7}
    >
      <View style={styles.innerCircle}>
        {typeof icon === "string" ? (
          <Text style={styles.emoji}>{icon}</Text>
        ) : (
          icon
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = {
  container: (selected) => ({
    alignItems: "center",
    padding: 4,
    borderRadius: 9999,
    backgroundColor: selected ? COLORS.blue : COLORS.gray,
  }),
  innerCircle: {
    width: 64,
    height: 64,
    borderRadius: 9999,
    backgroundColor: COLORS.dark,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 32,
  },
};

export default GenderOption;
