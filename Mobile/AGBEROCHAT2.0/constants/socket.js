import { io } from "socket.io-client";
const socket = io.connect("http://localhost:5000");
export default socket;