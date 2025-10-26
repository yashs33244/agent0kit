"use client";

import { cn } from "@/lib/utils";
import { type ComponentProps, memo } from "react";
import { Streamdown } from "streamdown";

type ResponseProps = ComponentProps<typeof Streamdown>;

export const Response = memo(
  ({ className, ...props }: ResponseProps) => (
    <Streamdown
      className={cn(
        "prose prose-slate dark:prose-invert max-w-none",
        "prose-headings:font-bold prose-headings:tracking-tight",
        "prose-h1:text-3xl prose-h1:border-b prose-h1:pb-2 prose-h1:mb-4",
        "prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4",
        "prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3",
        "prose-p:my-4 prose-p:leading-7",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-strong:font-bold prose-strong:text-foreground",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-muted prose-pre:border prose-pre:border-border",
        "prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ul:space-y-2",
        "prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-ol:space-y-2",
        "prose-li:my-2 prose-li:leading-7",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary/30 prose-blockquote:bg-muted/50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:italic",
        "prose-table:w-full prose-table:border-collapse",
        "prose-th:border prose-th:border-border prose-th:bg-muted prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold",
        "prose-td:border prose-td:border-border prose-td:px-4 prose-td:py-2",
        "prose-hr:my-8 prose-hr:border-border",
        "prose-img:rounded-lg prose-img:shadow-md",
        "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    />
  ),
  (prevProps, nextProps) => prevProps.children === nextProps.children
);

Response.displayName = "Response";
