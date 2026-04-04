**PRODUCT REQUIREMENTS DOCUMENT**

**WhatsApp Order OS**

*Revenue Leak Detector + Order Capture + Customer Memory*

  -------------------- -----------------------------------
  **Version**          v1.0 --- MVP Scope
  **Status**           Ready for Development
  **Author**           Asad
  **Last Updated**     2025
  **Target Segment**   Home food sellers, cloud kitchens
  **MVP Timeline**     10 weeks (3 phases)
  -------------------- -----------------------------------

**1. Product Vision**

+----------------------------------------------------------------------+
| **Core Vision**                                                      |
|                                                                      |
| Build a system that first shows cloud kitchen and home food business |
| owners exactly how much revenue they are losing from WhatsApp ---    |
| then recovers it using intelligent automation and customer memory.   |
+----------------------------------------------------------------------+

## 1.1 The Core Problem

Cloud kitchens and home food businesses lose real revenue daily because
they cannot respond to WhatsApp orders fast enough. The problem is not
technology --- it is operational chaos at peak hours.

  ------------------------------------- ------------------------------------------------------
  **Root Cause**                        **Real-World Impact**
  Delayed replies during cooking/rush   Customers order elsewhere within 5 minutes
  Missed messages at peak hours         ₹300--1,500 per missed order, multiple daily
  No structured order logging           Duplicate orders, wrong quantities, disputes
  No customer history                   Same address extracted every time, no memory
  Manual everything                     Owner mentally exhausted, errors increase by evening
  ------------------------------------- ------------------------------------------------------

## 1.2 Product Philosophy

This is NOT an AI chatbot. NOT a generic automation platform. NOT a
multi-agent architecture demo.

+----------------------------------------------------------------------+
| **What This Product IS**                                             |
|                                                                      |
| A revenue recovery system with three progressive layers: (1) Show    |
| the owner their exact revenue loss with data. (2) Stop the loss by   |
| capturing every order automatically. (3) Build customer memory so    |
| recurring orders need zero manual work.                              |
+----------------------------------------------------------------------+

## 1.3 One-Line Pitch

***\"Aap WhatsApp pe paisa lose kar rahe ho --- main dikhata hoon kitna,
aur phir band karta hoon.\"***

**2. Target User**

## 2.1 Primary Segment (STRICT --- Do Not Expand)

  ----------------- ---------------------------------------------------- --------------------------------------------------------------
  **Attribute**     **Criteria**                                         **Why This Matters**
  Business type     Home food sellers, cloud kitchens, tiffin services   Identical operational pattern --- easy to build one solution
  Daily messages    50--200 WhatsApp messages/day                        Below 50 = not enough pain. Above 200 = needs human staff.
  Monthly revenue   ₹30,000 -- ₹3,00,000/month                           Enough to pay for tool, enough to care about leakage
  Sales channel     WhatsApp = primary or only sales channel             Product only works if WhatsApp IS the business
  Tech comfort      Smartphone-comfortable, not app-savvy                Owner interface must be WhatsApp itself --- no separate app
  ----------------- ---------------------------------------------------- --------------------------------------------------------------

## 2.2 Ideal First Customer Profile

-   Women-run home food business (tiffin, homemade sweets, catering)

-   Active in food seller WhatsApp/Instagram communities

-   Already has 20+ regular customers who order repeatedly

-   Loses sleep over missed orders during lunch rush (11:00--11:45 AM)

-   Currently solving with: read-and-type manually, sometimes misses,
    feels guilty

## 2.3 Disqualified Users (Do NOT Onboard)

-   Businesses with fewer than 30 messages/day --- revenue loss too
    small to justify tool

-   Businesses using Zomato/Swiggy as primary channel --- wrong pain
    point

-   Kirana stores, general retail --- order pattern completely different

-   Businesses with a dedicated WhatsApp operator already hired

**3. Product Phases**

## Phase 1 --- Revenue Leak Detector (FREE, Weeks 1--2)

+----------------------------------------------------------------------+
| **Phase 1 Goal**                                                     |
|                                                                      |
| Build trust by showing the owner their exact revenue risk number     |
| before asking for any payment or commitment. This is the sales tool  |
| for Phase 2.                                                         |
+----------------------------------------------------------------------+

### 3.1.1 What Phase 1 Does

Monitors incoming WhatsApp messages passively --- no automation, no
replies, no AI. Only tracks and calculates.

  ------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Feature**                     **Implementation Detail**
  Response delay tracker          Logs timestamp of every incoming message and owner\'s first reply. Calculates delay in minutes.
  Unanswered message detector     Flags messages with no reply after 90 minutes that contain food order keywords.
  Drop-off detector               Marks customers who sent a potential order but received no confirmation and did not message again.
  Conservative revenue estimate   Applies formula: unreplied order messages × average order value (₹350 default, owner-configurable). Shows as \'at least ₹X at risk\' --- never overstates.
  14-day summary report           Sends WhatsApp message to owner: \'23 messages unreplied for 90+ min. 6 potential orders may have been missed. Estimated revenue at risk: at least ₹2,100.\'
  ------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------

