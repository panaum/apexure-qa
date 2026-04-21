export type Severity = "Critical" | "Major" | "Minor" | "Match";

export interface StyleDifference {
  figma: string | number;
  web: string | number;
}

export interface ElementDifferences {
  element: string;
  section: string;
  severity: Severity;
  differences: {
    color?: StyleDifference;
    fontSize?: StyleDifference;
    fontWeight?: StyleDifference;
    fontFamily?: StyleDifference;
    lineHeight?: StyleDifference;
  };
}

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  avatar?: string;
  differences: {
    quoteText: ElementDifferences;
    nameText: ElementDifferences;
  };
}

export interface FAQItem {
  question: string;
  answer: string;
  differences: {
    questionText: ElementDifferences;
    answerText: ElementDifferences;
  };
}

export const headerDifferences: ElementDifferences[] = [
  {
    element: "Logo Title",
    section: "Header",
    severity: "Minor",
    differences: {
      color: { figma: "#1A1F36", web: "#222222" },
      fontSize: { figma: 18, web: 16 },
      fontWeight: { figma: 700, web: 600 },
      fontFamily: { figma: "Space Grotesk", web: "Space Grotesk" },
      lineHeight: { figma: 24, web: 22 },
    },
  },
  {
    element: "Nav Link",
    section: "Header",
    severity: "Match",
    differences: {
      color: { figma: "#64748B", web: "#64748B" },
      fontSize: { figma: 14, web: 14 },
      fontWeight: { figma: 500, web: 500 },
      fontFamily: { figma: "DM Sans", web: "DM Sans" },
      lineHeight: { figma: 20, web: 20 },
    },
  },
  {
    element: "CTA Button",
    section: "Header",
    severity: "Major",
    differences: {
      color: { figma: "#FFFFFF", web: "#F8F8F8" },
      fontSize: { figma: 14, web: 15 },
      fontWeight: { figma: 600, web: 500 },
      fontFamily: { figma: "DM Sans", web: "DM Sans" },
      lineHeight: { figma: 20, web: 22 },
    },
  },
];

export const heroDifferences: ElementDifferences[] = [
  {
    element: "Hero Heading",
    section: "Hero",
    severity: "Critical",
    differences: {
      color: { figma: "#1A1F36", web: "#333333" },
      fontSize: { figma: 48, web: 42 },
      fontWeight: { figma: 700, web: 600 },
      fontFamily: { figma: "Space Grotesk", web: "Inter" },
      lineHeight: { figma: 56, web: 50 },
    },
  },
  {
    element: "Hero Subheading",
    section: "Hero",
    severity: "Minor",
    differences: {
      color: { figma: "#64748B", web: "#6B7280" },
      fontSize: { figma: 18, web: 16 },
      fontWeight: { figma: 400, web: 400 },
      fontFamily: { figma: "DM Sans", web: "DM Sans" },
      lineHeight: { figma: 28, web: 24 },
    },
  },
  {
    element: "Primary CTA Button",
    section: "Hero",
    severity: "Critical",
    differences: {
      color: { figma: "#FFFFFF", web: "#F0F0F0" },
      fontSize: { figma: 16, web: 18 },
      fontWeight: { figma: 600, web: 400 },
      fontFamily: { figma: "DM Sans", web: "Arial" },
      lineHeight: { figma: 24, web: 26 },
    },
  },
];

export const cardDifferences: ElementDifferences[] = [
  {
    element: "Primary Button",
    section: "Cards",
    severity: "Critical",
    differences: {
      color: { figma: "#000000", web: "#222222" },
      fontSize: { figma: 16, web: 18 },
      fontWeight: { figma: 600, web: 400 },
      fontFamily: { figma: "Inter", web: "Inter" },
      lineHeight: { figma: 24, web: 26 },
    },
  },
  {
    element: "Card Title",
    section: "Cards",
    severity: "Major",
    differences: {
      color: { figma: "#1A1F36", web: "#2D3748" },
      fontSize: { figma: 20, web: 18 },
      fontWeight: { figma: 600, web: 500 },
      fontFamily: { figma: "Space Grotesk", web: "Inter" },
      lineHeight: { figma: 28, web: 24 },
    },
  },
  {
    element: "Card Description",
    section: "Cards",
    severity: "Minor",
    differences: {
      color: { figma: "#64748B", web: "#718096" },
      fontSize: { figma: 14, web: 14 },
      fontWeight: { figma: 400, web: 400 },
      fontFamily: { figma: "DM Sans", web: "DM Sans" },
      lineHeight: { figma: 22, web: 20 },
    },
  },
  {
    element: "Badge Text",
    section: "Cards",
    severity: "Match",
    differences: {
      color: { figma: "#10B981", web: "#10B981" },
      fontSize: { figma: 12, web: 12 },
      fontWeight: { figma: 500, web: 500 },
      fontFamily: { figma: "DM Sans", web: "DM Sans" },
      lineHeight: { figma: 16, web: 16 },
    },
  },
  {
    element: "Secondary Action",
    section: "Cards",
    severity: "Major",
    differences: {
      color: { figma: "#3B82F6", web: "#2563EB" },
      fontSize: { figma: 14, web: 13 },
      fontWeight: { figma: 500, web: 600 },
      fontFamily: { figma: "DM Sans", web: "Helvetica" },
      lineHeight: { figma: 20, web: 18 },
    },
  },
  {
    element: "Metric Value",
    section: "Cards",
    severity: "Critical",
    differences: {
      color: { figma: "#1A1F36", web: "#000000" },
      fontSize: { figma: 32, web: 28 },
      fontWeight: { figma: 700, web: 600 },
      fontFamily: { figma: "Space Grotesk", web: "Inter" },
      lineHeight: { figma: 40, web: 34 },
    },
  },
];

