import { View, Text, Pressable, StyleSheet, TouchableOpacity } from "react-native";
import React, { useLayoutEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
// import { styles } from "../utils/styles";

const ChatComponent = ({ item }) => {
    const navigation = useNavigation();
    const [messages, setMessages] = useState({});

    //👇🏻 Retrieves the last message in the array from the item prop
    useLayoutEffect(() => {
        // console.log(item.messages)
        setMessages(item.messages[item.messages.length - 1]);
    }, []);

    ///👇🏻 Navigates to the Messaging screen
    const handleNavigation = () => {
        navigation.navigate("Chat", {
            messages: item.messages,
            name: item.name,
            user: item.user_id
        });
    };

    return (
        <TouchableOpacity style={styles.cchat} onPress={handleNavigation}>
            <Ionicons
                name='person-circle-outline'
                size={45}
                color='black'
                style={styles.cavatar}
            />

            <View style={styles.crightContainer}>
                <View>
                    <Text style={styles.cusername}>{item.name.length > 8 ? item.name.slice(0,10) +'...' : item.name}</Text>

                    <Text style={styles.cmessage}>
                        {messages?.text ? messages.text.length > 10 ? messages.text.slice(0,18) + '...' : messages.text : "Tap to start chatting"}
                    </Text>
                </View>
                <View>
                    <Text style={styles.ctime}>
                        {messages?.created_at ? messages.created_at : "now"}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    cchat: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 5,
        paddingHorizontal: 15,
        backgroundColor: "black",
        height: 80,
        marginBottom: 10,
    },
    cavatar: {
        marginRight: 15,
        color: 'white'
    },
    cusername: {
        fontSize: 18,
        marginBottom: 5,
        fontWeight: "bold",
        color: 'white'
    },
    cmessage: {
        fontSize: 14,
        opacity: 0.7,
        color: 'white'
    },
    crightContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        flex: 1,
    },
    ctime: {
        opacity: 0.5,
        color: 'white'
    },
})

export default ChatComponent;