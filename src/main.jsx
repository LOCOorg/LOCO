// src/main.jsx
import { createRoot } from 'react-dom/client'
import './index.css'
import mainRouter from "./routers/MainRouter.jsx";
import { RouterProvider } from 'react-router-dom'
import AuthInit from '../src/components/authComponent/AuthInit.jsx'; // AuthInit import

createRoot(document.getElementById('root')).render(
    <>
        <AuthInit />
        <RouterProvider router={mainRouter} />
    </>
)
