export const extractVariables = (text) => {
    const regex = /{{([^}]+)}}/g;
    const matches = [...text.matchAll(regex)];

    const uniqueKeys = [...new Set(matches.map((m) => m[1].trim()))];

    return uniqueKeys.map((key) => ({
        key,
        description: "",
        defaultValue: "",
        required: true,
    }));
};
