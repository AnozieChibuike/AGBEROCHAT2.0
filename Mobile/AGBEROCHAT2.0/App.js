import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Landing from "./src/Screens/Landing";
import { StatusBar } from "react-native";
import Login from "./src/Screens/AUTH/Login";
import SignUp from "./src/Screens/AUTH/Signup";
import Home from "./src/Screens/Home";
import Chat from "./src/Screens/Chat";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen
            name="Landing"
            component={Landing}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Signup"
            component={SignUp}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={Login}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Home"
            component={Home}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={Chat}
            options={{ headerShown: false }}
          />
          
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar hidden={true} />
    </>
  );
}
