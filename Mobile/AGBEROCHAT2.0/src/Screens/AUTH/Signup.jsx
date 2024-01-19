// SignUp Screen

import { SafeAreaView } from "react-native-safe-area-context";
import Input from "../../Components/Input";
import Logo from "../../Components/Logo";
import { useState } from "react";
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
import base_url from "../../../constants/base_url";

export default Signup = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [top, setTop] = useState(30);
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [errors, setErrors] = useState({});

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
    if (!inputs.username) {
      isValid = false;
      handleError("Please input username", "username");
    }
    if (!inputs.password) {
      handleError("Please input a password", "password");
    } else if (inputs.password.length < 8) {
      isValid = false;
      handleError("Min Password length of 8", "password");
    }
    if (isValid) {
      register();
    }
  };

  const handleChange = (text, input) => {
    setInputs((prevState) => ({ ...prevState, [input]: text }));
  };

  async function register() {
    setLoading(true);
    try {
      const response = await fetch(`${base_url}/api/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });
      const data = await response.json();
      if (data.error) {
        handleError(data.error, data.from);
      } else {
        navigation.navigate("Login", { message: "Registration successful" });
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
              <Logo text="Signup" />
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
                  setTop(10);
                }}
                onChangeText={(text) => {
                  handleChange(text, "email");
                }}
              />
              <Input
                value={inputs.username}
                label="Username"
                placeholder="John Doe"
                onfocus={() => {
                  handleError(null, "username");
                  setTop(0);
                }}
                onblur={() => {
                  setTop(10);
                }}
                error={errors.username}
                onChangeText={(text) => {
                  handleChange(text, "username");
                }}
              />
              <Input
                value={inputs.password}
                label="Password"
                placeholder="********"
                onfocus={() => {
                  handleError(null, "password");
                  setTop(-150);
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
              <View
                style={{ display: "flex", flexDirection: "row", marginTop: 10 }}
              >
                <Text style={{ color: "grey" }}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={{ color: colors.yellow }}>Log in</Text>
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
                text="Signup"
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
