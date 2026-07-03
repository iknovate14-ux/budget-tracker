"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/add", label: "+ Add Spend" },
  { href: "/history", label: "History" },
  { href: "/periods", label: "Periods" },
  { href: "/export", label: "Export" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-3xl mx-auto px-4 flex items-center gap-1 h-12">
        <span className="font-semibold text-gray-800 mr-3 text-sm">💷 Budget</span>
        <div className="flex flex-1 gap-0.5 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
                pathname.startsWith(l.href)
                  ? "bg-blue-100 text-blue-800"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-gray-600 ml-2 whitespace-nowrap"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
