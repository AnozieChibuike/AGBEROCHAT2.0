// Landing Screen
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import style from "../../constants/style";
import { View } from "react-native";
import Button from "../Components/Button";
import colors from "../../constants/colors";
import { height, width } from "../../constants/scale";
import Logo from "../Components/Logo";
import { useEffect } from "react";

export default Landing = ({ navigation }) => {
  useEffect(() => {
    getUser();
  },[]);
  const getUser = async () => {
    let user = await AsyncStorage.getItem("userData");
    if (user)
     navigation.navigate('Home')
  };

  return (
    <SafeAreaView style={[style.container, { position: "relative" }]}>
      <View
        style={{
          marginTop: height / 5.5,
        }}
      >
        <Logo />
      </View>
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 15,
          right: 15,
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Button
          text="Signup"
          color="white"
          bg={colors.yellow}
          onPress={() => navigation.navigate("Signup")}
        />

        <Button
          text="Login"
          color="white"
          bg={colors.faintBlue}
          onPress={() => navigation.navigate("Login")}
        />
      </View>
    </SafeAreaView>
  );
};
