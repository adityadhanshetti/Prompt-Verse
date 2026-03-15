import { createFileRoute } from "@tanstack/react-router";
import { SignIn } from "@clerk/clerk-react";

export const Route = createFileRoute("/sign-in")({
    component: SignInPage,
});

function SignInPage() {
    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <SignIn routing="hash" />
        </div>
    );
}
