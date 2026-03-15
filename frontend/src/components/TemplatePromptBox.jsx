import { useMemo, useState } from "react";

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
    };

    return (
        <div className="mt-8 border border-gray-800 bg-gray-900 rounded-xl p-5">
            <h2 className="text-xl font-bold">Template Generator</h2>
            <p className="text-gray-400 text-sm mt-1">
                Fill variables to generate final prompt output.
            </p>

            <div className="mt-6 flex flex-col gap-4">
                {(prompt.variables || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">No variables found.</p>
                ) : (
                    prompt.variables.map((v, i) => (
                        <div key={i}>
                            <p className="text-sm font-semibold text-gray-200">
                                {v.key}{" "}
                                {v.required && (
                                    <span className="text-red-500 text-xs">
                                        (required)
                                    </span>
                                )}
                            </p>

                            {v.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                    {v.description}
                                </p>
                            )}

                            <input
                                value={values[v.key] || ""}
                                onChange={(e) =>
                                    handleChange(v.key, e.target.value)
                                }
                                placeholder={v.defaultValue || `Enter ${v.key}`}
                                className="mt-2 w-full bg-black border border-gray-800 px-4 py-2 rounded-lg outline-none focus:border-blue-500"
                            />
                        </div>
                    ))
                )}
            </div>

            <div className="mt-6 flex gap-3">
                <button
                    onClick={generatePrompt}
                    className="bg-blue-600 hover:bg-blue-500 px-5 py-2 rounded-lg font-semibold text-sm"
                >
                    Generate
                </button>

                <button
                    onClick={handleCopy}
                    disabled={!generated}
                    className="bg-gray-800 hover:bg-gray-700 px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
                >
                    Copy Output
                </button>
            </div>

            {generated && (
                <div className="mt-6">
                    <p className="text-sm text-gray-400 mb-2">
                        Generated Prompt:
                    </p>
                    <pre className="whitespace-pre-wrap text-sm bg-black border border-gray-800 p-4 rounded-xl text-gray-200">
                        {generated}
                    </pre>
                </div>
            )}
        </div>
    );
}
