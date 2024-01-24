import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import Input from "./Input";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { width } from "../../constants/scale";
// import { styles } from "../utils/styles";

//👇🏻 Import socket from the socket.js file in utils folder
// import socket from "../utils/socket";

const Modal = ({ setVisible, height, createRoom = () => {}, ...props }) => {
  const closeModal = () => setVisible(false);
  const [groupName, setGroupName] = useState("");
  // const [top, setTop] = useState(500);
  const handleCreateRoom = () => {
    //👇🏻 sends a message containing the group name to the server
    // socket.emit("createRoom", groupName);
    createRoom();
    closeModal();
  };
  return (
    // <KeyboardAwareScrollView contentContainerStyle={{flex:1}}>
    <View style={[styles.modalContainer]}>
      <Text style={styles.modalsubheading}>Enter your Group name</Text>
      <Input placeholder="Group name" autoFocus={true} {...props} />
      <View style={styles.modalbuttonContainer}>
        {/* 👇🏻 The create button triggers the function*/}
        <Pressable style={styles.modalbutton} onPress={handleCreateRoom}>
          <Text style={styles.modaltext}>CREATE</Text>
        </Pressable>

        <Pressable
          style={[styles.modalbutton, { backgroundColor: "#E14D2A" }]}
          onPress={closeModal}
        >
          <Text style={styles.modaltext}>CANCEL</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalbutton: {
    width: "40%",
    height: 45,
    backgroundColor: "green",
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
  },
  modalbuttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modaltext: {
    color: "#fff",
  },
  modalContainer: {
    width,
    // borderTopColor: "#ddd",
    // borderTopWidth: 1,
    elevation: 1,

    backgroundColor: "#2f3030",
    position: "absolute",
    bottom: 0,
    zIndex: 10,
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  modalinput: {
    borderWidth: 2,
    padding: 15,
  },
  modalsubheading: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
});

export default Modal;
