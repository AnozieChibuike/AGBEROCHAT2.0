import * as ImagePicker from "expo-image-picker";
import Modal from "react-native-modal";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import style from "../../constants/style";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import colors from "../../constants/colors";
import { height, width } from "../../constants/scale";
import { Text } from "react-native";
import Button from "../Components/Button";
import base_url from "../../constants/base_url";
import { Alert } from "react-native";
import Input from "../Components/Input";
import deepEqual from "../utils/deepEqual";

export default Profile = ({ navigation, route }) => {
  const { user } = route.params;
  const [prevUserData, setPrevData] = useState({
    id: user.id,
    username: user.username,
    bio: user.bio,
  });
  const [userData, setUserData] = useState({
    id: user.id,
    username: user.username,
    bio: user.bio,
  });
  useEffect(()=>console.log(user),[])
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const handleChange = (text, input) => {
    setUserData((prevState) => ({ ...prevState, [input]: text }));
  };
  const handleError = (error, input) => {
    setErrors((prevState) => ({ ...prevState, [input]: error }));
  };
  const validate = () => {
    Keyboard.dismiss();
    if (deepEqual(prevUserData, userData)) return;
    let isValid = true;
    if (!userData.username) {
      isValid = false;
      handleError("Username cannot be empty", "username");
    }
    if (userData.bio.length > 500) {
      handleError("Bio should not be more than 500 characters", "bio");
    }
    if (isValid) createProfile();
  };

  async function createProfile() {
    setLoading(true);
    try {
      const response = await fetch(`${base_url}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });
      const data = await response.json();
      console.log(data);
      if (data.status === "success") {
        setPrevData({...userData})
        Alert.alert(data.message);
      } else {
        handleError(data.message, "username");
      }
    } catch (error) {
      Alert(error);
    } finally {
      setLoading(false);
    }
  }

  // const [keyboardOffset, setKeyboardOffset] = useState(0);
  // const onKeyboardShow = (event) => {
  //   setKeyboardOffset(event.endCoordinates.height);
  // }
  // const onKeyboardHide = () => setKeyboardOffset(0);
  // const keyboardDidShowListener = useRef();
  // const keyboardDidHideListener = useRef();

  // useEffect(() => {
  //   keyboardDidShowListener.current = Keyboard.addListener(
  //     "keyboardWillShow",
  //     onKeyboardShow
  //   );
  //   keyboardDidHideListener.current = Keyboard.addListener(
  //     "keyboardWillHide",
  //     onKeyboardHide
  //   );

  //   return () => {
  //     keyboardDidShowListener.current.remove();
  //     keyboardDidHideListener.current.remove();
  //   };
  // }, []);

  const [modal, setModal] = useState(false);
  const [uri, setUri] = useState(user["image_url"]);
  const uploadImage = async (mode) => {
    try {
      let result = null;
      if (mode === "gallery") {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
      } else {
        await ImagePicker.requestCameraPermissionsAsync();
        result = await ImagePicker.launchCameraAsync({
          //   cameraType: ImagePicker.CameraType.front,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
      }

      if (!result.canceled) sendToBackend(result.assets[0].uri);
    } catch (error) {
      Alert(error);
    } finally {
      setModal(false);
    }
  };

  const sendToBackend = async (selectedImage) => {
    const formData = new FormData();
    const parts = selectedImage.split(".");

    // The last part of the array will be the file extension
    const fileExtension = parts[parts.length - 1];
    formData.append("pfp", {
      uri: selectedImage,
      type: "image/png",
      name: user.id + "." + fileExtension,
    });
    try {
      const response = await fetch(base_url + "/upload-img", {
        method: "POST",
        body: formData,
      });
      console.log(response);
      const data = await response.json();
      setUri(data.data);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    // <KeyboardAvoidingView
    //   behavior={Platform.OS === "ios" ? "padding" : ""}
    //   style={[
    //     style.container,
    //     { paddingTop: 50 },
    //     //{ opacity: modal ? 0.8 : 1 }
    //   ]}
    // >
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableResetScrollToCoords={false}
      bounces={false}
      contentContainerStyle={style.container}
      contentInsetAdjustmentBehavior="always"
      overScrollMode="always"
      showsVerticalScrollIndicator={true}
      style={{ backgroundColor: "black" }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>
          <View>
            <Text
              style={{
                alignSelf: "center",
                color: "white",
                fontSize: 30,
                marginBottom: 20,
              }}
            >
              Your Profile
            </Text>
            <View style={styles.ImageContainer}>
              <Image
                source={{ uri: uri }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 400,
                }}
              />
              <TouchableOpacity
                onPress={() => setModal(true)}
                disabled={modal || loading}
              >
                <View
                  style={{
                    backgroundColor: "#cccccc",
                    height: 45,
                    width: 45,
                    position: "absolute",
                    bottom: -5,
                    right: 0,
                    borderRadius: 100,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="camera" color="grey" size={30} style={{}} />
                </View>
              </TouchableOpacity>
            </View>
            <Text
              style={{
                alignSelf: "center",
                color: colors.faintBlue,
                fontSize: 30,
                fontWeight: "bold",
              }}
            >
              {user.username}
            </Text>
            <View
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-around",
                marginTop: 10,
              }}
            >
              <View style={{ display: "flex", alignItems: "center" }}>
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 19 }}
                >
                  {user.followers}
                </Text>
                <Text style={{ color: "white" }}>Followers</Text>
              </View>
              <View style={{ display: "flex", alignItems: "center" }}>
                <Text
                  style={{ color: "white", fontWeight: "bold", fontSize: 19 }}
                >
                  {user.following}
                </Text>
                <Text style={{ color: "white" }}>Following</Text>
              </View>
            </View>
          </View>
          <View style={{ marginBottom: 10 }}>
            <Input
              editable={!loading}
              label="Username"
              onChangeText={(text) => handleChange(text, "username")}
              value={userData.username}
              onfocus={() => handleError(null, "username")}
              error={errors.username}
            />
            <Input
              editable={!loading}
              label="Bio"
              multiline
              placeholder="Nothing to see here"
              optionalHeight={100}
              onChangeText={(text) => handleChange(text, "bio")}
              value={userData.bio}
              onfocus={() => handleError(null, "bio")}
              error={errors.bio}
            />
          </View>
          <Button
            text="Update Profile"
            color="white"
            bg={"green"}
            onPress={validate}
            disabled={loading}
          />
          {modal && (
            <Modal isVisible={modal}>
              <View
                style={{
                  height: 100,
                  backgroundColor: "#2b2b2b",
                  justifyContent: "space-around",
                  flexDirection: "row",
                  alignItems: "center",
                  borderRadius: 20,
                }}
              >
                <View>
                  <TouchableOpacity
                    onPress={() => uploadImage()}
                    // disabled={modal}
                  >
                    <View
                      style={{
                        backgroundColor: colors.yellow,
                        height: 45,
                        width: 45,
                        //   position: "absolute",
                        //   bottom: -5,
                        //   right: 0,
                        borderRadius: 100,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="camera"
                        color="white"
                        size={30}
                        style={{}}
                      />
                    </View>
                  </TouchableOpacity>
                  <Text style={{ color: "white" }}>Camera</Text>
                </View>
                <View>
                  <TouchableOpacity
                    onPress={() => uploadImage("gallery")}
                    // disabled={modal}
                  >
                    <View
                      style={{
                        backgroundColor: colors.faintBlue,
                        height: 45,
                        width: 45,
                        borderRadius: 100,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="image"
                        color="white"
                        size={30}
                        style={{}}
                      />
                    </View>
                  </TouchableOpacity>
                  <Text style={{ color: "white" }}>Gallery</Text>
                </View>
                <View>
                  <TouchableOpacity
                    onPress={() => setModal(false)}
                    // disabled={modal}
                  >
                    <View
                      style={{
                        backgroundColor: "#ff0000",
                        height: 45,
                        width: 45,
                        borderRadius: 100,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons
                        name="close"
                        color="white"
                        size={30}
                        style={{}}
                      />
                    </View>
                  </TouchableOpacity>
                  <Text style={{ color: "white" }}>Cancel</Text>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  ImageContainer: {
    position: "relative",
    height: 150,
    width: 150,
    borderRadius: 300,
    borderWidth: 5,
    borderColor: colors.faintBlue,
    alignSelf: "center",
  },
  modal: {
    backgroundColor: "black",
    // height: 300,
    // width: width,
    marginHorizontal: 20,
    backgroundColor: "black",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 5,
  },
});
