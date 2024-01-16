// Login Screen
import base_url from '../../../constants/base_url'
import { SafeAreaView } from "react-native-safe-area-context";
import Input from "../../Components/Input";
import Logo from "../../Components/Logo";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import colors from "../../../constants/colors";

export default Login = ({navigation, route}) => {
  const [loading, setLoading] = useState(false);
  const [top, setTop] = useState(50);
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  useEffect(()=>{
    if (route?.params?.message)
      Alert.alert('Message', route.params.message)
  },[])
  const validate = () => {
    Keyboard.dismiss();
    let isValid = true;
    if (!inputs.email) {
      isValid = false;
      handleError("Please input email", "email");
    } else if (!inputs.email.match(/\S+@\S+\.\S+/)) {
      isValid = false;
      handleError("Please input a valid email", "email");
    }
    if (!inputs.password) {
      handleError("Please input a password", "password");
    }
    if (isValid) {
      login();
    }
  };

  const handleChange = (text, input) => {
    setInputs((prevState) => ({ ...prevState, [input]: text }));
  };

  async function login() {
    setLoading(true);
    try {
      const response = await fetch(
        `${base_url}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(inputs)
        }
      );
      const data = await response.json();
      if (data.error) {
        handleError(data.error, data.from)
      } else {
        Alert.alert('Success','Signed in Success but you can"t login now🥹😭')
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  }

  const handleError = (error, input) => {
    setErrors((prevState) => ({ ...prevState, [input]: error }));
  };
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[style.container, { position: "relative" }]}>
        {loading ? (
          <ActivityIndicator
            style={{ position: "absolute", top: "50%", left: "50%" }}
          />
        ) : (
          <>
            <View style={{ marginTop: top }}>
              <Logo text="Login" />
              <Input
              value={inputs.email}
                label="E-mail address"
                onfocus={() => {
                  handleError(null, "email");
                  setTop(0);
                }}
                error={errors.email}
                placeholder="user@example.com"
                onblur={() => {
                  setTop(40);
                }}
                onChangeText={(text) => {
                  handleChange(text, "email");
                }}
              />
              <Input
                value={inputs.password}
                label="Password"
                placeholder="********"
                onfocus={() => {
                  handleError(null, "password");
                  setTop(0);
                }}
                onblur={() => {
                  setTop(40);
                }}
                error={errors.password}
                onChangeText={(text) => {
                  handleChange(text, "password");
                }}
                password={true}
              />
              <View style={{display: 'flex', flexDirection: 'row', marginTop: 10}}>
                <Text style={{ color: "grey" }}>Don't have an account? </Text>
                <TouchableOpacity onPress={()=> navigation.navigate('Signup')}>
                  <Text style={{ color: colors.yellow }}>SignUp</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 30,
                left: 15,
                right: 15,
                alignSelf: "flex-end",
                // flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Button
                text="Login"
                color="white"
                bg={colors.yellow}
                onPress={validate}
              />
            </View>
          </>
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};
