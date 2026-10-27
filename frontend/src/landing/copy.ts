export interface CatchCard {
  id: string;
  exampleId: string;
  title: string;
  claimSnippet: string;
  evidenceSnippet: string;
  stretchedPart: string;
  explanation: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const LANDING_COPY = {
  hero: {
    headline: "Catch claims that outgrow their evidence before you publish.",
    sub: "Paste a marketing claim and the evidence behind it. ClaimFit compares seven dimensions, shows the exact words each finding rests on, and sends anything unclear to a person.",
    ctaPrimary: "Check a claim",
    ctaSecondary: "See a live example",
    quietNote: "Checks your supplied evidence only. It cannot tell you a claim is true.",
    cardCaption: "Illustrative precomputed sample: Real output from the ClaimFit engine for a sample critical scenario.",
  },

  trustRow: [
    {
      title: "Code decides, not the model.",
      desc: "The model only proposes quotes. Rules verify them against your text and make the call.",
    },
    {
      title: "Every finding has receipts.",
      desc: "Highlights come from verified character positions in your own text.",
    },
    {
      title: "Unclear goes to a person.",
      desc: "Anything the engine cannot read reliably is marked Needs review, never approved.",
    },
  ],

  howItWorks: {
    title: "How it works",
    subtitle: "Three deterministic steps to verify marketing copy against backing data.",
    steps: [
      {
        number: "01",
        title: "Paste claim and evidence",
        desc: "Supply the copy you want to publish and the underlying test, survey, or report.",
      },
      {
        number: "02",
        title: "ClaimFit compares seven dimensions",
        desc: "Metric, value, unit, population, time window, conditions, and strength are compared.",
      },
      {
        number: "03",
        title: "Read the verdict, rewrite and re-verify",
        desc: "Inspect highlighted character spans, get a narrower suggestion, and re-verify instantly.",
      },
    ],
  },

  catches: {
    title: "What it catches",
    subtitle: "Common ways claims slip past review, each backed by real test scenarios.",
    cards: [
      {
        id: "stretched-number",
        exampleId: "critical",
        title: "A number stretched",
        claimSnippet: "Our platform cuts setup time by 40% for every business.",
        evidenceSnippet: "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.",
        stretchedPart: "40%",
        explanation: "Evidence recorded 30%; claim expanded it to 40%.",
      },
      {
        id: "stretched-scope",
        exampleId: "critical",
        title: "A scope stretched",
        claimSnippet: "Our platform cuts setup time by 40% for every business.",
        evidenceSnippet: "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.",
        stretchedPart: "every business",
        explanation: "120 small-business cohort was generalized to all businesses.",
      },
      {
        id: "dropped-condition",
        exampleId: "missing-condition",
        title: "A condition dropped",
        claimSnippet: "In a 30-day test of 120 small-business customers, median setup time fell by 30%.",
        evidenceSnippet: "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.",
        stretchedPart: "using Pro",
        explanation: "The Pro tier condition was silently omitted.",
      },
      {
        id: "promise-guarantee",
        exampleId: "guarantee",
        title: "A result turned into a promise",
        claimSnippet: "Pro guarantees setup time falls by 30% for small-business customers.",
        evidenceSnippet: "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.",
        stretchedPart: "guarantees",
        explanation: "An observed retrospective finding was converted to a future guarantee.",
      },
      {
        id: "mean-median",
        exampleId: "mean-median",
        title: "Mean is not median",
        claimSnippet: "In a 30-day test of 120 small-business customers using Pro, average setup time fell by 30%.",
        evidenceSnippet: "In a 30-day test of 120 small-business customers using Pro, median setup time fell by 30%.",
        stretchedPart: "average",
        explanation: "“Average” was substituted where only “median” was measured.",
      },
      {
        id: "pct-points",
        exampleId: "pct-points",
        title: "Percent is not percentage points",
        claimSnippet: "In a 30-day test of 120 small-business customers using Pro, conversion rose by 5%.",
        evidenceSnippet: "In a 30-day test of 120 small-business customers using Pro, conversion rose by 5 percentage points.",
        stretchedPart: "5%",
        explanation: "A 5 percentage point shift was described as a 5% relative increase.",
      },
    ] as CatchCard[],
  },

  dimensions: {
    title: "Seven dimensions explorer",
    subtitle: "Every claim is decomposed into seven structural facets before comparison.",
  },

  limits: {
    title: "What ClaimFit does not do",
    subtitle: "Soundness requires clear boundaries. ClaimFit is an evidence comparator, not a truth oracle.",
    items: [
      {
        title: "English text only",
        desc: "Designed and tested for English marketing and research text.",
      },
      {
        title: "No browsing or fetching",
        desc: "It does not crawl the web or query third-party sources on its own.",
      },
      {
        title: "Does not evaluate evidence truth",
        desc: "It does not judge whether the supplied evidence itself is genuine, unmanipulated, or methodologically sound.",
      },
      {
        title: "“Supported” is not “true”",
        desc: "A Supported verdict confirms only that the wording stays inside the provided text; it never means objectively true in the real world.",
      },
      {
        title: "Not legal advice",
        desc: "ClaimFit provides deterministic editorial checks for reviewers; it is not a substitute for regulatory or legal counsel.",
      },
    ],
  },

  faq: {
    title: "Frequently asked questions",
    items: [
      {
        id: "why-not-llm",
        question: "Why not just ask an AI to judge?",
        answer:
          "The model only proposes quotes. Code verifies them verbatim against your text and makes the call, so prompt injection or subtle hallucinations cannot approve a claim.",
      },
      {
        id: "accuracy",
        question: "How accurate is it?",
        answer:
          "ClaimFit reports measured false approvals across verified test cases. This is not an accuracy figure, because real-world claims vary widely; rather, it is a guarantee that our rules prioritize withholding approval over rubber-stamping.",
      },
      {
        id: "model-failure",
        question: "What happens if the model fails?",
        answer:
          "The engine degrades gracefully to the rule-based extractor and withholds approval on ambiguous wording, marking findings as Needs review.",
      },
      {
        id: "who-for",
        question: "Who is it for?",
        answer:
          "Marketing leads, compliance reviewers, and product marketers who need to substantiate copy against product data before publication.",
      },
      {
        id: "data-retention",
        question: "What happens to the text I paste?",
        answer:
          "Text is stored in a local SQLite database for session and review reference (review links persist as long as the server database remains intact; in ephemeral hosting, storage resets on container rebuilds). Your input is never used for training.",
      },
    ] as FaqItem[],
  },

  ctaBand: {
    headline: "Check your next claim before it ships.",
    sub: "Free, deterministic, and instant. No sign-up required.",
    button: "Check a claim",
  },
};
