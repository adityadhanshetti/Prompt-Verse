import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-up")({
    component: SignUpPage,
});

function SignUpPage() {
    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <SignUp routing="hash" />
        </div>
    );
}
