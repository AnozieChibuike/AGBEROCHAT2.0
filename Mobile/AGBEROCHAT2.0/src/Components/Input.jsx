import { TextInput, Text, View, StyleSheet } from "react-native";
import { useState } from "react";
import colors from "../../constants/colors";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default Input = ({
  label,
  error,
  onfocus = () => {},
  onblur = ()=>{},
  password,
  optionalHeight,
  ...props
}) => {
    const [focused, setFocused] = useState(false)
    const [passwordState, setPasswordState] = useState(password);
  return (
    <View style={{marginTop: 15,}}>
        <Text style={{ color: 'white' }}>{label}</Text>
        <View
          style={[
            styles.inputContainer,
            { borderColor: focused ? colors.yellow : error ? "red" :  colors.faintBlue, height: optionalHeight ? optionalHeight : 50 },
          ]}
        >
          <TextInput
          secureTextEntry={passwordState}
          placeholderTextColor='grey'
            onFocus={()=> {
                onfocus()
                setFocused(true)
            }}
            
            onBlur={()=> {
              onblur()
                setFocused(false)
            }}
            autoCorrect={false}
            style={{ color: "white", fontSize: 17,flex: 1, height: '100%' }}
            {...props}
            // onPressIn={()=> console.log(9}
          ></TextInput>
          {password && (
            <Icon
              onPress={() => setPasswordState(!passwordState)}
              name={passwordState ? "eye-outline" : "eye-off-outline"}
              color='grey'
              size={23}
            />
          )}
        </View>
        {error && <Text style={{ color: "red" }}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    display: "flex",
    justifyContent: "space-between",
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 7,
    marginVertical: 5,    
    paddingLeft: 10,
  },
});
