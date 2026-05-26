"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/auth-provider";
import { productName, adminSubtitle } from "@/config/navigation";

const loginSchema = z.object({
  email: z.string().min(1, "Ingrese su correo").email("Correo inválido"),
  password: z.string().min(1, "Ingrese su contraseña"),
});

const newPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[A-Z]/, "Debe incluir mayúscula")
      .regex(/[a-z]/, "Debe incluir minúscula")
      .regex(/[0-9]/, "Debe incluir número")
      .regex(/[^A-Za-z0-9]/, "Debe incluir símbolo"),
    confirmPassword: z.string().min(1, "Confirme su contraseña"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

type LoginValues = z.infer<typeof loginSchema>;
type NewPasswordValues = z.infer<typeof newPasswordSchema>;

export function LoginForm() {
  const { login, completeNewPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [requiresNewPassword, setRequiresNewPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const {
    register: registerNewPassword,
    handleSubmit: handleSubmitNewPassword,
    formState: { isSubmitting: isChangingPassword, errors: newPasswordErrors },
  } = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const result = await login(values.email, values.password);
      if (result === "new-password-required") {
        setRequiresNewPassword(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión");
    }
  });

  const onSubmitNewPassword = handleSubmitNewPassword(async (values) => {
    setError(null);
    try {
      await completeNewPassword(values.newPassword);
      setRequiresNewPassword(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar la contraseña");
    }
  });

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#eef2f4]">
      <header className="flex h-16 items-center justify-between gap-3 bg-[#001c23] px-4 sm:px-8">
        <p className="shrink-0 text-lg font-extrabold tracking-tight text-white">
          Valorización <span className="text-[#008ba3]">Minera</span>
        </p>
        <p className="min-w-0 flex-1 px-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-white/95 sm:text-xs">
          {adminSubtitle}
        </p>
      </header>
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md border-[#e2e8f0] p-1 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{productName}</CardTitle>
            <CardDescription>Accede al panel administrativo.</CardDescription>
          </CardHeader>
          <CardContent>
          {requiresNewPassword ? (
            <form onSubmit={onSubmitNewPassword} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Este usuario requiere cambio de contraseña en el primer inicio de sesión.
              </p>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  {...registerNewPassword("newPassword")}
                />
                {newPasswordErrors.newPassword ? (
                  <p className="text-sm text-destructive">{newPasswordErrors.newPassword.message}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...registerNewPassword("confirmPassword")}
                />
                {newPasswordErrors.confirmPassword ? (
                  <p className="text-sm text-destructive">{newPasswordErrors.confirmPassword.message}</p>
                ) : null}
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={isChangingPassword}>
                {isChangingPassword ? "Actualizando…" : "Actualizar contraseña"}
              </Button>
            </form>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" type="email" autoComplete="username" {...register("email")} />
                {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
                {errors.password ? (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                ) : null}
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Ingresando…" : "Ingresar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