export const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Lead Designer at Stripe",
    quote: "Design Integrity Monitor saved us 20+ hours per sprint by catching style inconsistencies before they reached production.",
    differences: {
      quoteText: {
        element: "Testimonial Quote",
        section: "Testimonials",
        severity: "Minor",
        differences: {
          color: { figma: "#374151", web: "#4B5563" },
          fontSize: { figma: 16, web: 15 },
          fontWeight: { figma: 400, web: 400 },
          fontFamily: { figma: "DM Sans", web: "DM Sans" },
          lineHeight: { figma: 26, web: 24 },
        },
      },
      nameText: {
        element: "Author Name",
        section: "Testimonials",
        severity: "Match",
        differences: {
          color: { figma: "#1A1F36", web: "#1A1F36" },
          fontSize: { figma: 14, web: 14 },
          fontWeight: { figma: 600, web: 600 },
          fontFamily: { figma: "DM Sans", web: "DM Sans" },
          lineHeight: { figma: 20, web: 20 },
        },
      },
    },
  },
  {
    name: "Marcus Rivera",
    role: "Frontend Lead at Vercel",
    quote: "The property-level comparison made it trivial to track down where our CSS diverged from the Figma specs.",
    differences: {
      quoteText: {
        element: "Testimonial Quote",
        section: "Testimonials",
        severity: "Major",
        differences: {
          color: { figma: "#374151", web: "#1F2937" },
          fontSize: { figma: 16, web: 18 },
          fontWeight: { figma: 400, web: 300 },
          fontFamily: { figma: "DM Sans", web: "Inter" },
          lineHeight: { figma: 26, web: 28 },
        },
      },
      nameText: {
        element: "Author Name",
        section: "Testimonials",
        severity: "Minor",
        differences: {
          color: { figma: "#1A1F36", web: "#111827" },
          fontSize: { figma: 14, web: 13 },
          fontWeight: { figma: 600, web: 700 },
          fontFamily: { figma: "DM Sans", web: "DM Sans" },
          lineHeight: { figma: 20, web: 18 },
        },
      },
    },
  },
  {
    name: "Anika Patel",
    role: "Design Systems at Shopify",
    quote: "Finally, a tool that speaks both designer and developer language. The severity flags are a game-changer.",
    differences: {
      quoteText: {
        element: "Testimonial Quote",
        section: "Testimonials",
        severity: "Match",
        differences: {
          color: { figma: "#374151", web: "#374151" },
          fontSize: { figma: 16, web: 16 },
          fontWeight: { figma: 400, web: 400 },
          fontFamily: { figma: "DM Sans", web: "DM Sans" },
          lineHeight: { figma: 26, web: 26 },
        },
      },
      nameText: {
        element: "Author Name",
        section: "Testimonials",
        severity: "Critical",
        differences: {
          color: { figma: "#1A1F36", web: "#6B7280" },
          fontSize: { figma: 14, web: 12 },
          fontWeight: { figma: 600, web: 400 },
          fontFamily: { figma: "DM Sans", web: "Arial" },
          lineHeight: { figma: 20, web: 16 },
        },
      },
    },
  },
];