### 3.1.2 Revenue Calculation Formula (Conservative by Design)

+----------------------------------------------------------------------+
| **Formula**                                                          |
|                                                                      |
| Potential lost revenue = COUNT(messages with food keywords + no      |
| reply within 90 min + no follow-up from customer) × owner\'s         |
| configured average order value Always display as: \'At least ₹X at   |
| risk\' --- NEVER as \'You lost ₹X\'                                  |
+----------------------------------------------------------------------+

### 3.1.3 Phase 1 Success Metric

10 businesses onboarded. Each receives their 14-day report. At least 6
see a number above ₹1,500 and ask \'how do I fix this?\' --- that is the
Phase 2 trigger.

## Phase 2 --- Order Capture System (PAID, Weeks 3--6)

+----------------------------------------------------------------------+
| **Phase 2 Goal**                                                     |
|                                                                      |
| Stop the revenue loss identified in Phase 1 by automatically         |
| capturing, extracting, confirming, and logging every WhatsApp order  |
| --- with human fallback for anything ambiguous.                      |
+----------------------------------------------------------------------+

### 3.2.1 Intent Classification

  ------------------ -----------------------------------------------------------------------------------------------------------
  **Intent Class**   **What Triggers It (Examples)**
  ORDER              \'2 rajma chawal bhej do\', \'aaj lunch chahiye\', \'usual order\', item names + quantity + delivery cues
  INQUIRY            \'kya price hai\', \'menu bhejo\', \'aaj kya banega\', \'delivery kab hogi\'
  COMPLAINT          \'khana thanda tha\', \'order galat aaya\', \'refund chahiye\'
  OTHER              Greetings, forwards, unclear messages, voice notes
  ------------------ -----------------------------------------------------------------------------------------------------------

Important: COMPLAINT class always routes to human. Zero AI involvement
in complaint responses.

