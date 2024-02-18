import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// import PushNotification from 'react-native-push-notification';



import React, {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { Alert, Text, Touchable, TouchableOpacity, View } from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import Input from "../Components/Chat/Input";
import ChatBubble from "../Components/Chat/ChatBubble";
import { width } from "../../constants/scale";
import { Image } from "react-native";
import { Platform } from "react-native";
import socket from "../../constants/socket";
import { SafeAreaView } from "react-native-safe-area-context";
import Loader from "../Components/Loader";

export default function Chat({ navigation, route }) {
  const [messagesstate, setMessages] = useState([]);
  const { name, messages, user, room_id } = route.params;
  const [currentUser, setcur] = useState(user);
  const [loading, setLoading] = useState(false);
  useLayoutEffect(() => {
    navigation.setOptions({ title: name });
    if (user) {
      getRoomMessages();
      navigation.addListener("focus", getRoomMessages);
    }
    socket.emit("event", {
      room: room_id,
    });
  }, []);

  const getRoomMessages = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${base_url}/api/user/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: user, room_id: room_id }),
      });
      const data = await response.json();

      if (data.error) {
       
        Alert.alert("Error", data.error);
      } else {
        setMessages(data.data);
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    socket.on("mes", handleSocketEvent);
    // return ()=> {
    //   socket.disconnect()
    // }
  }, [handleSocketEvent]);
  useEffect(() => {
    socket.on("handleTyping", handleTyping);
  }, [handleTyping]);
  const handleSocketEvent = useCallback((data) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, data.api_message)
    );
    // Schedule a local notification
// PushNotification.localNotification({
//   message: data.api_message,
// });
  }, []);

  const handleTyping = useCallback((data) => {
    seT(data.isTyping);
  }, []);
  const [typing, seT] = useState(false);
  const onType = useCallback((isTyping = true) => {
    socket.emit("typing", {
      room: room_id,
      typing: isTyping,
    });
  }, []);
  const onSend = useCallback((messages = []) => {
    socket.emit("custom_message", {
      room: room_id,
      api_user: user,
      message: messages[0].text,
    });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <View
        style={{
          backgroundColor: "black",
          paddingTop: 20,
          height: 80,
          borderBottomWidth: 1,
          borderColor: "grey",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
          }}
        >
          <Icon name="chevron-left" size={36} color="white" />
        </TouchableOpacity>
        <Text style={{ color: "white", fontSize: 30, fontWeight: "bold" }}>
          {name}
        </Text>
        <Image />
      </View>
      {loading ? (
        <Loader speed={1} backgroundColor="grey" foregroundColor="white" />
      ) : (
        <GiftedChat
          renderBubble={ChatBubble}
          onInputTextChanged={(text) => {
            if (text) {
              onType(true);
            } else {
              onType(false);
            }
          }}
          // minComposerHeight={50}
          // minInputToolbarHeight={50}
          scrollToBottom
          // renderFooter={}
          renderUsernameOnMessage
          renderInputToolbar={Input}
          isTyping={typing}
          messages={messagesstate}
          onSend={(messagesstate) => onSend(messagesstate)}
          user={{
            _id: user,
          }}
        />
      )}
    </View>
  );
}
