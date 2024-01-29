// Home Screen
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useEffect, useLayoutEffect, useState } from "react";
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
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
  Share,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import Modal from "../Components/Modal";
import ChatComponent from "../Components/ChatComponent";
import colors from "../../constants/colors";
import { ScrollView } from "react-native";
import base_url from "../../constants/base_url";
import { width } from "../../constants/scale";
import Loader from "../Components/Loader";
import Button from "../Components/Button";

export default Home = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [room_name, setRoomName] = useState("");

  useLayoutEffect(() => {
    getUser();
    navigation.addListener("focus", getUser);
  }, []);
  useLayoutEffect(() => {
    if (user !== null) {
      getRooms();
    }
  }, [user]);

  const createRoom = async () => {
    if (room_name.length < 1) {
      Alert.alert("Error", "Room name can not be blank");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${base_url}/api/create_room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: user.id, name: room_name }),
      });
      const data = await response.json();
      // console.log(data);
      if (data.error) {
        // console.log(data);
        Alert.alert("Error", data.error);
      } else {
        getRooms();
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setRoomName("");
      setLoading(false);
    }
  };

  const getUser = async () => {
    setLoading(true)
    let userData = await AsyncStorage.getItem("userData");
    // console.log(user['image_url'])
    if (!userData)
      navigation.navigate("Login", {
        message: "Session expired, Log in",
      });
    try {
      const response = await fetch(`${base_url}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: JSON.parse(userData).id }),
      });
      const data = await response.json();
      // console.log(data);
      if (data.error) {
        // console.log(data);
        Alert.alert("Error", data.error);
      } else {
        setUser(data.data[0]);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };
  const getRooms = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${base_url}/api/user/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await response.json();
      // console.log(data);
      if (data.error) {
        // console.log(data);
        Alert.alert("Error", data.error);
      } else {
        // console.log(data.data);
        setRooms(data.data);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AsyncStorage.removeItem("userData");
    navigation.navigate("Landing");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={loading ? null : "padding"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.chatscreen}>
          {loading ? (
            <Loader speed={1} backgroundColor="grey" foregroundColor="white" />
          ) : (
            <>
              <View style={styles.chattopContainer}>
                <View style={styles.chatheader}>
                  <View style={{ width: 50, height: 50 }}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("Profile", { user })}
                    >
                      <Image
                        source={{ uri: user["image_url"].startsWith('/') ? `${base_url}${user["image_url"]}`:user["image_url"] }}
                        style={{
                          height: "100%",
                          width: "100%",
                          borderRadius: 100,
                        }}
                      />
                    </TouchableOpacity>
                  </View>

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
                <Button
                  text={"logout"}
                  color={"white"}
                  bg={"red"}
                  onPress={logout}
                />
              </View>
              {visible ? (
                <Modal
                  createRoom={createRoom}
                  setVisible={setVisible}
                  onChangeText={(text) => setRoomName(text)}
                />
              ) : (
                ""
              )}
            </>
          )}
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
    marginBottom: 150,
  },
  chatemptyContainer: {
    width: "100%",
    height: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  chatemptyText: { fontWeight: "bold", fontSize: 24, paddingBottom: 30 },
});
