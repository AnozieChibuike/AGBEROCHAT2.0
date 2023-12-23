// localStorage.theme = 'dark'

if (localStorage.theme === 'dark') 
  document.documentElement.classList.add('dark')
else 
  document.documentElement.classList.remove('dark')

var socket = io();
let connected = 0;
const Active = document.querySelector(".active");
const container = document.querySelector(".chat-container");
window.scrollTo({
  top: container.scrollHeight,
  behavior: "smooth",
});
function handleFormSubmit() {
  var input = document.querySelector("input");
  var message = input.value.trim();
  if (message !== "") {
    socket.emit("message", message);
    input.value = "";
  }
}
document.getElementById("send").addEventListener("click", handleFormSubmit);
document.querySelector("input").addEventListener("keypress", () => {
  if (event.key === "Enter") {
    handleFormSubmit();
  } else {
    return false;
  }
});

const handleChat = (username, message, isSelf) => {
  const date = new Date();
  const hours =
    Number(date.getHours()) < 10 ? `0${date.getHours()}` : date.getHours();
  const minutes =
    Number(date.getMinutes()) < 10
      ? `0${date.getMinutes()}`
      : date.getMinutes();
  const time = hours + ":" + minutes;
  const messag = document.createElement("div");
  const user = document.createElement("span");
  const stamp = document.createElement("span");
  const msg = document.createElement("span");
  messag.classList.add("message");
  messag.classList.add(isSelf ? "sent" : "received");
  user.classList.add("user");
  stamp.classList.add("stamp");
  user.innerText = username;
  stamp.innerText = time;
  msg.innerText = message;
  messag.appendChild(user);
  messag.appendChild(msg);
  messag.appendChild(stamp);
  container.appendChild(messag);
  window.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });
};

const onlineUsers = document.querySelector(".onl");
socket.on("len", (data) => {
  onlineUsers.innerHTML = "";
  data["users"].forEach((element) => {
    const spaner = document.createElement("li");
    spaner.innerText = element;
    onlineUsers.appendChild(spaner);
  });
  Active.innerHTML = `${data["len"]} online`;
});

const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark')
}
