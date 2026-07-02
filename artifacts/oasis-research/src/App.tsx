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
    logoImageUrl: `${window.location.origin}${basePath}/onyx-logo-transparent.png`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#ffffff",
    colorForeground: "#ffffff",
    colorMutedForeground: "#94a3b8",
    colorDanger: "#f87171",
    colorBackground: "#09090f",
    colorInput: "#0f0f18",
    colorInputForeground: "#ffffff",
    colorNeutral: "#1e293b",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-[#09090f] rounded-2xl w-[440px] max-w-full overflow-hidden shadow-2xl border border-white/10",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-white font-black text-xl",
    headerSubtitle: "text-neutral-500 text-sm",
    socialButtonsBlockButtonText: "text-neutral-300 font-medium",
    formFieldLabel: "text-neutral-400 text-sm font-medium",
    footerActionLink: "text-white font-semibold hover:underline",
    footerActionText: "text-neutral-500",
    dividerText: "text-neutral-600 text-xs",
    identityPreviewEditButton: "text-neutral-400",
    formFieldSuccessText: "text-emerald-400",
    alertText: "text-neutral-400",
    logoBox: "flex justify-center mb-2",
    logoImage: "w-12 h-12 object-contain",
    socialButtonsBlockButton: "border border-white/10 hover:bg-white/6 rounded-xl bg-white/3",
    formButtonPrimary: "bg-white hover:bg-neutral-100 text-black rounded-xl font-bold",
    formFieldInput: "border border-white/10 bg-white/5 text-white rounded-xl placeholder:text-neutral-600",
    footerAction: "bg-white/3 border-t border-white/5",
    dividerLine: "bg-white/10",
    alert: "bg-red-500/10 border border-red-500/20 rounded-xl",
    otpCodeFieldInput: "border border-white/10 rounded-xl bg-white/5 text-white",
    formFieldRow: "mb-1",
    main: "px-6 pb-6",
  },
};

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_60%)] pointer-events-none" />
      <div className="w-full relative z-10">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-1 mb-2">
            <img src={`${basePath}/onyx-logo-transparent.png`} alt="ONYX" className="w-12 h-12 object-contain mb-1" />
            <div className="font-black text-xl tracking-[0.12em] text-white">ONYX</div>
            <div className="font-medium text-xs tracking-[0.22em] text-neutral-500 uppercase">research</div>
          </div>
          <p className="text-xs text-neutral-600 mt-1">AI-Powered Research Intelligence</p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
          appearance={clerkAppearance}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.03)_0%,_transparent_60%)] pointer-events-none" />
      <div className="w-full relative z-10">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center gap-1 mb-2">
            <img src={`${basePath}/onyx-logo-transparent.png`} alt="ONYX" className="w-12 h-12 object-contain mb-1" />
            <div className="font-black text-xl tracking-[0.12em] text-white">ONYX</div>
            <div className="font-medium text-xs tracking-[0.22em] text-neutral-500 uppercase">research</div>
          </div>
          <p className="text-xs text-neutral-600 mt-1">AI-Powered Research Intelligence</p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
          appearance={clerkAppearance}
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
