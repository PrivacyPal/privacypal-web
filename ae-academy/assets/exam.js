/* ============================================================
   PrivacyPal · AE Certification Academy: examination bank
   68 objective questions (68 points, auto-scored) and 12
   long-form questions (110 points, scored by a human reviewer).
   Correct answers are stored as FNV-1a hashes of a salt, the
   question id and the option text, so the key is not readable
   from view-source. Obscurity, not security: this is a static
   page. Rotate SALT if the bank is ever reused.
   ============================================================ */
window.PPExam = {
  salt: "pp-ae-2026::",
  passMark: 80,
  objectiveCount: 68,
  objectivePoints: 68,
  longCount: 12,
  longPoints: 110,
  sections: [
    {
      "id": "A",
      "t": "Market, mechanism and the ladder",
      "d": "Modules 01 and 02. The tradeoff you are selling against, and the machinery that resolves it.",
      "qs": [
        {
          "id": "a1",
          "k": "mc",
          "q": "Put the mechanism ladder in the correct order, weakest protection first.",
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
          "q": "What is the single sentence that distinguishes tokenization from substitution?",
          "o": [
            "Tokenization preserves referential integrity. Substitution preserves meaning.",
            "Tokenization is reversible. Substitution is not.",
            "Tokenization runs on device. Substitution runs in the cloud.",
            "Tokenization is faster. Substitution is more accurate at scale."
          ],
          "a": "1eumgun",
          "p": 1
        },
        {
          "id": "a3",
          "k": "tf",
          "q": "Redaction preserves the statistical relationships between data points, which is why model output quality survives it.",
          "o": [
            "True",
            "False"
          ],
          "a": "gxjdqc",
          "p": 1
        },
        {
          "id": "a4",
          "k": "mc",
          "q": "In the Harmonic Security AI Usage Index covering calendar year 2025 (22.4 million enterprise prompts), what share of prompts contained company-sensitive data?",
          "o": [
            "2.6 percent",
            "8.5 percent",
            "22 percent",
            "45.8 percent"
          ],
          "a": "cgtznl",
          "p": 1
        },
        {
          "id": "a5",
          "k": "mc",
          "q": "In that same index, ChatGPT accounted for 43.9 percent of prompt volume. What share of data exposures did it account for?",
          "o": [
            "71.2 percent",
            "43.9 percent",
            "26.4 percent",
            "92.6 percent"
          ],
          "a": "11awwaa",
          "p": 1
        },
        {
          "id": "a6",
          "k": "mc",
          "q": "Which category was the single largest share of exposed data in that research?",
          "o": [
            "Code, at about 30 percent",
            "Personally identifiable information, at about 30 percent",
            "M and A data, at about 22 percent",
            "Financial projections, at about 30 percent"
          ],
          "a": "1ewj7yl",
          "p": 1
        },
        {
          "id": "a7",
          "k": "tf",
          "q": "The 340 billion dollar McKinsey figure carried on privacypal.ai may be presented to a prospect as PrivacyPal research, because it appears on our own website.",
          "o": [
            "True",
            "False"
          ],
          "a": "1flf7h4",
          "p": 1
        },
        {
          "id": "a8",
          "k": "mc",
          "q": "The 68 percent figure about people pasting sensitive data into public chatbots describes which population?",
          "o": [
            "Bank employees",
            "All knowledge workers",
            "Healthcare staff",
            "Employees at companies with an AI ban"
          ],
          "a": "1kpc39x",
          "p": 1
        },
        {
          "id": "a9",
          "k": "mc",
          "q": "What are the five stages of the Privacy Twins pipeline, in order?",
          "o": [
            "Detection, classification, synthesis, mapping, reversion",
            "Classification, detection, mapping, synthesis, reversion",
            "Detection, synthesis, classification, reversion, mapping",
            "Interception, redaction, synthesis, mapping, restoration"
          ],
          "a": "1nh2ys9",
          "p": 1
        },
        {
          "id": "a10",
          "k": "mc",
          "q": "Twin reuse has a deliberate cross-continuation window so that files uploaded in a batch stay consistent with one another. How long is it?",
          "o": [
            "60 seconds",
            "5 minutes",
            "4 hours",
            "There is no window, reuse is strictly continuation-scoped"
          ],
          "a": "nbjgaq",
          "p": 1
        },
        {
          "id": "a11",
          "k": "mc",
          "q": "The on-device core reaches PrivacyPal for exactly two things. Which two?",
          "o": [
            "A signed entitlement lease and sanitized audit receipts",
            "Model routing decisions and audit receipts",
            "The encrypted twin map and a licence check",
            "Detection profile updates and the prompt itself for logging"
          ],
          "a": "9q4a3w",
          "p": 1
        },
        {
          "id": "a12",
          "k": "tf",
          "q": "If encoding fails or the session has expired, the prompt path falls back to passing the request through unprotected so the user is not blocked.",
          "o": [
            "True",
            "False"
          ],
          "a": "1qx58c2",
          "p": 1,
          "h": "Think carefully about what fail-closed means."
        }
      ]
    },
    {
      "id": "B",
      "t": "Platform, coverage and claims integrity",
      "d": "Module 03. What ships, what does not, and the exact wording for each.",
      "qs": [
        {
          "id": "b1",
          "k": "mc",
          "q": "What are the four governance pillars of PrivacyPal Max?",
          "o": [
            "On-device DSPM, agent and copilot governance, Private MCP, org-wide AI controls",
            "Network DSPM, Privacy Twins, SSO, org-wide AI controls",
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
          "k": "mc",
          "q": "How many AI platforms does PrivacyPal support, and which one is Max only?",
          "o": [
            "Seven, and Hermes Agent is Max only",
            "Six, and Perplexity is Max only",
            "Seven, and Grok is Max only",
            "Five, and Microsoft Copilot is Max only"
          ],
          "a": "1z0hs05",
          "p": 1
        },
        {
          "id": "b4",
          "k": "mc",
          "q": "Hermes Agent coverage is scoped. What exactly is covered?",
          "o": [
            "The Nous Portal endpoint and the Fireworks endpoint Hermes uses by default",
            "All inference providers Hermes can be pointed at",
            "Only the Nous Portal endpoint",
            "Any endpoint, provided the desktop app is running"
          ],
          "a": "1sqwlcz",
          "p": 1
        },
        {
          "id": "b5",
          "k": "tf",
          "q": "PDF protection is on by default, so you can tell a prospect that PDFs are automatically protected out of the box.",
          "o": [
            "True",
            "False"
          ],
          "a": "17p7hux",
          "p": 1
        },
        {
          "id": "b6",
          "k": "mc",
          "q": "What currently happens to document attachments uploaded to ChatGPT and Gemini?",
          "o": [
            "They are forwarded unchanged, and that work is queued",
            "They are blocked until the user confirms",
            "They are fully twinned in place, the same as prompts",
            "They are converted to text and then twinned"
          ],
          "a": "1n0rqw6",
          "p": 1
        },
        {
          "id": "b7",
          "k": "mc",
          "q": "Which of these is verified as built and safe to state in a security review?",
          "o": [
            "Private MCP self-host with a developer key",
            "A hosted Private MCP plane",
            "A native ServiceNow GRC connector",
            "Content-class hard block, where a Privacy Agent refuses a prompt outright"
          ],
          "a": "11mfbbe",
          "p": 1
        },
        {
          "id": "b8",
          "k": "tf",
          "q": "SOC 2 is expected but unverified, so you must not state it as held and should route the question back to PrivacyPal.",
          "o": [
            "True",
            "False"
          ],
          "a": "1b9c30z",
          "p": 1
        },
        {
          "id": "b9",
          "k": "mc",
          "q": "How are Business Data terms stored?",
          "o": [
            "As one-way HMAC-SHA-256 hashes, never plaintext",
            "As AES-256 encrypted plaintext in the tenant vault",
            "As plaintext scoped per company ID",
            "As embeddings in the tenant vector store"
          ],
          "a": "1dgbqy9",
          "p": 1
        },
        {
          "id": "b10",
          "k": "mc",
          "q": "How many Private MCP connectors ship today, and which?",
          "o": [
            "One, Salesforce",
            "Three, Salesforce, Slack and Notion",
            "One, NetSuite",
            "Seven, matching the supported AI platforms"
          ],
          "a": "1biakjd",
          "p": 1
        },
        {
          "id": "b11",
          "k": "mc",
          "q": "Which of these Private Memory claims is approved for customer-facing use?",
          "o": [
            "Recall adds under 100 milliseconds, with no LLM in the read path",
            "Our memory achieves 91.7 percent recall accuracy",
            "Our memory beats ChatGPT memory on standard benchmarks",
            "Twin-space memory is 16.7 points more accurate than plaintext in any workload"
          ],
          "a": "oys1m4",
          "p": 1
        }
      ]
    },
    {
      "id": "C",
      "t": "Product line, pricing and deal math",
      "d": "Module 04. Get a number wrong here and the buyer stops trusting every other number you gave them.",
      "qs": [
        {
          "id": "c1",
          "k": "mc",
          "q": "What is PrivacyPal Pro, monthly and annual?",
          "o": [
            "9 dollars per month, or 7.50 per month billed annually at 90 dollars a year",
            "18 dollars per month, or 15 per month billed annually",
            "9 dollars per month, or 9 per month billed annually",
            "7.50 per month monthly, or 9 per month annually"
          ],
          "a": "jv21cv",
          "p": 1
        },
        {
          "id": "c2",
          "k": "mc",
          "q": "What are the four Max seat bands?",
          "o": [
            "1-9, 10-99, 100-999, 1000+",
            "1-10, 11-100, 101-1000, 1001+",
            "1-25, 26-250, 251-2500, 2501+",
            "1-9, 10-49, 50-499, 500+"
          ],
          "a": "sbk418",
          "p": 1
        },
        {
          "id": "c3",
          "k": "mc",
          "q": "What is the Max annual rate, per seat per month, in the 10-99 band?",
          "o": [
            "25 dollars",
            "30 dollars",
            "29 dollars",
            "21 dollars"
          ],
          "a": "kdvez5",
          "p": 1
        },
        {
          "id": "c4",
          "k": "mc",
          "q": "What is the Max monthly rate, per seat per month, at 1000 seats and above?",
          "o": [
            "22 dollars",
            "17 dollars",
            "26 dollars",
            "34 dollars"
          ],
          "a": "9lm18b",
          "p": 1
        },
        {
          "id": "c5",
          "k": "tf",
          "q": "Max volume tiers apply marginally, so the first 9 seats are charged at the 1-9 rate and only seats above that get the lower band rate.",
          "o": [
            "True",
            "False"
          ],
          "a": "3wtg10",
          "p": 1
        },
        {
          "id": "c6",
          "k": "mc",
          "q": "A 200-person company buys Max on annual billing. What is the annual contract value?",
          "o": [
            "50,400 dollars",
            "60,000 dollars",
            "62,400 dollars",
            "40,800 dollars"
          ],
          "a": "1nfmhzw",
          "p": 1,
          "h": "200 seats sits in the 100-999 band. Work from the annual per-seat-per-year figure."
        },
        {
          "id": "c7",
          "k": "mc",
          "q": "A 20-person accounting firm buys Max on annual billing. What is the annual contract value, and the MRR it contributes?",
          "o": [
            "6,000 dollars a year, 500 dollars MRR",
            "7,200 dollars a year, 600 dollars MRR",
            "6,960 dollars a year, 580 dollars MRR",
            "5,040 dollars a year, 420 dollars MRR"
          ],
          "a": "1j21jdb",
          "p": 1
        },
        {
          "id": "c8",
          "k": "mc",
          "q": "A firm of 40 people wants to cover everyone. Six of them are already on Pro. What do you sell?",
          "o": [
            "Max for all 40. A company domain with more than one user runs Max for every user on it.",
            "Max for the 34 uncovered people, leaving the 6 Pro seats in place.",
            "Pro for all 40, since Pro is cheaper per seat.",
            "Pro for the 6 who have it and Max for the rest, invoiced together."
          ],
          "a": "18a75cg",
          "p": 1
        },
        {
          "id": "c9",
          "k": "mc",
          "q": "How do annual contracts and one-time pilot fees count toward MRR?",
          "o": [
            "Annual counts as ARR divided by 12. Pilot fees do not count as MRR at all.",
            "Annual counts in full in the month it is signed. Pilot fees count as MRR.",
            "Annual counts as ARR divided by 12. Pilot fees count as MRR divided by the pilot length.",
            "Neither counts as MRR until the customer renews."
          ],
          "a": "7d1gx1",
          "p": 1
        },
        {
          "id": "c10",
          "k": "mc",
          "q": "A prospect is at 96 seats and pushing hard on price. What is the strongest legitimate lever?",
          "o": [
            "Show them that crossing into the 100-999 band lowers their total invoice",
            "Offer a one-off discount off the band table",
            "Move them to Pro seats to reduce the per-seat cost",
            "Offer monthly billing so the first invoice is smaller"
          ],
          "a": "z5opup",
          "p": 1
        },
        {
          "id": "c11",
          "k": "mc",
          "q": "What is the Gold partner tier margin, and how long is deal registration protected?",
          "o": [
            "35 percent, protected for 90 days",
            "20 percent, protected for 90 days",
            "35 percent, protected for 30 days",
            "50 percent, protected for 180 days"
          ],
          "a": "1h9yofg",
          "p": 1
        },
        {
          "id": "c12",
          "k": "tf",
          "q": "PrivacyPal Pro is part of the partner catalog, so a reseller can earn margin on Pro seats.",
          "o": [
            "True",
            "False"
          ],
          "a": "u9idyg",
          "p": 1
        }
      ]
    },
    {
      "id": "D",
      "t": "Buyers, tiers and verticals",
      "d": "Module 05. Misclassify the buyer and every message after that aims at the wrong fear.",
      "qs": [
        {
          "id": "d1",
          "k": "mc",
          "q": "Which ICP is an overlay rather than a standalone persona?",
          "o": [
            "ICP-04 Regulatory Pressure",
            "ICP-01 Technical Contacts",
            "ICP-03 Service Providers",
            "ICP-02 Business Owners"
          ],
          "a": "9jh65e",
          "p": 1
        },
        {
          "id": "d2",
          "k": "mc",
          "q": "ICP-02 Business Owners is the SME economic buyer. What do they buy in the ordinary case?",
          "o": [
            "Max",
            "Pro",
            "Cloud",
            "SDK"
          ],
          "a": "1v0duln",
          "p": 1
        },
        {
          "id": "d3",
          "k": "mc",
          "q": "State the builder override.",
          "o": [
            "Builder, plus AI on customer data, plus any end-customer compliance signal equals Tier A regardless of headcount",
            "Any builder with more than 50 employees is Tier A",
            "Builders are always Tier B until a security review is scheduled",
            "Builders are Tier A only if they have an enterprise deal already stalled"
          ],
          "a": "ilhojj",
          "p": 1
        },
        {
          "id": "d4",
          "k": "tf",
          "q": "A builder who fits the Pro price point may be routed into the PP-3 self-serve trial sequence.",
          "o": [
            "True",
            "False"
          ],
          "a": "4mt6wo",
          "p": 1
        },
        {
          "id": "d5",
          "k": "mc",
          "q": "What is our stated position on compliance for ICP-04?",
          "o": [
            "Support, not solve. We produce evidence and reduce exposure, we do not certify compliance.",
            "We make regulated organizations compliant with HIPAA and GLBA.",
            "We solve compliance for prompts and support it for files.",
            "Compliance is out of scope; we sell productivity."
          ],
          "a": "16naih7",
          "p": 1
        },
        {
          "id": "d6",
          "k": "mc",
          "q": "Which regulation anchors the Legal vertical?",
          "o": [
            "ABA Formal Opinion 512",
            "NYDFS Part 500",
            "IRS Publication 4557",
            "HITECH"
          ],
          "a": "1l5cexs",
          "p": 1
        },
        {
          "id": "d7",
          "k": "mc",
          "q": "Which two statutes anchor the Accounting and Tax wedge, and what do they cover?",
          "o": [
            "Section 7216, a criminal misdemeanor for disclosing tax return information without written consent, and Section 6713, a 250 dollar civil penalty per disclosure",
            "Section 6713, a criminal felony for tax fraud, and Section 7216, a civil reporting requirement",
            "The FTC Safeguards Rule and Circular 230, both criminal statutes",
            "Section 7216 and IRS Publication 4557, both civil penalties"
          ],
          "a": "abfxbg",
          "p": 1
        },
        {
          "id": "d8",
          "k": "mc",
          "q": "Which set of compliance drivers belongs to Banking and FSI?",
          "o": [
            "GLBA, SOX, FFIEC, FINRA, NYDFS Part 500, PCI",
            "HIPAA, HITECH, SOC 2, PCI",
            "ABA 512, privilege, client confidentiality, SOC 2",
            "Section 7216, Section 6713, FTC Safeguards, Circular 230"
          ],
          "a": "miqjkg",
          "p": 1
        },
        {
          "id": "d9",
          "k": "mc",
          "q": "Which of these customer claims may you use?",
          "o": [
            "120+ businesses onboard",
            "2.4 million queries daily",
            "123 businesses onboard, since three new practices signed",
            "The names of the three accounting and wealth practices that signed on Max"
          ],
          "a": "li03zn",
          "p": 1
        },
        {
          "id": "d10",
          "k": "mc",
          "q": "There is no accounting testimonial in our approved materials. What do you do when an accounting prospect asks for a reference in their industry?",
          "o": [
            "Say we have signed accounting practices but none cleared for reference yet, and offer the closest approved proof plus a live walkthrough",
            "Use the AmLaw 100 quote and change the industry to accounting",
            "Describe the unnamed CPA firm in detail without naming it",
            "Say we have no customers in their industry"
          ],
          "a": "8ss0lo",
          "p": 1
        }
      ]
    },
    {
      "id": "E",
      "t": "The GTM motion and the pipeline",
      "d": "Module 06. What the machine does for you, and the one thing it will never do.",
      "qs": [
        {
          "id": "e1",
          "k": "mc",
          "q": "What is the hard rule about automation in our pipeline?",
          "o": [
            "Automation never moves a deal stage. The AI recommends, a human decides.",
            "Automation moves stages only for Tier A deals.",
            "Automation moves stages but a human can reverse it within 24 hours.",
            "Automation moves stages up to Proposal, then hands over."
          ],
          "a": "v6oa3w",
          "p": 1
        },
        {
          "id": "e2",
          "k": "mc",
          "q": "How fast does lead-in classification write its fields into HubSpot?",
          "o": [
            "Under 60 seconds",
            "Under 5 minutes",
            "Within the hour",
            "Overnight, in a nightly batch"
          ],
          "a": "1fxsc45",
          "p": 1
        },
        {
          "id": "e3",
          "k": "mc",
          "q": "Which pipeline stage sits between Solutions Call 2 and Trial?",
          "o": [
            "Security Review",
            "Proposal",
            "Technical Validation",
            "Discovery"
          ],
          "a": "rl8inh",
          "p": 1
        },
        {
          "id": "e4",
          "k": "mc",
          "q": "What is the shape of the PP-1 Solutions Call sequence?",
          "o": [
            "3 touches over 6 business days: day 0 within an hour, day 2, day 6 breakup",
            "2 touches: day 0 and day 4",
            "3 touches across a 5-day trial arc",
            "5 touches over 10 business days"
          ],
          "a": "1x2tt7",
          "p": 1
        },
        {
          "id": "e5",
          "k": "mc",
          "q": "Which sequence is PP-3, and who must never enter it?",
          "o": [
            "The self-serve trial sequence, and builders must never enter it",
            "The group demo sequence, and Tier A leads must never enter it",
            "The nurture sequence, and technical contacts must never enter it",
            "The solutions call sequence, and individuals must never enter it"
          ],
          "a": "3oyei2",
          "p": 1
        },
        {
          "id": "e6",
          "k": "mc",
          "q": "What is the north-star target for a call producing a next step with an owner and a date?",
          "o": [
            "80 percent or better",
            "35 percent or better",
            "85 percent or better",
            "100 percent"
          ],
          "a": "1wwzfi0",
          "p": 1
        },
        {
          "id": "e7",
          "k": "mc",
          "q": "What are the two closing-side timing targets?",
          "o": [
            "Proposal sent within 48 hours of the stage change, decision within 21 days",
            "Proposal sent within 24 hours, decision within 30 days",
            "Proposal sent within 5 business days, decision within 21 days",
            "Proposal sent within 48 hours, decision within 45 days"
          ],
          "a": "1jis56a",
          "p": 1
        },
        {
          "id": "e8",
          "k": "mc",
          "q": "A prospect says: our people know not to paste client data into these tools. Which objection code is that?",
          "o": [
            "already_careful",
            "ban_alternative",
            "it_burden",
            "workflow_change"
          ],
          "a": "1r2ycg9",
          "p": 1
        },
        {
          "id": "e9",
          "k": "mc",
          "q": "A prospect says: my team cannot take on another agent to manage. Which objection code is that?",
          "o": [
            "it_burden",
            "workflow_change",
            "cost",
            "vendor_trust"
          ],
          "a": "nd00yr",
          "p": 1
        }
      ]
    },
    {
      "id": "F",
      "t": "MEDDIC and the proposal gate",
      "d": "Module 07. The most heavily weighted section of this exam.",
      "qs": [
        {
          "id": "f1",
          "k": "mc",
          "q": "What do the six letters of MEDDIC stand for?",
          "o": [
            "Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion",
            "Metrics, Economic Buyer, Decision Criteria, Decision Process, Implementation, Competition",
            "Money, Executive, Demand, Deadline, Influence, Close",
            "Metrics, Evidence, Decision Criteria, Discovery Process, Identify Pain, Close Plan"
          ],
          "a": "c4u4fa",
          "p": 1
        },
        {
          "id": "f2",
          "k": "mc",
          "q": "How is each criterion scored, and what is the total range?",
          "o": [
            "Unknown 0, partial 1, confirmed 2, for a total of 0 to 12",
            "1 to 5 each, for a total of 6 to 30",
            "Yes or no each, for a total of 0 to 6",
            "Unknown 0, partial 2, confirmed 3, for a total of 0 to 18"
          ],
          "a": "1d82yw7",
          "p": 1
        },
        {
          "id": "f3",
          "k": "mc",
          "q": "State the proposal gate exactly.",
          "o": [
            "Identify Pain confirmed, Economic Buyer at least partial, Champion at least partial, and score at least 7",
            "Score at least 7, and any two criteria confirmed",
            "Identify Pain confirmed, Economic Buyer confirmed, Champion confirmed, and score at least 9",
            "Identify Pain at least partial, Economic Buyer confirmed, and score at least 7"
          ],
          "a": "hkzuk4",
          "p": 1
        },
        {
          "id": "f4",
          "k": "tf",
          "q": "A deal scoring 9 out of 12 always passes the gate, because the score threshold is 7.",
          "o": [
            "True",
            "False"
          ],
          "a": "1ow5iwe",
          "p": 1
        },
        {
          "id": "f5",
          "k": "mc",
          "q": "A deal scores: Metrics 1, Economic Buyer 0, Decision Criteria 2, Decision Process 2, Identify Pain 1, Champion 1. Is the gate open?",
          "o": [
            "No. The score is 7 but Identify Pain is only partial and the Economic Buyer is unknown, so two conditions fail.",
            "Yes. The score is 7, which meets the threshold.",
            "No. The score is 6, below the threshold.",
            "Yes, provided a Champion is at least partial, which it is."
          ],
          "a": "mk4aq9",
          "p": 1
        },
        {
          "id": "f6",
          "k": "mc",
          "q": "Which criterion must be confirmed, not merely partial, for the gate to open?",
          "o": [
            "Identify Pain",
            "Economic Buyer",
            "Champion",
            "Metrics"
          ],
          "a": "3kh9kb",
          "p": 1
        },
        {
          "id": "f7",
          "k": "mc",
          "q": "What separates a champion from a sponsor?",
          "o": [
            "A champion has influence, a personal win, and has demonstrably acted on your behalf. A sponsor wants it to happen but will not spend political capital.",
            "A champion is senior. A sponsor is junior.",
            "A champion is the economic buyer. A sponsor is anyone else who supports the deal.",
            "A champion gives you information. A sponsor gives you access."
          ],
          "a": "1a3uecr",
          "p": 1
        },
        {
          "id": "f8",
          "k": "tf",
          "q": "PrivacyPal runs MEDDPICC, so you should report a paper-process score on the deal record.",
          "o": [
            "True",
            "False"
          ],
          "a": "eqzwia",
          "p": 1
        },
        {
          "id": "f9",
          "k": "mc",
          "q": "What happens if a proposal is sent when the gate is shut?",
          "o": [
            "It is recorded on the deal and tracked against win rate",
            "Nothing, the gate is advisory",
            "The system blocks the send entirely",
            "The deal is automatically moved back to Discovery"
          ],
          "a": "1ujq9j5",
          "p": 1
        },
        {
          "id": "f10",
          "k": "long",
          "q": "Score this deal against all six MEDDIC criteria and state whether the gate is open.\n\nA 140-lawyer firm. The IT director booked the call after the firm's malpractice insurer asked, in writing, what controls they have on generative AI; the renewal is 31 January. He forwarded your one-pager to the managing partner unprompted and got you 30 minutes with her next week. The managing partner has not yet been on a call. He tells you the ethics committee meets monthly and that procurement is him. He says associates are already using ChatGPT and that the firm has an AI policy nobody enforces. He has not put a number on anything.",
          "h": "For each of the six, give the status (unknown, partial or confirmed), the points, and one line of evidence from the scenario. Then total the score, apply all four gate conditions, and state open or shut. Show the arithmetic.",
          "min": 700,
          "p": 12
        },
        {
          "id": "f11",
          "k": "long",
          "q": "Using the same 140-lawyer deal, name the two weakest criteria and write the exact questions you would ask to move each one, plus who you would ask.",
          "h": "Two criteria, two or three questions each, and the person you would put them to. Explain in one line why each question moves that specific criterion.",
          "min": 450,
          "p": 8
        },
        {
          "id": "f12",
          "k": "long",
          "q": "A colleague tells you a deal is qualified because the score is 8 out of 12. What do you ask them next, and why is the score alone insufficient?",
          "h": "Be specific about the mechanics of the gate and about what a high score can hide.",
          "min": 350,
          "p": 6
        }
      ]
    },
    {
      "id": "G",
      "t": "Objections and competition",
      "d": "Module 09. Long-form answers here are read as if they were sent to a prospect.",
      "qs": [
        {
          "id": "g1",
          "k": "mc",
          "q": "What is WitnessAI's mechanism, and why is it the one to prepare for?",
          "o": [
            "Deterministic surrogate tokenization with detokenization on the response. It is the only competitor with a reversible mechanism.",
            "Synthetic substitution, essentially identical to Privacy Twins.",
            "Block and redact with placeholder tokens and no restoration.",
            "Coach-first warnings with an option to proceed."
          ],
          "a": "12ryp42",
          "p": 1
        },
        {
          "id": "g2",
          "k": "mc",
          "q": "What is WitnessAI's commercial floor?",
          "o": [
            "180 dollars per user per year with a 1,000-user minimum, so roughly a 180,000 dollar floor",
            "200-user minimum, quote only",
            "90 dollars per seat per year with no minimum",
            "Sold only through SentinelOne private offers"
          ],
          "a": "ujwq24",
          "p": 1
        },
        {
          "id": "g3",
          "k": "mc",
          "q": "What is Harmonic Security's core architectural weakness in a regulated account?",
          "o": [
            "Prompt content transits Harmonic's own cloud for detection",
            "They have no browser coverage",
            "They cannot restore data at all",
            "They only cover ChatGPT"
          ],
          "a": "oarri8",
          "p": 1
        },
        {
          "id": "g4",
          "k": "long",
          "q": "A CISO says: we are also evaluating WitnessAI, and they restore data on the way back too. So what is the difference?\n\nWrite what you would actually say, out loud, in that room.",
          "h": "Cover the mechanism difference, the deterministic-token issue, what their own documentation says about code and IP, and the architectural blind spot. Do not attack the vendor personally.",
          "min": 600,
          "p": 10
        },
        {
          "id": "g5",
          "k": "long",
          "q": "Handle this objection in the prospect's own terms: our people are careful, they know not to paste client data into chatbots.",
          "h": "Do not argue with them. Get to evidence. Show the shape of the question you would ask and what you would do with either answer.",
          "min": 400,
          "p": 8
        },
        {
          "id": "g6",
          "k": "long",
          "q": "A 40-person firm says PrivacyPal is too expensive. Handle it, with real numbers.",
          "h": "Use the correct band and rate for 40 seats, reframe the cost, and use at least one comparison the buyer can verify. Do not offer a discount off the band table.",
          "min": 450,
          "p": 8
        },
        {
          "id": "g7",
          "k": "long",
          "q": "A competitor's rep tells your prospect that their product covers 15,000 AI applications while PrivacyPal covers seven. Reframe it.",
          "h": "Use the exposure concentration evidence and be precise about what deep coverage means. Name the source of any figure you use.",
          "min": 400,
          "p": 8
        },
        {
          "id": "g8",
          "k": "long",
          "q": "A prospect emails: Does PrivacyPal protect the files our staff upload to ChatGPT and Gemini? Write the reply you would send.",
          "h": "This is a written answer, so altitude and accuracy both matter. Say what is true today, say what is not, and route the detail correctly.",
          "min": 400,
          "p": 10
        }
      ]
    },
    {
      "id": "H",
      "t": "Applied selling and integrity",
      "d": "Modules 08 and 09. How you behave when nobody is checking.",
      "qs": [
        {
          "id": "h1",
          "k": "tf",
          "q": "In a security review, volunteering a capability gap that the reviewer has not yet found is the right move.",
          "o": [
            "True",
            "False"
          ],
          "a": "1lws324",
          "p": 1
        },
        {
          "id": "h2",
          "k": "mc",
          "q": "What is the eighth question in the pre-ship check?",
          "o": [
            "Could a competitor rebuild a feature from this? If yes, cut back to the mechanism's name.",
            "Is the price correct for the seat band?",
            "Has legal reviewed it?",
            "Did I include a customer reference?"
          ],
          "a": "150ba0t",
          "p": 1
        },
        {
          "id": "h3",
          "k": "long",
          "q": "Write the opening of a discovery call with the managing partner of a 25-person CPA firm: your first line, then your first three questions, then what you are listening for in each answer.",
          "h": "No pitch in the opening. The questions should be aimed at a confirmed pain, an economic buyer and a date. Reference the segment's actual regulatory language where it fits naturally.",
          "min": 600,
          "p": 10
        },
        {
          "id": "h4",
          "k": "long",
          "q": "A 140-person law firm wants to cover everyone on annual billing, and asks for a rough number on the call. Give the number and the plan, and show your working.",
          "h": "Name the plan, the band, the per-seat rate, the annual contract value and the MRR. Then say what you would want to establish before a proposal goes out.",
          "min": 400,
          "p": 10
        },
        {
          "id": "h5",
          "k": "long",
          "q": "A prospect's security team asks for our SOC 2 report as a condition of moving to Trial. What do you say, what do you do, and what do you never do?",
          "h": "Be exact about our current status and about who owns the answer.",
          "min": 350,
          "p": 8
        },
        {
          "id": "h6",
          "k": "long",
          "q": "You are commission-only. Describe your first 90 days: where you would source pipeline, which segment you would attack first and why, and what you would expect to close.",
          "h": "Be concrete and use real numbers from the price book. We are reading this for judgement about where the money actually is, not for enthusiasm.",
          "min": 700,
          "p": 12
        }
      ]
    }
  ]
};
