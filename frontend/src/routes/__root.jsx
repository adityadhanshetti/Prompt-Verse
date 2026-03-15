import { createRootRoute, Outlet } from "@tanstack/react-router";
import Navbar from "../components/Navbar.jsx";

export const Route = createRootRoute({
    component: () => (
        <div className="min-h-screen bg-gray-950 text-white">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-6">
                <Outlet />
            </main>
        </div>
    ),
});
