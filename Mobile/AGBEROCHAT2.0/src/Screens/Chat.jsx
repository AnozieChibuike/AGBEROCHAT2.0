
import Icon from "react-native-vector-icons/MaterialCommunityIcons";import React, { useState, useCallback, useEffect, useLayoutEffect } from "react";
import { Text, Touchable, TouchableOpacity, View } from "react-native";
import { GiftedChat, InputToolbar } from "react-native-gifted-chat";
import Input from "../Components/Chat/Input";
import ChatBubble from "../Components/Chat/ChatBubble";
import { width } from "../../constants/scale";
import { Image } from "react-native";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Chat({navigation, route}) {
  const [messagesstate, setMessages] = useState([]);
  const { name, messages, user } = route.params;
  const [currentUser, setcur]= useState(user)
  useLayoutEffect(()=>{
    navigation.setOptions({ title: name });
    setMessages(messages);
  },[])

  // useEffect(() => {
    
  // }, []);
  const [typing, seT] = useState(false);
  const onSend = useCallback((messages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages)
    );
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "black", }}>
      <View
        style={{
          backgroundColor: 'black',
          paddingTop: 20,
          height: 80,
          borderBottomWidth: 1,
          borderColor: "grey",
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 100,
        }}
      ><TouchableOpacity onPress={()=> {
        navigation.goBack()
      }}>
        <Icon name="chevron-left" size={36} color='white' />
        </TouchableOpacity>
        <Text style={{color: 'white', fontSize: 30, fontWeight: 'bold'}}>{name}</Text>
        <Image />
      </View>
      <GiftedChat
        renderBubble={ChatBubble}
        onInputTextChanged={(text) => {
          if (text) seT(true);
          else seT(false);
        }}
        scrollToBottom
        renderUsernameOnMessage
        renderInputToolbar={Input}
        // isTyping={typing}
        messages={messagesstate}
        onSend={(messagesstate) => onSend(messagesstate)}
        user={{
          _id: user,
        }}
        inverted={false}
      />
    </View>
  );
}
