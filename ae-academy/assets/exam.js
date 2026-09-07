/* ============================================================
   PrivacyPal · AE Certification Academy: examination bank
   30 objective questions (30 points, auto-scored) and 5
   long-form questions (48 points, scored by a human reviewer).
   Sized for roughly 30 minutes. Where a number is needed to
   answer, the number is given in the question: the point is
   whether a rep can use the price book, not recite it.
   Correct answers are stored as FNV-1a hashes of a salt, the
   question id and the option text, so the key is not readable
   from view-source. Obscurity, not security: this is a static
   page. Rotate SALT if the bank is ever reused.
   ============================================================ */
window.PPExam = {
  salt: "pp-ae-2026::",
  passMark: 80,
  lastSection: "F",
  objectiveCount: 30,
  objectivePoints: 30,
  longCount: 5,
  longPoints: 48,
  sections: [
    {
      "id": "A",
      "t": "The market and the mechanism",
      "d": "Modules 01 and 02. The tradeoff you sell against, and the machinery that resolves it.",
      "qs": [
        {
          "id": "a1",
          "k": "mc",
          "q": "Put the mechanism ladder in order, weakest protection first.",
          "o": [
            "Observe, coach, block, redact, tokenize, substitute",
            "Coach, observe, redact, block, substitute, tokenize",
            "Observe, block, coach, tokenize, redact, substitute",
            "Redact, observe, coach, block, substitute, tokenize"
          ],
          "a": "1k6stwm",
          "p": 1
        },
        {
          "id": "a2",
          "k": "mc",
          "q": "What is the one sentence that separates tokenization from substitution?",
          "o": [
            "Tokenization preserves referential integrity. Substitution preserves meaning.",
            "Tokenization is reversible. Substitution is not.",
            "Tokenization runs on the device. Substitution runs in the cloud.",
            "Tokenization is faster. Substitution is more accurate at scale."
          ],
          "a": "1eumgun",
          "p": 1
        },
        {
          "id": "a3",
          "k": "mc",
          "q": "What are the five stages of the Privacy Twins pipeline, in order?",
          "o": [
            "Detection, classification, synthesis, mapping, reversion",
            "Classification, detection, mapping, synthesis, reversion",
            "Detection, synthesis, classification, reversion, mapping",
            "Interception, redaction, synthesis, mapping, restoration"
          ],
          "a": "1gtxetj",
          "p": 1
        },
        {
          "id": "a4",
          "k": "tf",
          "q": "If encoding fails or the session has expired, the prompt path passes the request through unprotected so the user is not blocked.",
          "o": [
            "True",
            "False"
          ],
          "a": "tzmbwd",
          "p": 1,
          "h": "Think about what fail-closed means."
        },
        {
          "id": "a5",
          "k": "mc",
          "q": "The on-device core reaches PrivacyPal for exactly two things. Which two?",
          "o": [
            "A signed entitlement lease and sanitized audit receipts",
            "Model routing decisions and audit receipts",
            "The encrypted twin map and a licence check",
            "Detection updates and the prompt itself, for logging"
          ],
          "a": "11bj6xl",
          "p": 1
        },
        {
          "id": "a6",
          "k": "mc",
          "q": "You have sixty seconds with a CISO who has banned AI. Which opening does the most work?",
          "o": [
            "\"Where did your company land on AI? Most people either banned it or wrote a policy and hoped. Whichever you picked, I want to know what it is costing you.\"",
            "\"Most employees are leaking data into ChatGPT right now. We can stop that.\"",
            "\"We use patented synthetic data substitution with on-device interception across seven platforms.\"",
            "\"We are the only vendor with no seat minimum, so we can start small and grow with you.\""
          ],
          "a": "1c9g22b",
          "p": 1
        }
      ]
    },
    {
      "id": "B",
      "t": "The platform",
      "d": "Module 03. What the product does, and how to answer the two questions you will get in week one.",
      "qs": [
        {
          "id": "b1",
          "k": "mc",
          "q": "What are the four governance pillars of Max?",
          "o": [
            "On-device DSPM, agent and copilot governance, Private MCP, org-wide AI controls",
            "Network DSPM, Privacy Twins, single sign-on, org-wide AI controls",
            "On-device DSPM, AI Gateway, SIEM forwarding, Private Memory",
            "Agent governance, Private MCP, model blocking, training cohorts"
          ],
          "a": "1j3swib",
          "p": 1
        },
        {
          "id": "b2",
          "k": "mc",
          "q": "DSPM exists at three depths. Match them to the plans.",
          "o": [
            "Prompt level is Pro, on device is Max, network is Cloud",
            "Prompt level is Pro, network is Max, on device is Cloud",
            "On device is Pro, prompt level is Max, network is Cloud",
            "All three depths are included in Max"
          ],
          "a": "2c477q",
          "p": 1
        },
        {
          "id": "b3",
          "k": "tf",
          "q": "A user needs one install on their laptop to be governed in both a Chrome tab and the ChatGPT desktop app.",
          "o": [
            "True",
            "False"
          ],
          "a": "1dyv7kc",
          "p": 1
        },
        {
          "id": "b4",
          "k": "mc",
          "q": "Which of these is Max only?",
          "o": [
            "Agent surfaces such as Claude Code, Hermes Agent and Private MCP",
            "ChatGPT and Claude coverage",
            "Gemini and Perplexity coverage",
            "Audit records for each prompt"
          ],
          "a": "168728j",
          "p": 1
        },
        {
          "id": "b5",
          "k": "mc",
          "q": "A 300-seat prospect says the deal depends on connecting a system we do not already list. What do you do?",
          "o": [
            "Find out what the system does in their workflow and how many seats it covers, then bring it to us to build",
            "Tell them it is not supported and try to redirect them to a system we do connect",
            "Promise it for the next release so the deal keeps moving",
            "Tell them to build it themselves against our SDK"
          ],
          "a": "19xrz1n",
          "p": 1
        },
        {
          "id": "b6",
          "k": "mc",
          "q": "A prospect's security team asks whether we are SOC 2 certified. What is the strongest true answer?",
          "o": [
            "We are in audit now and expect certification by early Q4. And if vendor certifications are a real concern for them, the right architecture is Cloud inside their own network, where the question largely goes away.",
            "Yes, we are SOC 2 Type II certified.",
            "We do not have it, but nobody in this category does, so it should not be a factor.",
            "I will have to check and come back to you on all of it."
          ],
          "a": "bzir7e",
          "p": 1
        }
      ]
    },
    {
      "id": "C",
      "t": "Plans and deal math",
      "d": "Module 03. The price book is in front of you on every call, and it is in front of you here. This section is about using it, not memorizing it.",
      "qs": [
        {
          "id": "c1",
          "k": "mc",
          "q": "What is the boundary between Pro and Max?",
          "o": [
            "Who the account belongs to: Pro protects a person, Max protects an organization",
            "Seat count: Pro up to nine seats, Max above that",
            "The feature list: Pro is chat only, Max adds agents",
            "Billing: Pro is monthly, Max is annual"
          ],
          "a": "1wn8z6t",
          "p": 1
        },
        {
          "id": "c2",
          "k": "mc",
          "q": "A 40-person firm wants everyone covered. Six of them already pay for Pro individually. What do you sell?",
          "o": [
            "Max for all 40. A company domain with more than one user runs Max for every user on it.",
            "Max for the 34 uncovered people, leaving the six Pro seats in place.",
            "Pro for all 40, since Pro is cheaper per seat.",
            "Pro for the six who have it and Max for the rest, on one invoice."
          ],
          "a": "rnxcfq",
          "p": 1
        },
        {
          "id": "c3",
          "k": "mc",
          "q": "A prospect at 96 seats is pushing hard on price. What is the strongest legitimate lever?",
          "o": [
            "Show them that crossing into the 100-999 band lowers their total invoice",
            "Offer a one-off discount off the band table",
            "Move some users to Pro seats to bring the average down",
            "Offer monthly billing so the first invoice is smaller"
          ],
          "a": "1mwgcxd",
          "p": 1,
          "h": "Reference, Max per seat per month: 1-9 seats $30 annual or $34 monthly; 10-99 $25 or $29; 100-999 $21 or $26; 1000+ $17 or $22. Annual is billed as twelve times the annual rate."
        },
        {
          "id": "c4",
          "k": "mc",
          "q": "A 200-person company buys Max on annual billing. What is the annual contract value?",
          "o": [
            "$50,400",
            "$60,000",
            "$62,400",
            "$40,800"
          ],
          "a": "7maze1",
          "p": 1,
          "h": "Reference, Max per seat per month: 1-9 seats $30 annual or $34 monthly; 10-99 $25 or $29; 100-999 $21 or $26; 1000+ $17 or $22. Annual is billed as twelve times the annual rate. Work it from the per-seat-per-month rate for the band 200 seats falls in."
        },
        {
          "id": "c5",
          "k": "mc",
          "q": "How do an annual contract and a one-time pilot fee count toward MRR?",
          "o": [
            "Annual counts as ARR divided by 12. A pilot fee does not count as MRR at all.",
            "Annual counts in full in the month it is signed. A pilot fee counts as MRR.",
            "Annual counts as ARR divided by 12. A pilot fee counts as MRR spread over the pilot.",
            "Neither counts as MRR until the customer renews."
          ],
          "a": "s2st3f",
          "p": 1
        }
      ]
    },
    {
      "id": "D",
      "t": "Buyers and the motion",
      "d": "Modules 04 and 05. Who you are talking to, and how the pipeline runs behind you.",
      "qs": [
        {
          "id": "d1",
          "k": "mc",
          "q": "Which buyer type is an overlay rather than a standalone persona?",
          "o": [
            "Regulatory pressure",
            "The technical contact",
            "The builder",
            "The business owner"
          ],
          "a": "1ous6d",
          "p": 1
        },
        {
          "id": "d2",
          "k": "mc",
          "q": "State the builder override.",
          "o": [
            "Builder, plus AI on customer data, plus any end-customer compliance signal equals Tier A regardless of headcount",
            "Any builder with more than 50 employees is Tier A",
            "Builders are Tier B until a security review is scheduled",
            "Builders are Tier A only if an enterprise deal has already stalled"
          ],
          "a": "xupgo6",
          "p": 1
        },
        {
          "id": "d3",
          "k": "tf",
          "q": "A builder who fits the Pro price point can be routed into the self-serve trial sequence.",
          "o": [
            "True",
            "False"
          ],
          "a": "g6uh3t",
          "p": 1
        },
        {
          "id": "d4",
          "k": "mc",
          "q": "What is our stance on compliance?",
          "o": [
            "Support, not solve. We produce evidence and reduce exposure, we do not certify compliance.",
            "We make regulated organizations compliant with HIPAA and GLBA.",
            "We solve compliance for prompts and support it for files.",
            "Compliance is out of scope. We sell productivity."
          ],
          "a": "jdm9na",
          "p": 1
        },
        {
          "id": "d5",
          "k": "tf",
          "q": "Automation can move a deal to the next pipeline stage once it has enough signal, and a human reviews it afterwards.",
          "o": [
            "True",
            "False"
          ],
          "a": "1dr5lin",
          "p": 1
        },
        {
          "id": "d6",
          "k": "mc",
          "q": "What makes Section 7216 such a sharp wedge with an accounting firm?",
          "o": [
            "Disclosing tax return information without the client's written consent is a criminal matter, and a staff accountant pasting a K-1 into a public chatbot is a disclosure",
            "It requires every CPA firm to run a documented AI governance platform",
            "It sets a civil penalty for failing to encrypt client data at rest",
            "It bans the use of offshore preparers without client consent"
          ],
          "a": "16vprj8",
          "p": 1
        }
      ]
    },
    {
      "id": "E",
      "t": "MEDDIC and the proposal gate",
      "d": "Module 06. The most heavily weighted section of this exam.",
      "qs": [
        {
          "id": "e1",
          "k": "mc",
          "q": "What do the six letters stand for?",
          "o": [
            "Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion",
            "Metrics, Economic Buyer, Decision Criteria, Decision Process, Implementation, Competition",
            "Money, Executive, Demand, Deadline, Influence, Close",
            "Metrics, Evidence, Decision Criteria, Discovery Process, Identify Pain, Close Plan"
          ],
          "a": "ltbakp",
          "p": 1
        },
        {
          "id": "e2",
          "k": "mc",
          "q": "How is each criterion scored, and what is the total range?",
          "o": [
            "Unknown 0, partial 1, confirmed 2, for a total of 0 to 12",
            "1 to 5 each, for a total of 6 to 30",
            "Yes or no each, for a total of 0 to 6",
            "Unknown 0, partial 2, confirmed 3, for a total of 0 to 18"
          ],
          "a": "jy2pgg",
          "p": 1
        },
        {
          "id": "e3",
          "k": "mc",
          "q": "State the proposal gate exactly.",
          "o": [
            "Identify Pain confirmed, Economic Buyer at least partial, Champion at least partial, and score at least 7",
            "Score at least 7, and any two criteria confirmed",
            "Identify Pain confirmed, Economic Buyer confirmed, Champion confirmed, and score at least 9",
            "Identify Pain at least partial, Economic Buyer confirmed, and score at least 7"
          ],
          "a": "nzbio7",
          "p": 1
        },
        {
          "id": "e4",
          "k": "mc",
          "q": "A deal scores Metrics 1, Economic Buyer 0, Decision Criteria 2, Decision Process 2, Identify Pain 1, Champion 1. Is the gate open?",
          "o": [
            "No. The score is 7, but Identify Pain is only partial and the Economic Buyer is unknown, so two conditions fail.",
            "Yes. The score is 7, which meets the threshold.",
            "No. The score is 6, below the threshold.",
            "Yes, as long as the Champion is at least partial, which it is."
          ],
          "a": "1xqfotn",
          "p": 1
        },
        {
          "id": "e5",
          "k": "mc",
          "q": "What separates a champion from a sponsor?",
          "o": [
            "A champion has influence, a personal win, and has demonstrably acted on your behalf. A sponsor wants it to happen but will not spend political capital.",
            "A champion is senior. A sponsor is junior.",
            "A champion is the economic buyer. A sponsor is anyone else who supports the deal.",
            "A champion gives you information. A sponsor gives you access."
          ],
          "a": "hxxhya",
          "p": 1
        },
        {
          "id": "e6",
          "k": "long",
          "q": "Score this deal against all six criteria and say whether the gate is open.\n\nA 140-lawyer firm. The IT director booked the call after the firm's malpractice insurer asked, in writing, what controls they have on generative AI; the renewal is 31 January. He forwarded your one-pager to the managing partner unprompted and got you 30 minutes with her next week. The managing partner has not been on a call yet. He says the ethics committee meets monthly, that procurement is him, that associates are already using ChatGPT, and that the firm has an AI policy nobody enforces. He has not put a number on anything.",
          "h": "For each of the six, give the status and one line of evidence from the scenario. Then total the score, apply all four gate conditions, and say open or shut.",
          "min": 500,
          "p": 10
        },
        {
          "id": "e7",
          "k": "long",
          "q": "Same deal. Name the two weakest criteria and write the exact questions you would ask to move each one, and who you would ask.",
          "h": "Two or three questions each, and the person you would put them to. One line on why each question moves that specific criterion.",
          "min": 350,
          "p": 8
        }
      ]
    },
    {
      "id": "F",
      "t": "Selling it",
      "d": "Modules 01 and 07. Long-form answers here are read as if you had sent them to a prospect.",
      "qs": [
        {
          "id": "f1",
          "k": "mc",
          "q": "A prospect says their people are careful and know not to paste client data. What is the best response?",
          "o": [
            "Ask what evidence of AI usage they could produce for last month",
            "Show them the research on how often sensitive data reaches chatbots",
            "Agree, and pivot to the agent governance use case instead",
            "Ask them to run a two-week trial and see what turns up"
          ],
          "a": "1bxyk20",
          "p": 1
        },
        {
          "id": "f2",
          "k": "mc",
          "q": "A prospect says they solved this by blocking the AI sites. What is the strongest response?",
          "o": [
            "The ban moved the risk to personal accounts and personal devices where there is no audit trail, and it cost them the productivity as well",
            "Blocking is a reasonable first step, and we can layer on top of it",
            "Their competitors are already using AI and they are falling behind",
            "Blocking will not survive contact with their engineering team"
          ],
          "a": "1d0abcy",
          "p": 1
        },
        {
          "id": "f3",
          "k": "long",
          "q": "A CISO says: we are also looking at WitnessAI, and they restore data on the way back too. So what is the difference?\n\nWrite what you would actually say out loud in that room.",
          "h": "Cover the mechanism difference, the deterministic-token issue, and the architectural blind spot. Do not attack the vendor.",
          "min": 400,
          "p": 10
        },
        {
          "id": "f4",
          "k": "long",
          "q": "A 40-person firm says PrivacyPal is too expensive. Handle it, with real numbers.\n\nReference, Max per seat per month: 1-9 $30 annual or $34 monthly; 10-99 $25 or $29; 100-999 $21 or $26; 1000+ $17 or $22.",
          "h": "Use the correct band for 40 seats, reframe the cost in terms the buyer feels, and give them one comparison they can verify. Do not discount off the band table.",
          "min": 350,
          "p": 8
        },
        {
          "id": "f5",
          "k": "long",
          "q": "You are commission-only. Describe your first 90 days: where you would source pipeline, which segment you would attack first and why, and what you would expect to close.",
          "h": "Be concrete and use real numbers from the price book. We are reading this for judgement about where the money actually is, not for enthusiasm.",
          "min": 500,
          "p": 12
        }
      ]
    }
  ]
};
