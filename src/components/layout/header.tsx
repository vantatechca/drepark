"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border flex items-center px-4 lg:px-6 gap-4 bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-9 w-9"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      {/* Current time/date display */}
      <div className="text-sm text-muted-foreground hidden sm:block">
        <CurrentTime />
      </div>
    </header>
  );
}

function CurrentTime() {
  return (
    <span suppressHydrationWarning>
      {new Date().toLocaleDateString("en-CA", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })}
    </span>
  );
}
