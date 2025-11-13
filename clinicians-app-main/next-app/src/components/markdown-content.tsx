"use client";

import React from "react";
import Markdown from "react-markdown";

interface MarkdownContentProps {
  content: string | null | undefined;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
}) => {
  if (!content) {
    return (
      //   <p className="text-muted-foreground italic">No content available.</p>
      null
    );
  }

  return (
    <Markdown
      components={{
        h1: (props) => <h1 className="text-2xl font-medium mb-6" {...props} />,
        h2: (props) => <h2 className="text-xl font-medium mb-6" {...props} />,
        h3: (props) => <h3 className="text-lg font-medium mb-6" {...props} />,
        h4: (props) => <h4 className="text-base font-medium mb-6" {...props} />,
        p: (props) => <p className="mb-6 leading-relaxed" {...props} />,
        ul: (props) => <ul className="list-disc list-inside mb-6" {...props} />,
        ol: (props) => (
          <ol className="list-decimal list-inside mb-6" {...props} />
        ),
        li: (props) => <li className="mb-1" {...props} />,
        strong: (props) => <strong className="font-semibold" {...props} />,
        code: ({
          // inline,

          children,
          ...props
        }) => {
          //   if (inline) {
          //     // inline `code` → behave like plain text
          //     return null;
          //     return (
          //       <span
          //         className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono whitespace-normal break-all align-baseline"
          //         style={{ overflowWrap: "anywhere" }}
          //         {...props}
          //       >
          //         {children}
          //       </span>
          //     );
          //   }
          // fenced code block → render as <p>
          // Fenced code block → render as a paragraph-like element
          return (
            <p
              // font-mono
              className="mb-6 leading-relaxed font-mono p-3 rounded whitespace-pre-wrap break-words"
              style={{ overflowWrap: "break-word" }}
            >
              {children}
            </p>
          );
        },
        blockquote: (props) => (
          <blockquote
            className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700"
            {...props}
          />
        ),
      }}
    >
      {content}
    </Markdown>
  );
};

export default MarkdownContent;
