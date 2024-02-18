import * as ImagePicker from "expo-image-picker";
import Modal from "react-native-modal";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import style from "../../constants/style";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import colors from "../../constants/colors";
import { width } from "../../constants/scale";
import { Text } from "react-native";
import Button from "../Components/Button";
import base_url from "../../constants/base_url";
import { Alert } from "react-native";

export default Profile = ({ navigation, route }) => {
  const { user } = route.params;
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
      Alert(error)
    }
    finally {
        setModal(false)
    }
  };

  const sendToBackend = async (selectedImage) =>{
    const formData = new FormData();
    const parts = selectedImage.split('.');

// The last part of the array will be the file extension
  const fileExtension = parts[parts.length - 1];
    formData.append('pfp', {
      uri: selectedImage,
      type: 'image/png',
      name: user.id+'.'+fileExtension,
    });
    try {
      const response = await fetch(base_url+'/upload-img', {
        method: 'POST',
        body: formData,
      });
      console.log(response)
      const data = await response.json()
      setUri(data.data)
    } catch (error) {
      console.log(error)
    }
  }


  return (
    <>
      <SafeAreaView
        style={[
          style.container,
          //{ opacity: modal ? 0.8 : 1 }
        ]}
      >
        <Text
          style={{
            alignSelf: "center",
            color: "white",
            fontSize: 30,
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
            disabled={modal}
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
        {modal && (
          <Modal isVisible={modal}>
            <View style={{ height: 100, backgroundColor: '#2b2b2b', justifyContent:'space-around', flexDirection: 'row', alignItems: 'center', borderRadius: 20, }}>
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
                  <Ionicons name="camera" color="white" size={30} style={{}} />
                </View>
              </TouchableOpacity>
              <Text style={{color:'white'}}>Camera</Text>
            </View>
            <View >
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
                  <Ionicons name="image" color="white" size={30} style={{}} />
                </View>
              </TouchableOpacity>
              <Text style={{color:'white'}}>Gallery</Text>
            </View>
            <View >
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
                  <MaterialIcons name="close" color="white" size={30} style={{}} />
                </View>
              </TouchableOpacity>
              <Text style={{color:'white'}}>Cancel</Text>
            </View>
            </View>
          </Modal>
        )}
        {/* {modal && (
          <View style={styles.modal}>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => uploadImage()}
                // disabled={modal}
              >
                <View
                  style={{
                    backgroundColor: "#cccccc",
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
                  <Ionicons name="camera" color="grey" size={30} style={{}} />
                </View>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => uploadImage("gallery")}
                // disabled={modal}
              >
                <View
                  style={{
                    backgroundColor: "#cccccc",
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
                  <Ionicons name="image" color="grey" size={30} style={{}} />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )} */}
      </SafeAreaView>
    </>
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
