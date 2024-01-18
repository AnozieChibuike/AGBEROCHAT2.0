import { Image, Text, View } from "react-native";
import LogO from "../../assets/Logo.gif";

export default Logo = ({text}) => {
  return (
    <View style={{ display: "flex", alignItems: "center", marginBottom: 20 }}>
      <Image style={{ height: 120, width: 120 }} source={LogO} />
      <Text style={{ color: "white", fontWeight: "bold", fontSize: 30 }}>
        {text ? text : 'AgberoChat 2.0'}
      </Text>
    </View>
  );
};
