
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
  messag.classList.add("message", "dark:text-white");
  messag.classList.add(isSelf ? "dark:bg-teal-900" : "dark:bg-gray-800");
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


const toggleDarkMode = () => {
  if (document.querySelector("#darker").innerText === "DarkMode")
  document.querySelector("#darker").innerText = "LightMode";
  else 
  document.querySelector("#darker").innerText = "DarkMode";
  
  document.documentElement.classList.toggle("dark");
};
