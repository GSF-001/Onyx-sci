"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PinInput } from "@/components/ui/pin-input"

export type OtpDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: React.ReactNode
  length?: number
  onVerify: (code: string) => void | Promise<void>
  onResend?: () => void | Promise<void>
  resendCooldownSeconds?: number
  verifying?: boolean
  error?: string
}

function OtpDialog({
  open,
  onOpenChange,
  title = "Verify your identity",
  description = "Enter the verification code we sent you.",
  length = 6,
  onVerify,
  onResend,
  resendCooldownSeconds = 30,
  verifying = false,
  error,
}: OtpDialogProps) {
  const [code, setCode] = React.useState("")
  const [cooldown, setCooldown] = React.useState(0)
  const [resending, setResending] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setCode("")
      setCooldown(resendCooldownSeconds)
    }
  }, [open, resendCooldownSeconds])

  React.useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const handleComplete = (value: string) => {
    onVerify(value)
  }

  const handleResend = async () => {
    if (!onResend || cooldown > 0 || resending) return
    setResending(true)
    try {
      await onResend()
      setCooldown(resendCooldownSeconds)
      setCode("")
    } finally {
      setResending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <PinInput
            length={length}
            value={code}
            onChange={setCode}
            onComplete={handleComplete}
            disabled={verifying}
            autoFocus
            slotClassName={cn(error && "border-destructive ring-destructive/20")}
          />
          {error && (
            <p className="text-destructive animate-in fade-in-0 slide-in-from-top-1 text-sm">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-col sm:items-stretch sm:space-x-0">
          <Button
            type="button"
            disabled={code.length !== length || verifying}
            onClick={() => onVerify(code)}
            className="w-full"
          >
            {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify
          </Button>

          {onResend && (
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="text-muted-foreground hover:text-foreground mx-auto text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                  ? `Resend code in ${cooldown}s`
                  : "Resend code"}
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { OtpDialog }
