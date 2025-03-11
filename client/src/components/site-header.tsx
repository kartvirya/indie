import { Link } from "wouter";
import { SiSteam } from "react-icons/si";
import { motion } from "framer-motion";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <nav className="flex h-16 items-center">
          <Link href="/">
            <a className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <motion.div
                whileHover={{ rotate: 20 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <SiSteam className="h-8 w-8 text-primary" />
              </motion.div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Indie Game Randomizer
              </span>
            </a>
          </Link>
        </nav>
      </div>
    </header>
  );
}