export const faqItems: FAQItem[] = [
  {
    question: "How does Design Integrity Monitor detect styling differences?",
    answer: "We compare computed CSS properties from your live website against exported Figma design tokens, checking color, font-size, font-weight, font-family, and line-height for each mapped element.",
    differences: {
      questionText: {
        element: "FAQ Question",
        section: "FAQ",
        severity: "Minor",
        differences: {
          color: { figma: "#1A1F36", web: "#111827" },
          fontSize: { figma: 16, web: 15 },
          fontWeight: { figma: 600, web: 500 },
          fontFamily: { figma: "Space Grotesk", web: "Space Grotesk" },
          lineHeight: { figma: 24, web: 22 },
        },
      },
      answerText: {
        element: "FAQ Answer",
        section: "FAQ",
        severity: "Match",
        differences: {
          color: { figma: "#64748B", web: "#64748B" },
          fontSize: { figma: 14, web: 14 },
          fontWeight: { figma: 400, web: 400 },
          fontFamily: { figma: "DM Sans", web: "DM Sans" },
          lineHeight: { figma: 22, web: 22 },
        },
      },
    },
  },
  {
    question: "Can I integrate this with my CI/CD pipeline?",
    answer: "Yes! We provide a CLI tool and GitHub Action that can run design integrity checks as part of your build process, failing the build if critical differences are detected.",
    differences: {
      questionText: {
        element: "FAQ Question",
        section: "FAQ",
        severity: "Major",
        differences: {
          color: { figma: "#1A1F36", web: "#374151" },
          fontSize: { figma: 16, web: 14 },
          fontWeight: { figma: 600, web: 700 },
          fontFamily: { figma: "Space Grotesk", web: "Inter" },
          lineHeight: { figma: 24, web: 20 },
        },
      },
      answerText: {
        element: "FAQ Answer",
        section: "FAQ",
        severity: "Minor",
        differences: {
          color: { figma: "#64748B", web: "#6B7280" },
          fontSize: { figma: 14, web: 13 },
          fontWeight: { figma: 400, web: 400 },
          fontFamily: { figma: "DM Sans", web: "DM Sans" },
          lineHeight: { figma: 22, web: 20 },
        },
      },
    },
  },
  {
    question: "What browsers and frameworks are supported?",
    answer: "We support all modern browsers (Chrome, Firefox, Safari, Edge) and work with any framework — React, Vue, Angular, Svelte, or plain HTML/CSS.",
    differences: {
      questionText: {
        element: "FAQ Question",
        section: "FAQ",
        severity: "Match",
        differences: {
          color: { figma: "#1A1F36", web: "#1A1F36" },
          fontSize: { figma: 16, web: 16 },
          fontWeight: { figma: 600, web: 600 },
          fontFamily: { figma: "Space Grotesk", web: "Space Grotesk" },
          lineHeight: { figma: 24, web: 24 },
        },
      },
      answerText: {
        element: "FAQ Answer",
        section: "FAQ",
        severity: "Critical",
        differences: {
          color: { figma: "#64748B", web: "#9CA3AF" },
          fontSize: { figma: 14, web: 12 },
          fontWeight: { figma: 400, web: 300 },
          fontFamily: { figma: "DM Sans", web: "Helvetica" },
          lineHeight: { figma: 22, web: 18 },
        },
      },
    },
  },
];

export const footerDifferences: ElementDifferences[] = [
  {
    element: "Footer Contact Email",
    section: "Footer",
    severity: "Minor",
    differences: {
      color: { figma: "#64748B", web: "#9CA3AF" },
      fontSize: { figma: 14, web: 13 },
      fontWeight: { figma: 400, web: 400 },
      fontFamily: { figma: "DM Sans", web: "DM Sans" },
      lineHeight: { figma: 20, web: 18 },
    },
  },
  {
    element: "Footer Copyright",
    section: "Footer",
    severity: "Match",
    differences: {
      color: { figma: "#94A3B8", web: "#94A3B8" },
      fontSize: { figma: 12, web: 12 },
      fontWeight: { figma: 400, web: 400 },
      fontFamily: { figma: "DM Sans", web: "DM Sans" },
      lineHeight: { figma: 16, web: 16 },
    },
  },
  {
    element: "Footer Link",
    section: "Footer",
    severity: "Major",
    differences: {
      color: { figma: "#3B82F6", web: "#60A5FA" },
      fontSize: { figma: 14, web: 12 },
      fontWeight: { figma: 500, web: 400 },
      fontFamily: { figma: "DM Sans", web: "Inter" },
      lineHeight: { figma: 20, web: 18 },
    },
  },
];

export type PropertyType = "color" | "fontSize" | "fontWeight" | "fontFamily" | "lineHeight";

export const allPropertyTypes: PropertyType[] = ["color", "fontSize", "fontWeight", "fontFamily", "lineHeight"];
export const allSeverities: Severity[] = ["Critical", "Major", "Minor", "Match"];

export const getAllDifferences = (): ElementDifferences[] => {
  const testimonialDiffs = testimonials.flatMap((t) => [t.differences.quoteText, t.differences.nameText]);
  const faqDiffs = faqItems.flatMap((f) => [f.differences.questionText, f.differences.answerText]);
  return [...headerDifferences, ...heroDifferences, ...cardDifferences, ...testimonialDiffs, ...faqDiffs, ...footerDifferences];
};
