import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import React, {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { Text, Touchable, TouchableOpacity, View } from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import Input from "../Components/Chat/Input";
import ChatBubble from "../Components/Chat/ChatBubble";
import { width } from "../../constants/scale";
import { Image } from "react-native";
import { Platform } from "react-native";
import socket from "../../constants/socket";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Chat({ navigation, route }) {
  const [messagesstate, setMessages] = useState([]);
  const { name, messages, user, room_id } = route.params;
  const [currentUser, setcur] = useState(user);
  useLayoutEffect(() => {
    navigation.setOptions({ title: name });
    setMessages(messages);
    socket.emit("event", {
      room: room_id,
    });
  }, []);

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
    // console.log(messages[0] )
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
      <GiftedChat
        renderBubble={ChatBubble}
        onInputTextChanged={(text) => {
          if (text) {
            onType(true);
          } else {
            onType(false);
          }
        }}
        scrollToBottom
        renderUsernameOnMessage
        renderInputToolbar={Input}
        isTyping={typing}
        messages={messagesstate}
        onSend={(messagesstate) => onSend(messagesstate)}
        user={{
          _id: user,
        }}

      />
    </View>
  );
}
