import { SafeAreaView, StatusBar, Platform, View } from "react-native";

const SafeAreaContainer = ({ children, style }) => {
  if (Platform.OS === "ios") {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: "black" }, style]}>
        {children}
      </SafeAreaView>
    );
  }

  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: "black",
          paddingTop: StatusBar.currentHeight,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default SafeAreaContainer;
