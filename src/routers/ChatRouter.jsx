import ChatIndexPage from "../pages/chatpages/ChatIndexPage.jsx";
import RandomChatPage from "../pages/chatpages/RandomChatPage.jsx";
import ChatPage from "../pages/chatpages/ChatPage.jsx";
import ChatModalPage from "../pages/chatpages/ChatModalPage.jsx";

const ChatRouter = {
    path: "/chat",
    element: <ChatIndexPage />,
    children: [
        {
            index: true,
            element: <RandomChatPage />,
        },
        {
            path: ":roomId/:userId",
            element: <ChatPage />,
        },
        {
            path: ":roomId",
            element: <ChatModalPage/>
        }
    ],
};

export default ChatRouter;
