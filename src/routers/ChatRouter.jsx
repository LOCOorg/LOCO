import ChatIndexPage from "../pages/chatpages/ChatIndexPage.jsx";
import ChatListPage from "../pages/chatpages/ChatListPage.jsx";
import ChatPage from "../pages/chatpages/ChatPage.jsx";

const ChatRouter = {
    path: "/chat",
    element: <ChatIndexPage />,
    children: [
        {
            index: true,
            element: <ChatListPage />,
        },
        {
            path: ":roomId",
            element: <ChatPage />,
        },
    ],
};

export default ChatRouter;
