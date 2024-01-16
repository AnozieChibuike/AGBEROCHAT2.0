// Home Screen
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import React from "react";
import {
  View,
  Text,
  Pressable,
  SafeAreaView,
  FlatList,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Modal from "../Components/Modal";
import ChatComponent from "../Components/ChatComponent";
import colors from "../../constants/colors";
import { ScrollView } from "react-native";
import base_url from "../../constants/base_url";

export default Home = () => {
  const [user, setUser] = useState({});
  const [rooms, setRooms] = useState([]);
  const [visible, setVisible] = useState(false);
  const [top, setTop] = useState(30);
  useEffect(() => {
    getUser();
  }, []);
  const getUser = async () => {
    let userData = await AsyncStorage.getItem("userData");
    if (!userData)
      navigation.navigate("Login", {
        message: "Session expired, Log in",
      });
    setUser(JSON.parse(userData));
    // console.log(user);
    getRooms()
  };
  const getRooms = async () => {
    try {
      const response = await fetch(`${base_url}/api/user/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({id: user.id}),
      });
      const data = await response.json();
      console.log(data)
      if (data.error) {
        Alert.alert("Error", data.error);
      } else {
        setRooms(data.data)
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.chatscreen}>
        <View style={styles.chattopContainer}>
          <View style={styles.chatheader}>
            <Text style={styles.chatheading}>Chats</Text>

            {/* Displays the Modal component when clicked */}
            <Pressable onPress={() => setVisible(true)}>
              <Feather name="edit" size={24} color={colors.faintBlue} />
            </Pressable>
          </View>
        </View>
        <View style={styles.chatlistContainer}>
          {rooms.length > 0 ? (
            <FlatList
              data={rooms}
              renderItem={({ item }) => <ChatComponent item={item} />}
              keyExtractor={(item) => item.id}
            />
          ) : (
            <View style={styles.chatemptyContainer}>
              <Text style={[styles.chatemptyText, { color: "white" }]}>
                No rooms created!
              </Text>
              <Text style={{ color: "white" }}>
                Click the icon above to create a Chat room
              </Text>
            </View>
          )}
        </View>
        {visible ? <Modal setVisible={setVisible} /> : ""}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  chatscreen: {
    backgroundColor: "black",
    flex: 1,
    padding: 10,
    position: "relative",
    paddingBottom: 100,
  },
  chatheading: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.faintBlue,
  },
  chattopContainer: {
    backgroundColor: "black",
    height: 70,
    width: "100%",
    padding: 20,
    justifyContent: "center",
    marginBottom: 15,
    elevation: 2,
  },
  chatheader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatlistContainer: {
    paddingHorizontal: 10,
  },
  chatemptyContainer: {
    width: "100%",
    height: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  chatemptyText: { fontWeight: "bold", fontSize: 24, paddingBottom: 30 },
});
