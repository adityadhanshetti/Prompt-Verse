import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { incrementCopyCount } from "../lib/promptApi.js";

export default function TemplatePromptBox({ prompt }) {
    const initialValues = useMemo(() => {
        const obj = {};
        (prompt.variables || []).forEach((v) => {
            obj[v.key] = v.defaultValue || "";
        });
        return obj;
    }, [prompt]);

    const [values, setValues] = useState(initialValues);
    const [generated, setGenerated] = useState("");

    const handleChange = (key, val) => {
        setValues((prev) => ({ ...prev, [key]: val }));
    };

    const generatePrompt = () => {
        let finalText = prompt.promptText;

        (prompt.variables || []).forEach((v) => {
            const value = values[v.key] || "";
            finalText = finalText.replaceAll(`{{${v.key}}}`, value);
        });

        setGenerated(finalText);
    };

    const handleCopy = async () => {
        if (!generated) return;
        await navigator.clipboard.writeText(generated);
        try {
            await incrementCopyCount(prompt._id);
        } catch {}
    };

    return (
        <div id="template-generator" className="mt-8 border border-white/10 bg-white/3 rounded-4xl p-8">
            <h2 className="text-xl font-bold text-white">Template Generator</h2>
            <p className="text-slate-400 text-sm mt-1">
                Fill variables to generate final prompt output.
            </p>

            <div className="mt-8 flex flex-col gap-5">
                {(prompt.variables || []).length === 0 ? (
                    <p className="text-slate-500 text-sm">No variables found.</p>
                ) : (
                    prompt.variables.map((v, i) => (
                        <div key={i}>
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                {v.key}{" "}
                                {v.required && (
                                    <span className="text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">
                                        Required
                                    </span>
                                )}
                            </p>

                            {v.description && (
                                <p className="text-xs text-slate-500 mt-1 mb-2">
                                    {v.description}
                                </p>
                            )}

                            <input
                                value={values[v.key] || ""}
                                onChange={(e) =>
                                    handleChange(v.key, e.target.value)
                                }
                                placeholder={v.defaultValue || `Enter ${v.key}`}
                                className="mt-1 w-full bg-black/50 border border-white/10 px-5 py-3 rounded-xl outline-none focus:border-blue-500/50 text-white transition-colors"
                            />
                        </div>
                    ))
                )}
            </div>

            <div className="mt-8 flex gap-3 flex-wrap">
                <button
                    onClick={generatePrompt}
                    className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                    Generate
                </button>

                <button
                    onClick={handleCopy}
                    disabled={!generated}
                    className="bg-white/5 border border-white/10 hover:bg-white/10 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Copy Output
                </button>
                
                {generated && (
                    <Link
                        to="/playground"
                        search={{ text: generated }}
                        className="bg-linear-to-r from-violet-600 to-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm text-white transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98] flex items-center gap-2"
                    >
                        <Play size={16} /> Try in Playground
                    </Link>
                )}
            </div>

            {generated && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-3">
                        Generated Output
                    </p>
                    <pre className="whitespace-pre-wrap text-sm bg-black/50 border border-white/10 p-6 rounded-2xl text-slate-300 font-mono leading-relaxed">
                        {generated}
                    </pre>
                </div>
            )}
        </div>
    );
}
