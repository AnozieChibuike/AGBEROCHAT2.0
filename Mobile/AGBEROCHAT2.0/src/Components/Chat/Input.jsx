import { View } from "react-native";
import {
  GiftedChat,
  InputToolbar,
  Composer,
  Send,
} from "react-native-gifted-chat";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default Input = (props) => {
  return (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: "black",
      }}
      renderComposer={(props1) => (
        <Composer {...props1} textInputStyle={{ color: "white" }} />
      )}
      renderSend={(pro) => {
        return <Send {...pro}>
          <View style={{marginRight: 10, marginTop: -1}}>
            <Icon name="send-circle" size={50} color='green'  />
          </View>
        </Send>;
      }}
    />
  );
};
