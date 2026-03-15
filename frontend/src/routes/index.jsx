// import { createFileRoute, useNavigate } from "@tanstack/react-router";
// import { useQuery } from "@tanstack/react-query";
// import { fetchPrompts } from "../lib/promptApi.js";
// import PromptCard from "../components/PromptCard.jsx";
// import {
//     Sparkles,
//     TrendingUp,
//     Zap,
//     ArrowRight,
//     Code2,
//     Share2,
//     Bookmark,
// } from "lucide-react";

// export const Route = createFileRoute("/")({
//     component: Home,
// });

// function Home() {
//     const navigate = useNavigate();
//     const { data, isLoading, isError } = useQuery({
//         queryKey: ["prompts"],
//         queryFn: fetchPrompts,
//     });

//     // Get the latest 6 prompts
//     const recentPrompts = data?.slice(0, 6) || [];

//     if (isError) {
//         return (
//             <div className="flex items-center justify-center min-h-screen">
//                 <p className="text-red-500">Failed to load prompts.</p>
//             </div>
//         );
//     }

//     return (
//         <div className="w-full">
//             {/* Hero Section */}
//             <section className="relative py-20 overflow-hidden">
//                 {/* Background gradient effect */}
//                 <div className="absolute inset-0 -z-10">
//                     <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
//                     <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
//                 </div>

//                 <div className="max-w-6xl mx-auto px-4 text-center">
//                     {/* Badge */}
//                     <div className="inline-block mb-6">
//                         <div className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 rounded-full text-blue-300 text-sm font-medium flex items-center gap-2">
//                             <Sparkles size={16} />
//                             Welcome to PromptVerse
//                         </div>
//                     </div>

//                     {/* Main Heading */}
//                     <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
//                         Discover & Share Powerful Prompts
//                     </h1>

//                     {/* Subtitle */}
//                     <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
//                         PromptVerse is your ultimate destination for AI prompts.
//                         Explore thousands of expertly crafted prompts, create
//                         your own, and share them with a thriving community of
//                         creators.
//                     </p>

//                     {/* CTA Buttons */}
//                     <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
//                         <button
//                             onClick={() => navigate({ to: "/explore" })}
//                             className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/50 hover:shadow-xl"
//                         >
//                             Explore Prompts
//                             <ArrowRight
//                                 size={20}
//                                 className="group-hover:translate-x-1 transition-transform"
//                             />
//                         </button>
//                         <button
//                             onClick={() => navigate({ to: "/create" })}
//                             className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-all duration-300 hover:shadow-xl"
//                         >
//                             Create Prompt
//                         </button>
//                     </div>
//                 </div>
//             </section>

//             {/* Features Section */}
//             <section className="py-16 px-4">
//                 <div className="max-w-6xl mx-auto">
//                     <h2 className="text-3xl font-bold text-center mb-12">
//                         Why PromptVerse?
//                     </h2>

//                     <div className="grid md:grid-cols-3 gap-6">
//                         {/* Feature 1 */}
//                         <div className="group relative bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-8 hover:border-blue-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
//                             <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
//                             <div className="relative">
//                                 <Code2
//                                     className="text-blue-400 mb-4"
//                                     size={32}
//                                 />
//                                 <h3 className="text-xl font-semibold mb-2">
//                                     Expertly Crafted
//                                 </h3>
//                                 <p className="text-gray-400">
//                                     Quality prompts created by AI experts and
//                                     the community
//                                 </p>
//                             </div>
//                         </div>

//                         {/* Feature 2 */}
//                         <div className="group relative bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-8 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
//                             <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
//                             <div className="relative">
//                                 <Share2
//                                     className="text-purple-400 mb-4"
//                                     size={32}
//                                 />
//                                 <h3 className="text-xl font-semibold mb-2">
//                                     Easy to Share
//                                 </h3>
//                                 <p className="text-gray-400">
//                                     Share your favorite prompts with one click
//                                 </p>
//                             </div>
//                         </div>