### 3.2.2 Order Extraction (Field-Level)

  ------------------ ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Field**          **Extraction Logic + Confidence Rules**
  Item name          Match against owner\'s configured menu list. Fuzzy match for common variants (\'rajma\' = \'rajma chawal\' if only one rajma item on menu). Confidence: HIGH if exact match, MEDIUM if fuzzy.
  Quantity           Numeric detection (\'2\', \'do\', \'ek\', \'char\'). Hinglish number words mapped. Confidence: HIGH if explicit, MEDIUM if implicit (\'usual\' = use memory).
  Delivery address   Exact text extraction. If message says \'same address\' or relational reference (\'wahi building\') --- check memory for saved address. If not in memory: ESCALATE. Confidence: HIGH only if explicit or memory match.
  Delivery time      Time extraction (\'3 baje\', \'lunch time\', \'ASAP\'). If absent: assume default delivery window. Flag for owner notification.
  ------------------ ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

### 3.2.3 Confidence Routing Logic (CRITICAL)

+----------------------------------------------------------------------+
| **Decision Rule**                                                    |
|                                                                      |
| Auto-confirm ONLY when: Item confidence \>= 85% AND Quantity         |
| confidence \>= 80% AND Address confidence \>= 75% (or address found  |
| in customer memory) If ANY field is below threshold: escalate that   |
| specific field to owner for approval. Do NOT auto-confirm partial    |
| extractions.                                                         |
+----------------------------------------------------------------------+

  ----------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------
  **Confidence Scenario**                   **System Action**
  All fields HIGH/MEDIUM above threshold    Auto-confirm. Send customer: \'Order confirm: \[item\] x\[qty\], delivery to \[address\]. Estimated time: \[window\].\'
  Address unclear or relational reference   Send owner: \'New order from \[name\]: \[item\] x\[qty\]. Address unclear --- \[exact message text\]. Confirm address?\' with tap buttons.
  Quantity missing or ambiguous             Send owner: \'Order from \[name\]: \[item\] --- quantity unclear. How many?\' with quick-reply options.
  Intent unclear (order vs inquiry)         Route to owner as \'Possible order --- please check\' with full message text.
  COMPLAINT class                           Immediately forward to owner: \'Customer complaint from \[name\]: \[message\]\'. No automated reply.
  ----------------------------------------- --------------------------------------------------------------------------------------------------------------------------------------------

### 3.2.4 Confirmation Messages (Tone Rules)

-   Tone must match owner\'s typical style --- configured during
    onboarding (formal / casual / Hinglish)

-   Auto-reply example (casual): \'Order noted! 2 rajma chawal, Sector 4
    delivery. Ready by 1 PM. Thank you! :)\'

-   Auto-reply example (formal): \'Your order has been confirmed. 2
    Rajma Chawal --- delivery to Sector 4 by 1:00 PM.\'

-   Never send a confirmation until extraction confidence thresholds are
    met

-   Always include a correction path: \'Kuch galat ho toh reply karo,
    hum fix kar denge\'

## Phase 3 --- Order Memory System (MOAT, Weeks 7--10)

+----------------------------------------------------------------------+
| **Phase 3 Goal**                                                     |
|                                                                      |
| Build per-customer intelligence that makes the system irreplaceable. |
| After 45 days, the system knows each customer\'s preferences, saved  |
| address, and recurring patterns. This data cannot be exported or     |
| replicated by competitors.                                           |
+----------------------------------------------------------------------+

### 3.3.1 Customer Profile (Built Automatically)

  ---------------------- -----------------------------------------------------------------------------------------------------------------
  **Data Point**         **How It\'s Captured**
  Customer name          WhatsApp display name at first message
  Saved address          Extracted and confirmed address from first successful order. Updated if customer provides new address.
  Preferred items        Items ordered 2+ times → flagged as preference. Shown during order confirmation.
  Order frequency        Day-of-week and time patterns detected after 4+ orders.
  Average order value    Running average across all confirmed orders.
  Special instructions   Persistent notes: \'no onion\', \'extra ghee\', \'call before delivery\'. Added when owner manually notes them.
  ---------------------- -----------------------------------------------------------------------------------------------------------------

### 3.3.2 Recurring Order Recognition

When a known customer sends an ambiguous or shorthand message (\'usual
bhej do\', \'same as last time\', \'aaj bhi\'), the system:

1.  Looks up their last confirmed order from memory

2.  Pre-fills all fields from memory

3.  Sends owner a tap-to-confirm card: \'Sunita --- usual order: 2 lunch
    box, Sector 4, 12:30 PM. Confirm?\'

4.  Owner taps Confirm → auto-reply sent to customer

5.  Owner taps Edit → 3-field quick edit opens in WhatsApp

### 3.3.3 Memory-Based Accuracy Improvement

Every correction the owner makes (wrong item, wrong address, wrong
quantity) is logged as a labeled training example. After 500+
corrections across all customers, this dataset is used to fine-tune the
extraction model --- improving Hinglish accuracy from 70% to 85%+.

**4. System Architecture**

## 4.1 High-Level Data Flow

  --------------------------- ------------------------------------------------------------------------------------------------
  **Step**                    **What Happens**
  1\. Message received        Customer sends WhatsApp message → Meta webhook fires → hits our server endpoint
  2\. Phase 1 logging         Message timestamped and stored. Response time tracking begins immediately.
  3\. Intent classification   LLM classifies message as ORDER / INQUIRY / COMPLAINT / OTHER with confidence score
  4\. Entity extraction       For ORDER: extract item, quantity, address. Each field gets individual confidence score.
  5\. Memory lookup           Check if customer has existing profile. If yes: fill gaps from memory. Re-evaluate confidence.
  6\. Decision routing        All fields meet threshold → auto-confirm. Any field fails → escalate specific field to owner.
  7\. Response dispatch       Send auto-reply to customer (if auto-confirm) OR send approval request to owner (if escalate)
  8\. Storage                 Log order to database with all fields, confidence scores, and source (auto/manual/memory)
  9\. Owner notification      Push WhatsApp notification to owner: order captured or action needed
  --------------------------- ------------------------------------------------------------------------------------------------

## 4.2 Component Breakdown

### Input Layer

-   WhatsApp Business API via 360Dialog BSP (NOT direct Meta API ---
    avoids 3-7 day approval delay)

-   Webhook endpoint: POST /webhook/whatsapp --- receives all incoming
    messages

-   Message queue (Bull/Redis): decouples webhook receipt from
    processing --- prevents timeouts during lunch rush

### AI Processing Layer

-   Intent classifier: GPT-4o-mini with food-specific system prompt ---
    cheaper, faster, sufficient for classification

-   Entity extractor: GPT-4o for complex Hinglish extraction --- higher
    accuracy on ambiguous inputs

-   Confidence scorer: field-level probability from LLM structured
    output (JSON response with confidence per field)

-   Memory resolver: database lookup before LLM call --- known customer
    data injected into prompt context

### Storage Layer

-   Primary DB: Supabase (PostgreSQL) --- free tier for first 50
    customers, then \$25/month

-   Message store: raw messages + metadata (timestamp, reply time,
    classification)

-   Order store: structured orders with all fields + confidence + source

-   Customer memory: profiles, preferences, saved addresses, order
    history

-   Correction log: all manual edits by owner --- primary training data
    source

### Output Layer

-   Customer-facing: WhatsApp auto-reply (confirmation or \'we received
    your message, confirming shortly\')

-   Owner-facing: WhatsApp notification + interactive buttons
    (approve/edit/reject) --- NO separate app

-   Phase 1 report: automated 14-day WhatsApp message to owner

### Human-in-the-Loop Layer

-   All COMPLAINT messages → direct forward to owner, no AI response

-   Low-confidence extractions → tap-to-confirm card with pre-filled
    fields

-   Address ambiguity → specific prompt asking only for address
    clarification

-   Owner corrections → 3-field edit form via WhatsApp interactive
    message

**5. Tech Stack**

  ---------------------- ------------------------------------------------------------------------------------------ ---------------------------
  **Component**          **Choice + Justification**                                                                 **Cost**
  Runtime                Node.js (Express) --- webhook handling, async processing, npm ecosystem                    Free
  WhatsApp access        360Dialog BSP → WhatsApp Cloud API. Avoids Meta approval delay. Immediate setup.           \~\$5--8/customer/month
  LLM (classification)   GPT-4o-mini --- fast, cheap, sufficient for intent classification                          \~₹0.05 per message
  LLM (extraction)       GPT-4o --- higher accuracy for Hinglish entity extraction                                  \~₹0.25 per order message
  Database               Supabase (PostgreSQL) --- free tier, real-time, easy setup, scales to 50+ customers        Free → \$25/month
  Message queue          Bull (Redis-based) --- async processing, prevents webhook timeouts during rush             Free tier
  Hosting                Railway (NOT Vercel) --- persistent server required for webhooks, long-running processes   \~\$5--7/month
  Error monitoring       Sentry --- catch production failures before owner reports them                             Free tier
  Secrets management     Environment variables (.env) → Railway secrets in production                               Free
  ---------------------- ------------------------------------------------------------------------------------------ ---------------------------

+----------------------------------------------------------------------+
| **Critical: Do NOT use Vercel**                                      |
|                                                                      |
| Vercel serverless functions have a 10-second execution timeout.      |
| WhatsApp webhook processing during lunch rush (80+ simultaneous      |
| messages) will exceed this. Use Railway or Render for a persistent   |
| Node.js server. This is a production-breaking mistake if ignored.    |
+----------------------------------------------------------------------+

**6. Database Schema**

## 6.1 Core Tables

### businesses

  ----------------- -----------------------------------------------------------------
  **Column**        **Type + Notes**
  id                UUID PRIMARY KEY
  whatsapp_number   VARCHAR --- owner\'s WhatsApp number (used as identifier)
  business_name     VARCHAR
  avg_order_value   INTEGER --- default 350, owner-configurable for Phase 1 formula
  reply_style       ENUM: casual / formal / hinglish --- used for auto-reply tone
  onboarded_at      TIMESTAMP
  phase             ENUM: detector / capture / memory --- current active phase
  bsp_number_id     VARCHAR --- 360Dialog number ID for sending messages
  ----------------- -----------------------------------------------------------------

### customers

  ---------------------- --------------------------------------------------------
  **Column**             **Type + Notes**
  id                     UUID PRIMARY KEY
  business_id            UUID FK → businesses
  whatsapp_number        VARCHAR --- customer\'s number
  display_name           VARCHAR --- from WhatsApp
  saved_address          TEXT --- last confirmed delivery address
  preferred_items        JSONB --- array of item names ordered 2+ times
  special_instructions   TEXT --- persistent notes (no onion, extra ghee, etc.)
  order_count            INTEGER
  avg_order_value        INTEGER
  first_seen             TIMESTAMP
  last_order             TIMESTAMP
  ---------------------- --------------------------------------------------------

### messages

  --------------------- -----------------------------------------------------
  **Column**            **Type + Notes**
  id                    UUID PRIMARY KEY
  business_id           UUID FK → businesses
  customer_id           UUID FK → customers (nullable if new customer)
  wa_message_id         VARCHAR --- WhatsApp\'s message ID (for dedup)
  content               TEXT --- raw message text
  received_at           TIMESTAMP
  replied_at            TIMESTAMP --- nullable if no reply
  reply_delay_minutes   INTEGER --- calculated field
  intent                ENUM: order / inquiry / complaint / other / unknown
  intent_confidence     FLOAT
  phase1_flagged        BOOLEAN --- flagged as potential missed order
  --------------------- -----------------------------------------------------

### orders

  --------------------- ------------------------------------------------------------
  **Column**            **Type + Notes**
  id                    UUID PRIMARY KEY
  business_id           UUID FK
  customer_id           UUID FK
  message_id            UUID FK → messages
  items                 JSONB --- array of {name, quantity, unit_price}
  delivery_address      TEXT
  delivery_time         VARCHAR --- extracted or default window
  total_value           INTEGER
  item_confidence       FLOAT --- field-level
  quantity_confidence   FLOAT --- field-level
  address_confidence    FLOAT --- field-level
  source                ENUM: auto / human_approved / memory_resolved
  status                ENUM: pending_approval / confirmed / cancelled / corrected
  created_at            TIMESTAMP
  confirmed_at          TIMESTAMP
  --------------------- ------------------------------------------------------------

### corrections

  ------------------ ------------------------------------------------------------------
  **Column**         **Type + Notes**
  id                 UUID PRIMARY KEY
  order_id           UUID FK
  field_corrected    ENUM: item / quantity / address / delivery_time
  original_value     TEXT --- what the AI extracted
  corrected_value    TEXT --- what the owner changed it to
  original_message   TEXT --- the raw WhatsApp message that caused the error
  corrected_at       TIMESTAMP
  note               Training data label: use this row to improve extraction accuracy
  ------------------ ------------------------------------------------------------------

**7. API & Webhook Design**

## 7.1 Webhook Endpoints

  -------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------
  **Endpoint**                     **Purpose**
  POST /webhook/whatsapp           Receives all incoming WhatsApp messages from 360Dialog. Validates signature, enqueues for async processing. Must return 200 within 2 seconds.
  POST /webhook/whatsapp/status    Receives delivery status updates for sent messages. Used to confirm auto-replies were delivered.
  GET /webhook/whatsapp (verify)   WhatsApp webhook verification handshake during setup. Returns hub.challenge.
  -------------------------------- -----------------------------------------------------------------------------------------------------------------------------------------------

## 7.2 Internal Processing Queue

  -------------------------- -------------------------------------------------------------------------------------------------------
  **Queue Job**              **What It Does**
  process_incoming_message   Full pipeline: classify intent → extract entities → memory lookup → route to auto-confirm or escalate
  send_whatsapp_message      Dispatches outgoing message via 360Dialog API. Retries on failure (3 attempts, exponential backoff).
  generate_phase1_report     Scheduled daily: calculates 14-day leak stats and sends report to owner if report_due = true
  update_customer_memory     After confirmed order: updates customer profile, saved address, preferred items
  -------------------------- -------------------------------------------------------------------------------------------------------

## 7.3 LLM Prompt Contract

+----------------------------------------------------------------------+
| **Critical Rule**                                                    |
|                                                                      |
| All LLM calls must return structured JSON --- never free text.       |
| Define exact JSON schema for both classification and extraction      |
| responses. Include confidence as a float 0.0--1.0 per field. Parse   |
| and validate JSON before using. If JSON parse fails: route to human  |
| escalation immediately.                                              |
+----------------------------------------------------------------------+

Classification response schema:

{ \"intent\": \"order\|inquiry\|complaint\|other\",
\"intent_confidence\": 0.92, \"reasoning\": \"\...\" }

Extraction response schema:

{ \"items\": \[{\"name\": \"rajma chawal\", \"quantity\": 2,
\"item_confidence\": 0.91, \"qty_confidence\": 0.88}\], \"address\":
\"Sector 4\", \"address_confidence\": 0.72, \"delivery_time\": \"1 PM\",
\"notes\": \"extra ghee\" }

**8. LLM System Prompts**

## 8.1 Intent Classification Prompt

+----------------------------------------------------------------------+
| **SYSTEM PROMPT --- Intent Classification**                          |
|                                                                      |
| You are an intent classifier for a food ordering business in India.  |
| Customers message in Hinglish (Hindi + English mixed), pure Hindi,   |
| or pure English.                                                     |
|                                                                      |
| Classify the message into exactly one category:                      |
|                                                                      |
| \- ORDER: Customer wants to place a food order (may be implicit,     |
| shorthand, or recurring reference)                                   |
|                                                                      |
| \- INQUIRY: Asking about menu, price, availability, timing, or       |
| delivery                                                             |
|                                                                      |
| \- COMPLAINT: Expressing dissatisfaction about a past order,         |
| delivery, or food quality                                            |
|                                                                      |
| \- OTHER: Greetings, forwards, unclear, or unrelated messages        |
|                                                                      |
| Business context: {business_name}, sells {menu_summary}. Owner\'s    |
| regular customers often say \'usual bhej do\', \'same as             |
| yesterday\', or just the item name alone.                            |
|                                                                      |
| Respond ONLY in JSON: { \"intent\": \"\...\", \"intent_confidence\": |
| 0.0-1.0, \"reasoning\": \"one sentence\" }                           |
+----------------------------------------------------------------------+

## 8.2 Entity Extraction Prompt

+----------------------------------------------------------------------+
| **SYSTEM PROMPT --- Order Entity Extraction**                        |
|                                                                      |
| You are extracting a food order from a WhatsApp message in Hinglish  |
| (Hindi/English mix). Extract all available fields with individual    |
| confidence scores.                                                   |
|                                                                      |
| Customer context (from memory): {customer_name}, saved address:      |
| {saved_address}, last order: {last_order_summary}                    |
|                                                                      |
| Menu items available: {menu_items_list}                              |
|                                                                      |
| Rules: (1) If address is relational (\'same waali\', \'wahi          |
| building\') and saved_address exists in context, use it with         |
| confidence 0.85. (2) Hindi number words: ek=1, do=2, teen=3, char=4, |
| paanch=5. (3) If quantity not mentioned and item is in               |
| preferred_items, assume 1 with confidence 0.70. (4) Never invent     |
| information not present in message or context.                       |
|                                                                      |
| Respond ONLY in JSON: { \"items\": \[{\"name\": \"\...\",            |
| \"quantity\": N, \"item_confidence\": 0.0-1.0, \"qty_confidence\":   |
| 0.0-1.0}\], \"address\": \"\...\", \"address_confidence\": 0.0-1.0,  |
| \"address_source\": \"explicit\|memory\|unclear\",                   |
| \"delivery_time\": \"\...\", \"notes\": \"\...\" }                   |
+----------------------------------------------------------------------+

**9. Business Model**

+----------------------------------------------------------------------+
| **Pricing Philosophy**                                               |
|                                                                      |
| Charge based on measurable value delivered --- not a fixed monthly   |
| fee. This eliminates the \'is it worth it?\' objection entirely.     |
| Customer cannot lose money on this product.                          |
+----------------------------------------------------------------------+

## 9.1 Recommended: Hybrid Model

  --------------- ------------------------------------------------------------------------------------------------------
  **Component**   **Details**
  Base fee        ₹999/month --- covers infrastructure, monitoring, support. Minimum commitment.
  Recovery fee    10% of total order value captured through the system per month.
  Example A       Business captures ₹40,000 via system → fee = ₹999 + ₹4,000 = ₹4,999/month
  Example B       Business captures ₹12,000 via system → fee = ₹999 + ₹1,200 = ₹2,199/month
  Example C       Low month, only ₹5,000 captured → fee = ₹999 + ₹500 = ₹1,499/month
  Cap             Maximum ₹8,000/month regardless of capture volume --- prevents bill shock for high-volume businesses
  --------------- ------------------------------------------------------------------------------------------------------

## 9.2 Measurability Rule

+----------------------------------------------------------------------+
| **Important**                                                        |
|                                                                      |
| Charge 10% of \'orders confirmed through our system\' × item value   |
| --- NOT \'% of recovered revenue.\' The former is 100% verifiable    |
| from our database. The latter is theoretical and creates billing     |
| disputes. Same effective pricing, zero ambiguity.                    |
+----------------------------------------------------------------------+

## 9.3 Unit Economics (Conservative Estimate)

  -------------------------------------- -------------- ------------------------
  **Metric**                             **Estimate**   **Basis**
  Avg monthly captured orders/customer   180 orders     6 orders/day × 30 days
  Avg order value                        ₹350           Home food segment
  Avg monthly captured revenue           ₹63,000        180 × 350
  Our fee (10% + base)                   ₹7,299/month   ₹999 + ₹6,300
  Infrastructure cost/customer           ₹1,400/month   API + LLM + hosting
  Gross margin/customer                  ₹5,899/month   \~81% margin
  LTV (12-month retention)               ₹70,788        Conservative estimate
  -------------------------------------- -------------- ------------------------

**10. MVP Scope --- Strict**

+----------------------------------------------------------------------+
| **Rule**                                                             |
|                                                                      |
| The MVP builds only what is needed to capture real orders for real   |
| customers and generate the revenue leak report. Everything else is   |
| v2 or v3. Scope creep is the primary failure mode for solo           |
| developers.                                                          |
+----------------------------------------------------------------------+

## 10.1 Build in MVP

-   WhatsApp webhook (receive messages, store raw, acknowledge within
    2s)

-   Phase 1: response time logging, keyword-based potential-order
    flagging, 14-day report

-   Intent classification (ORDER/INQUIRY/COMPLAINT/OTHER) via LLM

-   Entity extraction with field-level confidence (item, quantity,
    address)

-   Confidence threshold routing (auto-confirm vs. escalate to owner)

-   Auto-reply to customer (configurable tone template)

-   Owner notification via WhatsApp (approve/edit buttons for
    low-confidence cases)

-   Order logging to Supabase (all fields + confidence + source)

-   Correction logging (owner edits stored as training data)

-   Basic customer profile (auto-created on first message)

## 10.2 Do NOT Build in MVP

-   Complaint handling automation --- complaints go directly to owner,
    no AI

-   Insights dashboard / web UI --- no one checks it in first 30 days

-   Payment processing --- completely separate engineering project

-   Multi-language support beyond Hinglish --- fragments training data

-   Menu management UI --- owner configures menu via WhatsApp setup flow
    or manually in Supabase

-   Delivery partner integration (Dunzo, Porter, etc.) --- out of scope
    for v1

-   Analytics / reporting beyond Phase 1 revenue report

-   Mobile app --- owner interface IS WhatsApp

## 10.3 Build Sequence (Week by Week)

  ---------- ------------------------------------------------------------------------------------- ----------------------------------------------------
  **Week**   **Deliverable**                                                                       **Success Signal**
  1--2       Phase 1: Webhook + message logging + revenue leak detector + 14-day report            5 test businesses receive their leak report
  3--4       Phase 2 core: LLM classification + extraction + Supabase schema + auto-confirm flow   10 real orders captured and logged correctly
  5--6       HITL: Owner WhatsApp notifications + tap-to-confirm + correction logging              5 paying beta customers onboarded
  7--8       Phase 3 foundation: customer profile auto-creation + saved address memory             Repeat customer \'usual order\' resolves correctly
  9--10      Phase 3 full: recurring order detection + memory-based extraction improvement         20 customers, 85%+ auto-confirm rate
  ---------- ------------------------------------------------------------------------------------- ----------------------------------------------------

**11. Risks & Mitigations**

  ------------------------------------------------------ -------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Risk**                                               **Severity**   **Mitigation**
  Meta/WhatsApp API pricing change                       CRITICAL       Use 360Dialog BSP as buffer layer. Monitor conversation category costs weekly. Set alert if cost exceeds 40% of revenue.
  Phase 1 false positives in revenue calc                HIGH           Always show \'at least ₹X at risk\' not \'you lost ₹X\'. Use 90-minute threshold + keyword filter. Never auto-calculate without owner configuring avg order value.
  Hinglish extraction failures on production data        HIGH           Field-level confidence + mandatory escalation below threshold. Collect corrections from day 1. Target 85% accuracy by month 3 via fine-tuning.
  Support burden at 30+ customers                        MEDIUM         Build self-serve correction flow in WhatsApp before onboarding customer 20. Limit onboarding to 5 customers/week until support load is measurable.
  Google Sheets API rate limits (if used)                MEDIUM         Use Supabase directly from day 1. No Google Sheets in production backend.
  Complaint AI response damaging customer relationship   HIGH           Complaints: zero AI involvement. Immediately route to owner. Never automate complaint responses in v1 or v2.
  Owner trust damaged by wrong auto-confirm              HIGH           Start with high confidence thresholds (85/80/75). Lower gradually as correction data accumulates. Never lower address threshold below 75%.
  ------------------------------------------------------ -------------- --------------------------------------------------------------------------------------------------------------------------------------------------------------------

**12. Go-To-Market**

## 12.1 Before Writing Any Code

+----------------------------------------------------------------------+
| **Non-Negotiable Pre-Build Validation**                              |
|                                                                      |
| Call or WhatsApp 15 home food sellers. Ask: (1) How many messages    |
| per day? (2) Ever missed an order? (3) What did it cost you? (4) If  |
| I show you exactly how much you\'re losing --- would you want to see |
| it? If 10/15 say yes to question 4, build. If fewer than 7, revisit  |
| the problem framing.                                                 |
+----------------------------------------------------------------------+

## 12.2 Acquisition Channels (Ranked by Effectiveness)

  -------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Channel**                                  **Approach**
  WhatsApp/Telegram food seller groups         Join 5--8 groups. Don\'t pitch. Answer questions for 2 weeks. Then share free Phase 1 offer once. Conversion: 15--25 users from each active group.
  Instagram food sellers (2K--20K followers)   DM 200 sellers who visibly sell via WhatsApp link in bio. Offer free 14-day leak detection. Conversion: 3--5%. Do manually, not via automation.
  Referral from first 10 users                 Give users a referral code. For every referral who stays 30 days: 1 month free for referrer. This community refers within itself --- one vocal user = 10--20 customers.
  Anti-Zomato communities                      Food sellers who left or want to leave aggregators. Forums, Facebook groups. Pitch: \'Grow your direct WhatsApp channel, pay zero commission to Zomato.\'
  -------------------------------------------- -------------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 12.3 What Does NOT Work

-   Paid ads --- CAC ₹800--2,000 for customer with ₹70K LTV is fine at
    scale, but at 0 customers you have no conversion data to optimize.
    Do this after 50 customers.

-   Cold email --- food sellers don\'t use email for business

-   LinkedIn --- completely wrong audience

-   ProductHunt --- Indian food sellers are not on ProductHunt

## 12.4 First 100 Users Plan

  --------------- ----------------------------------------------------------------------------------------------------------------------------
  **Milestone**   **Target & Method**
  Users 1--5      Personal network. Find 5 food sellers you or someone you know uses. Offer completely free. Get real data and testimonials.
  Users 6--20     WhatsApp group outreach. 2 active groups, share free trial link after establishing presence.
  Users 21--50    Instagram DM campaign. 200 DMs → 6--10 users. Focus on testimonials from first 20 for social proof.
  Users 51--100   Referral flywheel. First 50 users referring within their communities. Goal: 50% of new users from referrals by this point.
  --------------- ----------------------------------------------------------------------------------------------------------------------------

**13. Success Metrics**

  ------------------------ ---------------------------------------------------------- ------------------------------------------------
  **Phase**                **Metric**                                                 **Target**
  Phase 1                  Businesses who see their revenue leak number               10 in first 14 days
  Phase 1 → 2 conversion   \% who activate Phase 2 after seeing report                \> 60%
  Phase 2                  Auto-confirm rate (no human intervention needed)           \> 75% by week 6
  Phase 2                  Order extraction accuracy (correct item + qty + address)   \> 85% by month 3
  Phase 2                  Average response time vs. manual baseline                  \< 30 seconds vs. owner\'s manual avg
  Phase 3                  Recurring order auto-resolution rate                       \> 80% of repeat customers handled via memory
  Business                 Monthly active paying customers                            20 by month 3, 50 by month 6
  Business                 Customer churn rate                                        \< 8%/month
  Ultimate                 Revenue recovered per business per month                   \> ₹15,000 recovered → tool pays for itself 5×
  ------------------------ ---------------------------------------------------------- ------------------------------------------------

+----------------------------------------------------------------------+
| **The Real PMF Signal**                                              |
|                                                                      |
| When a customer sends an unprompted message in a food seller         |
| WhatsApp group saying \'yeh tool try karo, mera life badal gaya\'    |
| --- that is product-market fit. Not NPS scores, not retention        |
| graphs. One organic peer recommendation in a tight community is      |
| worth more than any metric.                                          |
+----------------------------------------------------------------------+

**14. Instructions for Cursor / AI Code Generation**

+----------------------------------------------------------------------+
| **Purpose of This Section**                                          |
|                                                                      |
| This section provides exact instructions for Cursor or any AI coding |
| assistant building this project. Follow the sequence strictly. Do    |
| not skip steps or build out-of-order.                                |
+----------------------------------------------------------------------+

## 14.1 Project Setup

6.  Create Node.js project: npm init -y

7.  Install dependencies: express, dotenv, bull, ioredis,
    \@supabase/supabase-js, openai, axios

8.  Create folder structure: /src/routes, /src/services, /src/workers,
    /src/prompts, /src/utils

9.  Set up environment variables: OPENAI_API_KEY, SUPABASE_URL,
    SUPABASE_ANON_KEY, THREESIXTY_DIALOG_API_KEY,
    THREESIXTY_DIALOG_PARTNER_TOKEN, WEBHOOK_VERIFY_TOKEN, REDIS_URL

## 14.2 Build Order (Do Not Deviate)

  ---------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
  **Step**   **What to Build**
  Step 1     Webhook endpoint: POST /webhook/whatsapp. Validate signature, store raw message to Supabase messages table, return 200 immediately. No processing in webhook handler.
  Step 2     Bull queue setup. Webhook enqueues \'process_message\' job. Worker picks up and processes async.
  Step 3     Supabase schema. Run SQL to create all tables from Section 6 of this PRD.
  Step 4     Phase 1 logic. Response time calculator. Keyword-based order flagging. 14-day report generator. Test with 5 dummy conversations.
  Step 5     LLM intent classifier. Use exact prompt from Section 8.1. Parse JSON response. Handle parse failures with escalation to human.
  Step 6     LLM entity extractor. Use exact prompt from Section 8.2. Field-level confidence parsing. Threshold routing logic from Section 3.2.3.
  Step 7     Auto-reply dispatcher. Send confirmation to customer via 360Dialog API. Send approval request to owner for low-confidence cases.
  Step 8     Owner HITL flow. Interactive WhatsApp buttons for approve/edit/reject. Parse owner\'s button reply and update order status.
  Step 9     Correction logging. Every owner edit stored in corrections table. This is training data.
  Step 10    Customer memory. Profile creation on first message. Address saving after confirmed order. Memory injection into extraction prompt.
  ---------- -----------------------------------------------------------------------------------------------------------------------------------------------------------------------

## 14.3 Testing Checklist Before First Real Customer

-   Webhook receives and acknowledges within 2 seconds under load
    (simulate 20 simultaneous messages)

-   Phase 1 report generates correct revenue estimate on test
    conversation dataset

-   Intent classifier correctly identifies ORDER/INQUIRY/COMPLAINT with
    90%+ on 20 test messages

-   Extraction correctly handles: explicit order, \'usual order\' with
    memory, quantity in Hindi words, same-address reference

-   Auto-confirm fires only when ALL thresholds met --- not when any
    single field is high

-   Low-confidence escalation sends correct WhatsApp interactive message
    to owner number

-   Owner approve tap → customer receives confirmation within 5 seconds

-   Owner edit tap → edit form appears → corrected order saved →
    correction logged

-   Complaint message → forwarded to owner with zero AI response to
    customer

-   Duplicate message (same wa_message_id) → ignored, not processed
    twice

*End of Product Requirements Document*

**WhatsApp Order OS --- v1.0 MVP**
