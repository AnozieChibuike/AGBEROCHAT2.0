import { io } from "socket.io-client";
import base_url from "./base_url";
const socket = io.connect(base_url);
export default socket;