//                         {/* Feature 3 */}
//                         <div className="group relative bg-gradient-to-br from-pink-500/10 to-pink-600/5 border border-pink-500/20 rounded-2xl p-8 hover:border-pink-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10">
//                             <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
//                             <div className="relative">
//                                 <Bookmark
//                                     className="text-pink-400 mb-4"
//                                     size={32}
//                                 />
//                                 <h3 className="text-xl font-semibold mb-2">
//                                     Save & Organize
//                                 </h3>
//                                 <p className="text-gray-400">
//                                     Organize prompts into collections for easy
//                                     access
//                                 </p>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </section>

//             {/* Quick Navigation Section */}
//             <section className="py-12 px-4">
//                 <div className="max-w-6xl mx-auto">
//                     <h2 className="text-3xl font-bold mb-8">
//                         Quick Navigation
//                     </h2>

//                     <div className="grid md:grid-cols-2 gap-4">
//                         <button
//                             onClick={() => navigate({ to: "/trending" })}
//                             className="group relative p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl hover:border-orange-500/60 transition-all duration-300 overflow-hidden text-left"
//                         >
//                             <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
//                             <div className="relative flex items-center justify-between">
//                                 <div>
//                                     <div className="flex items-center gap-2 mb-2">
//                                         <TrendingUp
//                                             size={20}
//                                             className="text-orange-400"
//                                         />
//                                         <h3 className="text-lg font-semibold">
//                                             Trending Now
//                                         </h3>
//                                     </div>
//                                     <p className="text-sm text-gray-400">
//                                         Check out the hottest prompts
//                                     </p>
//                                 </div>
//                                 <ArrowRight className="text-orange-400 group-hover:translate-x-1 transition-transform" />
//                             </div>
//                         </button>

//                         <button
//                             onClick={() => navigate({ to: "/explore" })}
//                             className="group relative p-6 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl hover:border-blue-500/60 transition-all duration-300 overflow-hidden text-left"
//                         >
//                             <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
//                             <div className="relative flex items-center justify-between">
//                                 <div>
//                                     <div className="flex items-center gap-2 mb-2">
//                                         <Zap
//                                             size={20}
//                                             className="text-blue-400"
//                                         />
//                                         <h3 className="text-lg font-semibold">
//                                             Explore All
//                                         </h3>
//                                     </div>
//                                     <p className="text-sm text-gray-400">
//                                         Browse all prompts with filters
//                                     </p>
//                                 </div>
//                                 <ArrowRight className="text-blue-400 group-hover:translate-x-1 transition-transform" />
//                             </div>
//                         </button>
//                     </div>
//                 </div>
//             </section>

//             {/* Recently Created Prompts Section */}
//             <section className="py-16 px-4">
//                 <div className="max-w-6xl mx-auto">
//                     <div className="flex items-center justify-between mb-10">
//                         <div>
//                             <h2 className="text-3xl font-bold mb-2">
//                                 Recently Created Prompts
//                             </h2>
//                             <p className="text-gray-400">
//                                 The latest additions from our community
//                             </p>
//                         </div>
//                         <button
//                             onClick={() => navigate({ to: "/explore" })}
//                             className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-all duration-300 font-medium"
//                         >
//                             View All
//                             <ArrowRight size={18} />
//                         </button>
//                     </div>

