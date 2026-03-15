import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import { ClerkProvider } from "@clerk/clerk-react";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { router } from "./router.jsx";

const queryClient = new QueryClient();

// import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <ClerkProvider
            publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        >
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <ReactQueryDevtools initialIsOpen={false} />
                {/* <App /> */}
            </QueryClientProvider>
        </ClerkProvider>
    </StrictMode>,
);
