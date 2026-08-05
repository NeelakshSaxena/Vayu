import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const bubbleVariants = cva(
  "relative flex flex-col gap-1 w-fit max-w-[80%]",
  {
    variants: {
      align: {
        start: "self-start",
        end: "self-end",
      },
    },
    defaultVariants: {
      align: "start",
    },
  }
)

const bubbleContentVariants = cva(
  "px-5 py-3.5 text-[18px] shadow-sm leading-relaxed transition-colors",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900",
        secondary: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-50",
        muted: "bg-slate-100/50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400",
        tinted: "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100",
        outline: "border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950",
        ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 max-w-none shadow-none",
        destructive: "bg-red-500 text-slate-50 dark:bg-red-900 dark:text-slate-50",
        // Additional custom variants to match user's requested look from the image
        user: "bg-blue-600 text-white",
        model: "bg-white text-black border border-black/10 dark:bg-[#1e1e20] dark:text-white dark:border-white/10",
      },
      align: {
        start: "rounded-2xl rounded-bl-sm",
        end: "rounded-2xl rounded-br-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      align: "start",
    },
  }
)

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof bubbleVariants> {
  variant?: VariantProps<typeof bubbleContentVariants>["variant"];
}

type BubbleContextValue = {
  variant?: VariantProps<typeof bubbleContentVariants>["variant"];
  align?: VariantProps<typeof bubbleContentVariants>["align"];
}
const BubbleContext = React.createContext<BubbleContextValue>({})

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, align, variant, children, ...props }, ref) => {
    return (
      <BubbleContext.Provider value={{ variant, align }}>
        <div ref={ref} className={cn(bubbleVariants({ align }), className)} {...props}>
          {children}
        </div>
      </BubbleContext.Provider>
    )
  }
)
Bubble.displayName = "Bubble"

export interface BubbleContentProps extends React.HTMLAttributes<HTMLDivElement> {
  render?: React.ReactElement;
}

const BubbleContent = React.forwardRef<HTMLDivElement, BubbleContentProps>(
  ({ className, render, children, ...props }, ref) => {
    const { variant, align } = React.useContext(BubbleContext)
    
    if (render) {
      return (
        <Slot ref={ref} className={cn(bubbleContentVariants({ variant, align }), className)} {...props}>
          {React.cloneElement(render, {}, children || render.props.children)}
        </Slot>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(bubbleContentVariants({ variant, align }), className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
BubbleContent.displayName = "BubbleContent"

export interface BubbleReactionsProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "bottom";
  align?: "start" | "end";
}

const BubbleReactions = React.forwardRef<HTMLDivElement, BubbleReactionsProps>(
  ({ className, side = "bottom", align = "end", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute flex items-center gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-full px-2 py-0.5 text-xs translate-y-1/2 z-10",
          side === "top" ? "-top-3" : "-bottom-3",
          align === "start" ? "left-2" : "right-2",
          className
        )}
        {...props}
      />
    )
  }
)
BubbleReactions.displayName = "BubbleReactions"

const BubbleGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-1 w-full", className)}
        {...props}
      />
    )
  }
)
BubbleGroup.displayName = "BubbleGroup"

export { Bubble, BubbleContent, BubbleReactions, BubbleGroup, bubbleVariants, bubbleContentVariants }
