import { Link } from "wouter";
import { SiSteam } from "react-icons/si";

export default function SiteHeader() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center space-x-2">
              <SiSteam className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Indie Game Randomizer</span>
            </a>
          </Link>
        </nav>
      </div>
    </header>
  );
}
