import { useState } from "react";

const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {
  const [input, setInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { role: "user", text: input };
    setChatHistory([...chatHistory, newMessage, { role: "model", text: "Thinking..." }]);
    setInput("");
    await generateBotResponse([...chatHistory, newMessage]);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something about EduAudit..."
        style={{
          flex: 1,
          padding: "12px 18px",
          borderRadius: "25px",
          border: "1px solid #ccc",
          outline: "none",
          fontSize: "15px",
          backgroundColor: "#fff",
        }}
      />
      <button type="submit" style={{
        backgroundColor: "#2e89ff",
        color: "#fff",
        border: "none",
        borderRadius: "25px",
        padding: "12px 20px",
        fontWeight: 500,
        cursor: "pointer"
      }}>
        Send
      </button>
    </form>
  );
};

export default ChatForm;



// import { useRef } from "react";
// const ChatForm = ({ chatHistory, setChatHistory, generateBotResponse }) => {
//   const inputRef = useRef();
//   const handleFormSubmit = (e) => {
//     e.preventDefault();
//     const userMessage = inputRef.current.value.trim();
//     if (!userMessage) return;
//     inputRef.current.value = "";
//     // Update chat history with the user's message
//     setChatHistory((history) => [...history, { role: "user", text: userMessage }]);
//     // Delay 600 ms before showing "Thinking..." and generating response
//     setTimeout(() => {
//       // Add a "Thinking..." placeholder for the bot's response
//       setChatHistory((history) => [...history, { role: "model", text: "Thinking..." }]);
//       // Call the function to generate the bot's response
//       generateBotResponse([...chatHistory, { role: "user", text: `Using the details provided above, please address this query: ${userMessage}` }]);
//     }, 600);
//   };
//   return (
//     <form onSubmit={handleFormSubmit} className="chat-form">
//       <input ref={inputRef} placeholder="Message..." className="message-input" required />
//       <button type="submit" id="send-message" className="material-symbols-outlined">
//         arrow_upward
//       </button>
//     </form>
//   );
// };
// export default ChatForm;