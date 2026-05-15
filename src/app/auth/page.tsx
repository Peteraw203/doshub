"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Mail, Lock, User, ArrowRight, Code, Globe, Loader2 } from "lucide-react";
import { signIn, signUp, confirmSignUp } from "aws-amplify/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showVerify, setShowVerify] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (showVerify) {
        // Step: Confirm Signup via Amplify
        await confirmSignUp({
          username: email,
          confirmationCode: code,
        });
        
        setSuccess("Account verified successfully! You can now log in.");
        setShowVerify(false);
        setIsLogin(true);
      } else if (isLogin) {
        // Step: Login via Amplify
        const { isSignedIn, nextStep } = await signIn({
          username: email,
          password: password,
        });
        
        if (isSignedIn) {
          router.push("/");
        } else if (nextStep.signInStep === "CONFIRM_SIGN_UP") {
          setSuccess("Account not verified yet. Please enter the code.");
          setShowVerify(true);
        }
      } else {
        // Step: Signup via Amplify
        await signUp({
          username: email,
          password: password,
          options: {
            userAttributes: {
              email: email,
              name: name,
            },
          },
        });
        
        setSuccess("Account created! Please enter the verification code sent to your email.");
        setShowVerify(true);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="bg-blue-600 rounded-xl p-2.5 shadow-lg shadow-blue-200 dark:shadow-none">
              <Play className="w-6 h-6 text-white fill-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              DOS<span className="text-blue-600 dark:text-blue-500">HUB</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {showVerify ? "Verify your email" : isLogin ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            {showVerify 
              ? `We've sent a code to ${email}`
              : isLogin 
              ? "Access your dashboard and manage your videos" 
              : "Join our community of creators today"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-[32px] shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-800 p-8 md:p-10 relative overflow-hidden">
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl text-green-600 dark:text-green-400 text-sm font-medium flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              {success}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            {showVerify ? (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                  Verification Code
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <>
                {!isLogin && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                      Full Name
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    {isLogin && (
                      <button type="button" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{showVerify ? "Verify Code" : isLogin ? "Sign In" : "Create Account"}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {!showVerify && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100 dark:border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-gray-900 px-4 text-gray-400 font-medium tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-3 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-800 rounded-2xl transition-all font-medium text-gray-700 dark:text-gray-300">
                  <Globe className="w-5 h-5" />
                  <span>Google</span>
                </button>
                <button className="flex items-center justify-center gap-3 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-800 rounded-2xl transition-all font-medium text-gray-700 dark:text-gray-300">
                  <Code className="w-5 h-5" />
                  <span>Github</span>
                </button>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-8 text-gray-600 dark:text-gray-400 font-medium">
          {showVerify 
            ? "Entered wrong email?" 
            : isLogin 
            ? "Don't have an account?" 
            : "Already have an account?"}{" "}
          <button
            onClick={() => {
              if (showVerify) setShowVerify(false);
              else setIsLogin(!isLogin);
              setError(null);
              setSuccess(null);
            }}
            className="text-blue-600 hover:text-blue-700 font-bold ml-1"
          >
            {showVerify ? "Go Back" : isLogin ? "Sign Up" : "Log In"}
          </button>
        </p>
      </div>
    </div>
  );
}
