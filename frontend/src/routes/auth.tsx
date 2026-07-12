import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Truck,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  Users,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TransitOps" },
      {
        name: "description",
        content: "Sign in to TransitOps to manage your fleet, drivers, trips and operations.",
      },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(72),
  role: z.enum(["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"]),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const roleIcons: { role: UserRole; icon: typeof Navigation }[] = [
  { role: "Fleet Manager", icon: Truck },
  { role: "Dispatcher", icon: Users },
  { role: "Safety Officer", icon: ShieldCheck },
  { role: "Financial Analyst", icon: TrendingUp },
];

function AuthPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/dashboard" });
  }, [isAuthenticated, navigate]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", role: "Fleet Manager", remember: true },
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    const res = await login(values.email, values.password, values.role);
    if (!res.ok) {
      setError(res.error ?? "Sign in failed");
      setLocked(!!res.locked);
      return;
    }
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left panel */}
      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between p-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex items-center gap-2">
          <img
            src="/favicon.png"
            alt="TransitOps Logo"
            className="h-18 w-18 shrink-0 rounded-xl object-contain"
          />
          <div>
            <p className="text-2xl font-bold">TransitOps</p>
            <p className="text-sm text-sidebar-foreground/60">
              Smart Transport Operations Platform
            </p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-bold leading-tight">One Login, Four Roles.</h2>
          <p className="mt-3 text-sidebar-foreground/70">
            A unified platform for everyone who keeps your fleet moving.
          </p>
          <ul className="mt-8 space-y-3">
            {roleIcons.map(({ role, icon: Icon }) => (
              <li
                key={role}
                className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{role}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs text-sidebar-foreground/50">
          © {new Date().getFullYear()} TransitOps · Frontend Demo
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="TransitOps Logo"
              className="h-10 w-10 shrink-0 rounded-xl object-contain"
            />
            <span className="text-lg font-bold">TransitOps</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access your operations dashboard.
          </p>

          {error && (
            <Alert variant={locked ? "destructive" : "default"} className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  placeholder="manager@transitops.io"
                  {...form.register("email")}
                />
              </div>
              {form.formState.errors.email && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button type="button" className="text-xs font-medium text-primary hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  placeholder="••••••••"
                  {...form.register("password")}
                />
              </div>
              {form.formState.errors.password && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div>
              <Label>Role</Label>
              <Select
                defaultValue={form.getValues("role")}
                onValueChange={(v) => form.setValue("role", v as UserRole)}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleIcons.map(({ role, icon: Icon }) => (
                    <SelectItem key={role} value={role}>
                      <span className="flex items-center gap-2">
                        <Icon className="h-4 w-4" /> {role}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="remember" defaultChecked {...(form.register("remember") as any)} />
              <Label htmlFor="remember" className="text-sm font-normal">
                Remember me
              </Label>
            </div>
            <Button type="submit" className="w-full" isLoading={form.formState.isSubmitting}>
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
