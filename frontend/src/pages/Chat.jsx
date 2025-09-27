import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import EmojiPicker from "emoji-picker-react";

const socket = io("http://localhost:4000"); // backend server

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(
    JSON.parse(sessionStorage.getItem("chatMessages")) || []
  );
  const [darkMode, setDarkMode] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [name, setName] = useState(sessionStorage.getItem("chatName") || "");
  const [joined, setJoined] = useState(!!sessionStorage.getItem("chatName"));
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);
  const otherTypingUsers = typingUsers.filter((u) => u !== name);

  const notificationSound = useRef(new Audio("/notification.mp3"));

  const chatEndRef = useRef(null);

  // auto scroll to bottom
  useEffect(() => {
    if (!chatEndRef.current) return;
    chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  useEffect(() => {
    socket.on("message", (msg) => {
      setMessages((prev) => {
        const updated = [...prev, msg];
        sessionStorage.setItem("chatMessages", JSON.stringify(updated));
        if (msg.name !== name) {
          notificationSound.current.play();
        }
        return updated;
      });
    });

    socket.on("onlineUsers", (count) => {
      setOnlineUsers(count);
    });
    socket.on("userTyping", (users) => setTypingUsers(users));

    return () => {
      socket.off("message");
      socket.off("onlineUsers");
      socket.off("userTyping");
    };
  }, []);

  //   const joinChat = () => {
  //     // if (name.trim().length < 2) {
  //     //   alert("Username must be at least 2 characters.");
  //     //   return;
  //     // }
  //     socket.emit("join", name);
  //     setJoined(true);
  //     sessionStorage.setItem("chatName", name);
  //   };

  const joinChat = () => {
    if (!sessionStorage.getItem("chatJoined")) {
      socket.emit("join", name); // only first time
      sessionStorage.setItem("chatJoined", "true");
    }
    setJoined(true);
    sessionStorage.setItem("chatName", name);
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leave", name); // notify server only when tab closed
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [name]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg = { content: input, name };
    socket.emit("sendMessage", msg);
    setInput("");
    setTypingUsers((prev) => prev.filter((u) => u !== name));
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    socket.emit("typing", name);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!joined) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg mb-4 text-center">Enter your name to join</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 rounded bg-gray-700 text-white mb-3 w-full"
            placeholder="Enter your name"
            required
          />
          <button
            disabled={name.trim().length === 0}
            onClick={joinChat}
            className={`px-4 py-2 rounded w-full ${
              name.trim().length > 0
                ? "bg-blue-600 cursor-pointer"
                : "bg-gray-400"
            }`}
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? "dark" : ""}`}>
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 text-black dark:text-white w-full">
        {/* Header */}
        <div className="w-full py-4 px-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h1 className="text-2xl font-bold">
            Chat
            <span className="text-yellow-400 dark:text-yellow-500">
              Incognito
            </span>{" "}
            ({onlineUsers} online)
          </h1>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="relative w-14 h-8 rounded-full p-1 transition-colors duration-300 bg-gray-200 dark:bg-gray-700 focus:outline-none"
          >
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-500 opacity-0 dark:opacity-100 transition-opacity duration-300" />
            </div>
            <div
              className={`relative w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                darkMode ? "translate-x-6" : "translate-x-0"
              }`}
            >
              {darkMode ? (
                <svg
                  className="absolute inset-0 w-full h-full text-gray-800"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg
                  className="absolute inset-0 w-full h-full text-yellow-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </div>
          </button>
        </div>

        {/* Chat Section */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
              <p>Start a conversation with SmartTalk</p>
            </div>
          ) : (
            <div className="space-y-2 flex flex-col">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`px-3 py-1 rounded-lg max-w-[75%] relative ${
                    message.role === "system"
                      ? "bg-yellow-200 dark:bg-yellow-600 text-black self-center"
                      : message.name === name
                      ? "bg-gray-600 dark:bg-gray-800 text-white self-end"
                      : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white self-start"
                  }`}
                >
                  {message.role !== "system" && (
                    <p className="text-xs font-bold text-blue-400">
                      {message.name === name ? "You" : message.name}
                    </p>
                  )}
                  <p className="break-words">
                    {message.role === "system"
                      ? message.content.includes(`${name} joined`)
                        ? "You joined the chat"
                        : message.content.includes(`${name} left`)
                        ? "You left the chat"
                        : message.content
                      : message.content}
                  </p>
                  <span className="text-xs opacity-70 bottom-1 flex justify-end">
                    {formatTime(message.time)}
                  </span>
                </div>
              ))}
              {/* Typing indicator */}
              {otherTypingUsers.length > 0 && (
                <div className="self-start p-3 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center gap-1">
                  <span className="text-sm text-gray-700 dark:text-gray-200">
                    {otherTypingUsers.length === 1
                      ? `${otherTypingUsers[0]} is typing`
                      : otherTypingUsers.length === 2
                      ? `${otherTypingUsers[0]} and ${otherTypingUsers[1]} are typing`
                      : `${otherTypingUsers[0]} and ${
                          otherTypingUsers.length - 1
                        } others are typing`}
                  </span>
                  <span className="flex space-x-1 mt-2">
                    <span className="w-1 h-1 bg-gray-700 dark:bg-gray-200 rounded-full animate-bounce delay-0"></span>
                    <span className="w-1 h-1 bg-gray-700 dark:bg-gray-200 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1 h-1 bg-gray-700 dark:bg-gray-200 rounded-full animate-bounce delay-300"></span>
                  </span>
                </div>
              )}
              <div ref={chatEndRef} /> {/* Auto-scroll target */}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky bottom-0">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
            {/* <button className="bg-gray-700 hover:bg-gray-750 dark:bg-gray-900 px-4 py-2 rounded-md text-white transition-colors" >Emoji</button> */}
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-xl px-2"
              >
                😊
              </button>

              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-12 left-0 z-50"
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setInput((prev) => prev + emojiData.emoji);
                    }}
                    theme={darkMode ? "dark" : "light"}
                  />
                </div>
              )}
            </div>
            <input
              type="text"
              value={input}
              //   onChange={(e) => setInput(e.target.value)}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 p-2 rounded-md bg-white dark:bg-gray-700 text-black dark:text-white outline-none border border-gray-300 dark:border-gray-600"
            />
            <button
              onClick={sendMessage}
              className="bg-gray-700 hover:bg-gray-750 dark:bg-gray-900 px-4 py-2 rounded-md text-white transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
