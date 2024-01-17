import { Bubble, Time } from "react-native-gifted-chat";
import colors from "../../../constants/colors";

export default ChatBubble = (props) => {
  return (
    <Bubble
      {...props}
      wrapperStyle={{
        left: {
          backgroundColor: colors.bubbleBlack,
          
        },
        right: {
          backgroundColor: colors.bubbleDarkGreen,
        },
        
      }}
      usernameStyle={{
        color: 'yellow'
      }}
      renderTime={(props2) => {
        return <Time {...props2} timeTextStyle={{
            right:{
                color: '#b8b8b8'
            }
        }} />
        
      }}
      textStyle={{
        right: {
          color: "white",
        },
        left: {
          color: "white",
        },
      }}
    />
  );
};
