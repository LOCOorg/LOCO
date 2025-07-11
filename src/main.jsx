// src/main.jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import mainRouter from "./routers/MainRouter.jsx";
import { RouterProvider } from 'react-router-dom'
import AuthInit from '../src/components/authComponent/AuthInit.jsx';
import {NotificationProvider} from "./hooks/NotificationContext.jsx";

createRoot(document.getElementById('root')).render(
    <NotificationProvider>
        <AuthInit />
        <RouterProvider router={mainRouter} />
    </NotificationProvider>
)
