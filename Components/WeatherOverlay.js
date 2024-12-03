import { styled } from "nativewind";
import { View, Text } from "react-native";

const WeatherOverlay = ({
  cityName,
  temperature,
  weatherDescription,
  isLoading,
}) => {
  return (
    <>
      <Text
        className="text-white text-2xl font-bold mb-1"
        style={{ color: "white" }}
      >
        {cityName || "Loading location..."}
      </Text>
      {isLoading ? (
        <Text className="text-white text-lg">Loading weather...</Text>
      ) : (
        <View>
          <Text className="text-white text-xl">{temperature}°C</Text>
          <Text className="text-gray-300 text-lg capitalize">
            {weatherDescription}
          </Text>
        </View>
      )}
    </>
  );
};

export default WeatherOverlay;
