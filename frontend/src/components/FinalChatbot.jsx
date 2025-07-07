import { useEffect, useRef, useState } from "react";
import ChatbotIcon from "./ChatbotIcon.jsx";
import ChatForm from "./ChatForm.jsx";
import ChatMessage from "./ChatMessage.jsx";
import "./FinalChatbot.css"; // Add custom styles here

const FinalChatbot = () => {
  const chatBodyRef = useRef();
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [blogPrompt, setBlogPrompt] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch("http://localhost:5000/api//fssai-chatbot");
        const data = await response.json();
        setBlogPrompt(data.prompt);
        setChatHistory([
          { hideInChat: true, role: "model", text: data.prompt },
        ]);
      } catch (err) {
        console.error("Error loading blog data:", err);
      }
    };
    fetchBlogs();
  }, []);

  const generateBotResponse = async (history) => {
    const updateHistory = (text, isError = false) => {
      setChatHistory((prev) => [
        ...prev.filter((msg) => msg.text !== "Thinking..."),
        { role: "model", text, isError },
      ]);
    };

    const formatted = history.map(({ role, text }) => ({
      role,
      parts: [{ text }],
    }));

    try {
      const response = await fetch(import.meta.env.VITE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: formatted }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data?.error?.message || "Something went wrong");

      const apiResponseText = data.candidates[0].content.parts[0].text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .trim();
      updateHistory(apiResponseText);
    } catch (error) {
      updateHistory(error.message, true);
    }
  };

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatHistory]);

  return (
    <>
      <button
        className="chatbot-toggle-btn"
        onClick={() => setShowChatbot((prev) => !prev)}
      >
        {showChatbot ? "×" : "💬"}
      </button>

      <div className={`chatbot-container ${showChatbot ? "show" : ""}`}>
        <div className="chatbot-header">
          <div className="header-left">
            <ChatbotIcon />
            <h3>Platform Assistant</h3>
          </div>
          <button
            className="close-btn"
            onClick={() => setShowChatbot(false)}
          >
            ↓
          </button>
        </div>

        <div ref={chatBodyRef} className="chatbot-body">
          <div className="message bot-message">
            <ChatbotIcon />
            <p>
            Hello 👋<br />
            Need help with restaurant safety, hygiene scores, or FSSAI info?
          </p>
          </div>
          {chatHistory.map((chat, index) => (
            <ChatMessage key={index} chat={chat} />
          ))}
        </div>

        <div className="chatbot-footer">
          <ChatForm
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            generateBotResponse={generateBotResponse}
          />
        </div>
      </div>
    </>
  );
};

export default FinalChatbot;



// import { useEffect, useRef, useState } from "react";
// import ChatbotIcon from "./ChatbotIcon.jsx";
// import ChatForm from "./ChatForm.jsx";
// import ChatMessage from "./ChatMessage.jsx";

// const FinalChatbot = () => {
//   const chatBodyRef = useRef();
//   const [showChatbot, setShowChatbot] = useState(false);
//   const [chatHistory, setChatHistory] = useState([]);
//   const [blogPrompt, setBlogPrompt] = useState(""); // to store blog content

//   useEffect(() => {
//     // Fetch blogs from backend on load
//     const fetchBlogs = async () => {
//       try {
//         const response = await fetch("http://localhost:5000/api/blogs");
//         const data = await response.json();
//         console.log("🤖 Blog Prompt Sent to Chatbot:\n", data.prompt);
                
//         setBlogPrompt(data.prompt);
//         setChatHistory([
//           {
//             hideInChat: true,
//             role: "model",
//             text: data.prompt,
//           },
//         ]);
//       } catch (err) {
//         console.error("Error loading blog data:", err);
//       }
//     };
//     fetchBlogs();
//   }, []);

//   const generateBotResponse = async (history) => {
//     const updateHistory = (text, isError = false) => {
//       setChatHistory((prev) => [
//         ...prev.filter((msg) => msg.text !== "Thinking..."),
//         { role: "model", text, isError },
//       ]);
//     };

//     const formatted = history.map(({ role, text }) => ({
//       role,
//       parts: [{ text }],
//     }));

//     try {
//       const response = await fetch(import.meta.env.VITE_API_URL, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ contents: formatted }),
//       });

//       const data = await response.json();
//       if (!response.ok) throw new Error(data?.error?.message || "Something went wrong");

//       const apiResponseText = data.candidates[0].content.parts[0].text
//         .replace(/\*\*(.*?)\*\*/g, "$1")
//         .trim();
//       updateHistory(apiResponseText);
//     } catch (error) {
//       updateHistory(error.message, true);
//     }
//   };

//   useEffect(() => {
//     if (chatBodyRef.current) {
//       chatBodyRef.current.scrollTo({ top: chatBodyRef.current.scrollHeight, behavior: "smooth" });
//     }
//   }, [chatHistory]);

//   return (
//     <div className={`container ${showChatbot ? "show-chatbot" : ""}`}>
//       <button onClick={() => setShowChatbot((prev) => !prev)} id="chatbot-toggler">
//         <span className="material-symbols-outlined">mode_comment</span>
//         <span className="material-symbols-outlined">close</span>
//       </button>

//       <div className="chatbot-popup">
//         <div className="chat-header">
//           <div className="header-info">
//             <ChatbotIcon />
//             <h2 className="logo-text">EduAudit Chatbot</h2>
//           </div>
//           <button onClick={() => setShowChatbot((prev) => !prev)} className="material-symbols-outlined">
//             keyboard_arrow_down
//           </button>
//         </div>

//         <div ref={chatBodyRef} className="chat-body">
//           <div className="message bot-message">
//             <ChatbotIcon />
//             <p className="message-text">
//               Hey there <br /> How can I help you today?
//             </p>
//           </div>
//           {chatHistory.map((chat, index) => (
//             <ChatMessage key={index} chat={chat} />
//           ))}
//         </div>

//         <div className="chat-footer">
//           <ChatForm chatHistory={chatHistory} setChatHistory={setChatHistory} generateBotResponse={generateBotResponse} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FinalChatbot;
