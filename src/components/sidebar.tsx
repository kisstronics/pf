"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  Landmark,
  Building2,
  Shield,
  FileText,
  Settings,
  LogOut,
  Wallet,
  PiggyBank,
  TrendingUp,
  Banknote,
  CreditCard,
  MinusCircle,
  CircleDollarSign,
  LineChart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/income", label: "Income", icon: CircleDollarSign },
  { href: "/accounts", label: "Accounts", icon: Landmark },
  { href: "/investments", label: "Investments", icon: TrendingUp },
  { href: "/assets", label: "Assets", icon: Building2 },
  { href: "/nps", label: "NPS", icon: PiggyBank },
  { href: "/epf", label: "EPF", icon: Wallet },
  { href: "/loans", label: "Loans", icon: Banknote },
  { href: "/credit-cards", label: "Credit Cards", icon: CreditCard },
  { href: "/overdraft", label: "Overdraft", icon: MinusCircle },
  { href: "/projection", label: "Projection", icon: LineChart },
  { href: "/insurance", label: "Insurance", icon: Shield },
  { href: "/term-policies", label: "Term Policies", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-6">
        <h1 className="text-lg font-bold">Finance Tracker</h1>
        <p className="text-xs text-muted-foreground">Personal expense & net worth</p>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
