import * as React from "react"

import { cn } from "../../lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        // Mode clair : fond blanc avec bordure subtile
        "bg-white border-gray-300 text-gray-900",
        // Mode sombre : fond plus opaque et contrasté pour meilleure lisibilité
        "dark:bg-[#1e293b] dark:border-[#475569] dark:text-gray-100",
        // Styles communs
        "h-10 w-full min-w-0 rounded-lg px-4 py-2 text-base shadow-sm transition-all duration-200",
        "outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        // Focus : bordure et ring plus visibles
        "focus-visible:border-primary focus-visible:ring-primary/30 focus-visible:ring-[3px] focus-visible:ring-offset-0",
        "dark:focus-visible:border-blue-400 dark:focus-visible:ring-blue-400/40",
        // Hover : légère élévation
        "hover:border-gray-400 dark:hover:border-[#64748b]",
        // Validation d'erreur
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }

