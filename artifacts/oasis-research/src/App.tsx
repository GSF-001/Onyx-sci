import { useEffect, useRef } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Search from "./pages/Search";
import Copilot from "./pages/Copilot";
import Graph from "./pages/Graph";
import Gaps from "./pages/Gaps";
import Trends from "./pages/Trends";
import Collaborate from "./pages/Collaborate";
import Papers from "./pages/Papers";
import Collections from "./pages/Collections";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/oasis-logo.png`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#111111",
    colorForeground: "#111111",
    colorMutedForeground: "#6b7280",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#f9fafb",
    colorInputForeground: "#111111",
    colorNeutral: "#e5e7eb",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-neutral-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-neutral-900 font-bold text-xl",
    headerSubtitle: "text-neutral-500 text-sm",
    socialButtonsBlockButtonText: "text-neutral-700 font-medium",
    formFieldLabel: "text-neutral-700 text-sm font-medium",
    footerActionLink: "text-neutral-900 font-semibold hover:underline",
    footerActionText: "text-neutral-500",
    dividerText: "text-neutral-400 text-xs",
    identityPreviewEditButton: "text-neutral-700",
    formFieldSuccessText: "text-green-600",
    alertText: "text-neutral-700",
    logoBox: "flex justify-center mb-2",
    logoImage: "w-12 h-12 object-contain",
    socialButtonsBlockButton: "border border-neutral-200 hover:bg-neutral-50 rounded-xl",
    formButtonPrimary: "bg-neutral-900 hover:bg-neutral-700 text-white rounded-xl font-semibold",
    formFieldInput: "border border-neutral-200 bg-neutral-50 text-neutral-900 rounded-xl",
    footerAction: "bg-neutral-50 border-t border-neutral-100",
    dividerLine: "bg-neutral-200",
    alert: "bg-red-50 border border-red-200 rounded-xl",
    otpCodeFieldInput: "border border-neutral-200 rounded-xl",
    formFieldRow: "mb-1",
    main: "px-6 pb-6",
  },
};

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="font-black text-xl tracking-[0.08em] text-neutral-900">OASIS</div>
            <div className="font-medium text-xs tracking-[0.14em] text-neutral-500">Research</div>
          </div>
          <p className="text-xs text-neutral-400">Platform Intelijen Riset Ilmiah</p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          appearance={clerkAppearance}
          localization={{
            signIn: {
              start: {
                title: "Selamat Datang",
                subtitle: "Masuk untuk melanjutkan ke OASIS Research",
                actionText: "Belum punya akun?",
                actionLink: "Daftar gratis",
              },
            },
          }}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <div className="w-full">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-1 mb-2">
            <div className="font-black text-xl tracking-[0.08em] text-neutral-900">OASIS</div>
            <div className="font-medium text-xs tracking-[0.14em] text-neutral-500">Research</div>
          </div>
          <p className="text-xs text-neutral-400">Platform Intelijen Riset Ilmiah</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          appearance={clerkAppearance}
          localization={{
            signUp: {
              start: {
                title: "Buat Akun Gratis",
                subtitle: "Mulai riset Anda bersama OASIS Research",
                actionText: "Sudah punya akun?",
                actionLink: "Masuk",
              },
            },
          }}
        />
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Component />
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/home" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRouter() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{}}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/home" component={() => <ProtectedRoute component={Home} />} />
            <Route path="/search" component={() => <ProtectedRoute component={Search} />} />
            <Route path="/copilot" component={() => <ProtectedRoute component={Copilot} />} />
            <Route path="/graph" component={() => <ProtectedRoute component={Graph} />} />
            <Route path="/gaps" component={() => <ProtectedRoute component={Gaps} />} />
            <Route path="/trends" component={() => <ProtectedRoute component={Trends} />} />
            <Route path="/collaborate" component={() => <ProtectedRoute component={Collaborate} />} />
            <Route path="/papers" component={() => <ProtectedRoute component={Papers} />} />
            <Route path="/collections" component={() => <ProtectedRoute component={Collections} />} />
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRouter />
    </WouterRouter>
  );
}

export default App;