//                     {/* Prompts Grid */}
//                     {isLoading ? (
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                             {[1, 2, 3, 4, 5, 6].map((item) => (
//                                 <div
//                                     key={item}
//                                     className="bg-gray-800/30 rounded-2xl p-6 animate-pulse"
//                                 >
//                                     <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
//                                     <div className="h-3 bg-gray-700 rounded mb-2 w-full"></div>
//                                     <div className="h-3 bg-gray-700 rounded w-5/6"></div>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : recentPrompts.length === 0 ? (
//                         <div className="text-center py-16">
//                             <p className="text-gray-400 text-lg">
//                                 No prompts yet. Be the first to create one!
//                             </p>
//                         </div>
//                     ) : (
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                             {recentPrompts.map((prompt) => (
//                                 <PromptCard key={prompt._id} prompt={prompt} />
//                             ))}
//                         </div>
//                     )}

//                     {/* Mobile View All Button */}
//                     <div className="flex sm:hidden mt-8">
//                         <button
//                             onClick={() => navigate({ to: "/explore" })}
//                             className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
//                         >
//                             View All Prompts
//                             <ArrowRight size={20} />
//                         </button>
//                     </div>
//                 </div>
//             </section>

//             {/* CTA Section */}
//             <section className="py-16 px-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-t border-b border-white/10 my-8">
//                 <div className="max-w-6xl mx-auto text-center">
//                     <h2 className="text-3xl md:text-4xl font-bold mb-4">
//                         Ready to Create Your Own Prompt?
//                     </h2>
//                     <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
//                         Share your expertise with the community and help others
//                         succeed with AI
//                     </p>
//                     <button
//                         onClick={() => navigate({ to: "/create" })}
//                         className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-lg hover:shadow-blue-500/50 hover:shadow-xl"
//                     >
//                         Start Creating
//                         <Sparkles
//                             size={20}
//                             className="group-hover:rotate-12 transition-transform"
//                         />
//                     </button>
//                 </div>
//             </section>
//         </div>
//     );
// }

import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPrompts } from "../lib/promptApi.js";
import PromptCard from "../components/PromptCard.jsx";
import {
    Sparkles,
    TrendingUp,
    Zap,
    ArrowRight,
    Code2,
    Share2,
    Bookmark,
    Users,
    Award,
    MessageSquare,
    Globe,
    Cpu,
} from "lucide-react";

// --- Layout Component (Wrap your app in this for "Comfy" feel) ---
const Layout = ({ children }) => (
    <div className="min-h-screen bg-[#030712] text-slate-200 selection:bg-blue-500/30">
        {/* Animated Background Mesh */}
        <div className="fixed inset-0 -z-20 overflow-hidden">
            <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px]"></div>
        </div>
        <main>{children}</main>

        <footer className="border-t border-white/5 py-12 bg-black/20 mt-20">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="col-span-2">
                    <div className="font-bold text-lg mb-4">PromptVerse</div>
                    <p className="text-slate-500 text-sm max-w-xs">
                        The world's largest repository of high-quality AI
                        prompts for creators, engineers, and dreamers.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-500">
                        Platform
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li>Browse</li>
                        <li>API</li>
                        <li>Enterprise</li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold mb-4 text-sm uppercase tracking-widest text-slate-500">
                        Connect
                    </h4>
                    <ul className="space-y-2 text-sm text-slate-400">
                        <li>Discord</li>
                        <li>Twitter</li>
                        <li>Github</li>
                    </ul>
                </div>
            </div>
        </footer>
    </div>
);

export const Route = createFileRoute("/")({
    component: Home,
});

function Home() {
    const navigate = useNavigate();
    const { data, isLoading, isError } = useQuery({
        queryKey: ["prompts"],
        queryFn: fetchPrompts,
    });

    const recentPrompts = data?.slice(0, 6) || [];

    return (
        <Layout>
            <div className="w-full">
                {/* HERO: Enhanced with floating elements */}
                <section className="relative p-10">
                    <div className="max-w-5xl mx-auto text-center relative">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold mb-4">
                            <Sparkles size={14} /> NEW: GPT-5 Optimized Prompts
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tight leading-[0.9]">
                            MASTER THE <br />
                            <span className="bg-gradient-to-b from-blue-400 to-indigo-800 bg-clip-text text-transparent">
                                ART OF AI.
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto font-light">
                            Stop staring at a blank cursor. Access{" "}
                            <span className="text-white font-medium">
                                10,000+
                            </span>{" "}
                            battle-tested prompts that turn AI into your most
                            productive partner.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => navigate({ to: "/explore" })}
                                className="group px-6 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] cursor-pointer"
                            >
                                Start Browsing{" "}
                                <ArrowRight
                                    size={20}
                                    className="group-hover:translate-x-1 transition-transform"
                                />
                            </button>
                            <button
                                onClick={() => navigate({ to: "/create" })}
                                className="px-6 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-lg transition-all cursor-pointer"
                            >
                                Share a Prompt
                            </button>
                        </div>
                    </div>
                </section>

                {/* STATS BAR: Fills the visual gap */}
                <section className="max-w-7xl mx-auto px-6 py-12 border-y border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            {
                                label: "Active Creators",
                                val: "50k+",
                                icon: Users,
                            },
                            { label: "Daily Prompts", val: "1.2k", icon: Zap },
                            {
                                label: "Community Rating",
                                val: "4.9/5",
                                icon: Award,
                            },
                            {
                                label: "AI Models Supported",
                                val: "24+",
                                icon: Cpu,
                            },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="flex flex-col items-center md:items-start"
                            >
                                <div className="flex items-center gap-2 text-blue-500 mb-1">
                                    <stat.icon size={18} />
                                    <span className="text-2xl font-black text-white">
                                        {stat.val}
                                    </span>
                                </div>
                                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* WHY SECTION: Card-based for better structure */}
                <section className="py-24 px-6 max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
                        <div className="max-w-xl">
                            <h2 className="text-4xl font-bold mb-4">
                                Elevate your AI workflow.
                            </h2>
                            <p className="text-slate-400">
                                We don't just host text; we provide a framework
                                for better output from any LLM.
                            </p>
                        </div>
                        {/* <div className="text-blue-500 font-bold text-sm flex items-center gap-2 cursor-pointer hover:underline">
                            View all features <ArrowRight size={16} />
                        </div> */}
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Code2 className="text-blue-500" />}
                            title="Parameter Control"
                            desc="Tailor temperature, top-p, and system roles with our advanced prompt metadata."
                        />
                        <FeatureCard
                            icon={<MessageSquare className="text-purple-500" />}
                            title="Live Playground"
                            desc="Test prompts directly in the browser before you copy and paste them elsewhere."
                        />
                        <FeatureCard
                            icon={<Globe className="text-emerald-500" />}
                            title="Multi-Model Support"
                            desc="Optimized snippets for Midjourney, Claude, GPT-4, and local Llama models."
                        />
                    </div>
                </section>

                {/* RECENT PROMPTS: Grid focus */}
                <section className="py-24 px-6 bg-blue-600/5 relative">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-3xl font-bold">
                                Latest in the Universe
                            </h2>
                            <button className="hidden sm:block text-sm font-bold text-slate-400 hover:text-white transition-colors">
                                SEE FEED
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div
                                        key={i}
                                        className="h-64 bg-white/5 rounded-3xl animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {recentPrompts.map((prompt) => (
                                    <PromptCard
                                        key={prompt._id}
                                        prompt={prompt}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* NEWSLETTER: The "Comfy" Community vibe */}
                <section className="max-w-5xl mx-auto px-6 py-24">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl">
                        <div className="relative z-10">
                            <h2 className="text-4xl font-black mb-4">
                                Never miss a breakthrough.
                            </h2>
                            <p className="text-blue-100 mb-8 max-w-md mx-auto">
                                Join 20,000+ AI enthusiasts receiving the top 5
                                prompts of the week every Tuesday.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-6 py-4 rounded-2xl bg-white text-black focus:outline-none"
                                />
                                <button className="px-8 py-4 bg-black text-white font-bold rounded-2xl hover:bg-slate-900 transition-colors">
                                    Join Now
                                </button>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}

// Sub-component for clean code
function FeatureCard({ icon, title, desc }) {
    return (
        <div className="group p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-white/20 transition-all hover:-translate-y-2">
            <div className="mb-6 p-4 bg-white/5 rounded-2xl inline-block group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-slate-500 leading-relaxed text-sm">{desc}</p>
        </div>
    );
}