document.getElementById("send").addEventListener("click", handleFormSubmit);
document.querySelector(".msg-input").addEventListener("keypress", () => {
  if (event.key === "Enter") {
    handleFormSubmit();
  } else {
    return false;
  }
});

function makeLinksClickable(message) {
  return message.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" style=" color: rgb(37,99,235);" target="_blank">$1</a>'
  );
}

var messageBodies = document.querySelectorAll(".message-body");
messageBodies.forEach(function (body) {
  body.innerHTML = makeLinksClickable(body.innerHTML);
});

const handleChat = (username, message, isSelf, imageUrl) => {
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
  const father = document.createElement("div");
  const link = document.createElement("a");
  const image = document.createElement("img");
  link.href = `/profile/${username}`
  image.src = imageUrl;
  link.appendChild(image)
  father.classList.add(isSelf ? "sent-father" : "received-father");
  messag.classList.add("message", "dark:text-white");
  messag.classList.add(isSelf ? "dark:bg-teal-900" : "dark:bg-gray-800");
  messag.classList.add(isSelf ? "sent" : "received");
  user.classList.add("user");
  stamp.classList.add("stamp");
  user.innerText = username;
  stamp.innerText = time;
  msg.innerHTML = makeLinksClickable(message);
  messag.appendChild(user);
  messag.appendChild(msg);
  messag.appendChild(stamp);
  father.appendChild(messag);
  if (father.classList.contains("received-father"))
    father.insertBefore(link, messag);
  else father.appendChild(link);
  container.appendChild(father);
  window.scrollTo({
    top: container.scrollHeight,
    behavior: "smooth",
  });
};


const toggleDarkMode = () => {
  if (document.querySelector("#darker").innerText === "DarkMode")
    document.querySelector("#darker").innerText = "LightMode";
  else document.querySelector("#darker").innerText = "DarkMode";

  document.documentElement.classList.toggle("dark");
};

const copyToClipboard = () => {
  const invite_link = document.getElementById("invite_link");
  const tooltip = document.querySelector(".tip");
  navigator.clipboard.writeText(invite_link.innerText);
  tooltip.style.opacity = "1";
  setTimeout(() => {
    tooltip.style.opacity = "0";
  }, 1500);
};
