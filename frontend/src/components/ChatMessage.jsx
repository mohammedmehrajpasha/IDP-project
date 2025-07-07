import ChatbotIcon from "./ChatbotIcon";

const ChatMessage = ({ chat }) => {
  if (chat.hideInChat) return null;

  const isUser = chat.role === "user";
  return (
    <div className={`message-wrapper ${isUser ? "user" : "bot"}`}>
      {!isUser && <ChatbotIcon />}
      <div className={`message-bubble ${isUser ? "user-message" : "bot-message"} ${chat.isError ? "error" : ""}`}>
        <p className="message-text">{chat.text}</p>
      </div>
    </div>
  );
};

export default ChatMessage;


// import ChatbotIcon from "./ChatbotIcon";
// const ChatMessage = ({ chat }) => {
//   return (
//     !chat.hideInChat && (
//       <div className={`message ${chat.role === "model" ? "bot" : "user"}-message ${chat.isError ? "error" : ""}`}>
//         {chat.role === "model" && <ChatbotIcon />}
//         <p className="message-text">{chat.text}</p>
//       </div>
//     )
//   );
// };
// export default ChatMessage;