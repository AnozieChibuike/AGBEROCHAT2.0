import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default Button = ({ text, color, bg, ...props }) => {
  return (
    <View style={{ display: "flex", flexDirection: "row", }}>
      <TouchableOpacity
        style={[style.button, { backgroundColor: bg }]}
        {...props}
      >
        <Text style={{ color: color }}>{text}</Text>
      </TouchableOpacity>
    </View>
  );
};

const style = StyleSheet.create({
  button: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    flex: 1,
    marginBottom: 20,
    
  },
});
