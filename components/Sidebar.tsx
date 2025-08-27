"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutList, PlusCircle, LogOut, User } from "lucide-react";

const NavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
};

export default function Sidebar() {
  return (
    <aside className="w-64 shrink-0 bg-gray-900 text-gray-100 min-h-screen flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-bold">Docker Cmd Studio</h1>
        <p className="text-xs text-gray-400">Generate & manage containers</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <NavItem href="/" label="Lists" icon={LayoutList} />
        <NavItem href="/new" label="New Command" icon={PlusCircle} />
        <NavItem href="/profile" label="Profile" icon={User} />
      </nav>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}