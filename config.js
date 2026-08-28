// config.js v2.0 - Word Traps
// Configuration + UI copy (single file, no split)

(() => {
  "use strict";

  // 9.1 Environment detection
  const hostname = window.location.hostname;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
  const isGitHubPages = hostname.includes("github.io");

  // Single source of truth for storage-related keys (avoid drift)
  const WT_STORAGE_KEY = "tyf_wordtraps_v2";
  const WT_VANITY_CODE_STORAGE_KEY = "wt:vanityCode";


  // Global UI helpers (shared across IIFE modules)
  window.WT_UTILS = window.WT_UTILS || {};
  window.WT_UTILS.escapeHtml = function (str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  };

  // Single source of truth for critical enums (no scattered magic strings).
  window.WT_ENUMS = Object.freeze({
    UI_STATES: Object.freeze({
      LANDING: "LANDING",
      PLAYING: "PLAYING",
      END: "END",
      PAYWALL: "PAYWALL"
    }),
    GAME_MODES: Object.freeze({
      RUN: "RUN",
      PRACTICE: "PRACTICE",
      BONUS: "BONUS"
    })
  });

  // 9.2 WT_CONFIG (single source of truth for mechanics)
  window.WT_CONFIG = {

    // Product version (UI display, logs)
    version: "3.6.3",

    // Storage schema version (localStorage).
    // Change ONLY if you accept a migration/wipe.
    storageSchemaVersion: "3.0.0",

    // Le cache du Service Worker dérive exclusivement de WT_CONFIG.version via ?v=
    // (source unique de vérité pour le cache)

    environment: isLocalhost
      ? "development"
      : (isGitHubPages ? "github-pages" : "production"),

    // Identity
    // URL REGISTRY — also hardcoded in static files:
    // index.html (canonical, og:url, twitter:url)
    // sitemap.xml, robots.txt
    // success.html (contact email domain)
    identity: {
      appName: "Word Traps",
      appUrl: "https://wordtraps.com",
      parentUrl: "https://www.testyourfrench.com",

      // UI signature icon (in-card). Single source of truth for in-app branding.
      uiLogoUrl: "./icons/brand-logo-512.png"
    },

    // Storage (single source of truth)
    storage: {
      storageKey: WT_STORAGE_KEY,
      vanityCodeStorageKey: WT_VANITY_CODE_STORAGE_KEY
    },

    // Content
    contentUrl: "./content.json",

    // ============================================
    // V2 GAME - continuous RUN (no fixed sessions)
    // ============================================
    game: {
      maxChances: 3,
      poolSize: 400,
      antiRepetitionUntilExhaustion: true
    },

    // ============================================
    // LIMITS - monetization by replayability
    // ============================================
    limits: {
      freeRuns: 2
    },

    // Curated opening for the free runs (game.js: getCuratedFreeRunOpeningIds +
    // prependOpeningIds). Design goal: run 1 = a welcoming hook (classic false
    // friends + a few true friends, A1-B1), run 2 = a notch harder with the
    // highest-value "aha" pairs and 2 hard B2 traps near the end. Ordered so
    // true/false never repeats more than twice in a row and has no fixed rhythm.
    // declusterByAnswer locks this prefix, then de-clusters the random tail.
    curatedFreeRuns: {
      enabled: true,
      runCount: 2,
      cardIdsByRun: {
        1: [12, 61, 1, 46, 66, 102, 93, 50, 96, 109],
        2: [9, 2, 76, 16, 100, 129, 48, 97, 3, 41, 335, 384]
      }
    },

    // Progression levels
    // - No default badge before phase 1 is completed
    // - Levels are permanent once unlocked
    // - Unlocks are phase-gated:
    //   L1: full first pass complete
    //   L2: all active mistakes cleared
    //   L3: L2 + High Focus deck >= level3MinSeen + High Focus run >= level3MinAccuracy
    //   L4: L3 + High Focus deck >= level4MinSeen + High Focus run >= level4MinAccuracy
    // - Preview is UI-only and fail-closed:
    //   ?levelPreview=none|level1|level2|level3|level4|unlock1|unlock2|unlock3|unlock4
    levels: {
      enabled: true,
      level3MinSeen: 16,
      level3MinAccuracy: 0.70,
      level4MinSeen: 50,
      level4MinAccuracy: 0.85,
      preview: {
        enabled: true,
        queryParam: "levelPreview"
      }
    },

    // Practice mode (Mistakes only)
    // PRODUCT DECISION (kept):
    // - Returns ALL wrong items (variable length) in mistakesOnly mode
    mistakesOnly: {
      enabled: true,
      minWrongItemsToShowToggle: 1,
      premiumOnly: false,
      freeRunsLimit: 2,
      maxItems: 10
    },

    routing: {
      // If backlog >= this threshold, END (after RUN) promotes PRACTICE as primary CTA.
      // Backlog model: number of items with wrongCount > 0.
      practicePrimaryMinWrong: 7,

      // PRACTICE repeat guidance tiers (based on remaining backlog after PRACTICE).
      // UI picks the FIRST matching tier in the array (top-down).
      // Fail-closed: missing/invalid tiers => no repeat note and no CTA override.
      practiceRepeatTiers: [
        { key: "direct", minRemaining: 7 },
        { key: "firm", minRemaining: 4 },
        { key: "light", minRemaining: 2 },
        { key: "last", minRemaining: 1 }
      ],

      // END RUN verdict thresholds (config-driven).
      // Maps run scoreFP (best score signal for the run) -> verdictKey used by WT_WORDING.end.ctaByVerdict.
      runScoreThresholds: {
        start: 3,
        building: 6,
        strong: 10,
        elite: 15,
        legendary: 20
      },

    },

    // Personal best (premium history)
    personalBest: {
      enabled: true,
      premiumOnly: true
    },

    // Premium code flow (TYF-like)
    premiumCodePrefix: "WT",
    premiumCodeRegex: "^WT-[A-Z0-9]{4}-[A-Z0-9]{4}$",
    acceptCodeOncePerDevice: true,

    // Pricing (Stripe)
    currency: "USD",
    earlyPriceCents: 499,
    standardPriceCents: 699,
    earlyPriceWindowMs: 15 * 60 * 1000, // 15 minutes
    stripeEarlyPaymentUrl: "https://buy.stripe.com/14AaEX17VeVwaei7Ig2Nq04",
    stripeStandardPaymentUrl: "https://buy.stripe.com/7sY3cv8AnfZAgCG3s02Nq05",
    successRedirectUrl: "./success.html",

    // Marketing (opt-in only; Stripe receipt email is NOT marketing consent)
    marketing: {
      // External signup form URL (Mailchimp / ConvertKit / Buttondown / etc.)
      // Fail-closed in success.html if not set / still placeholder.
      updatesUrl: "",



      // Order bump (Cheat Sheet PDF) - serverless "trust-by-design" via ConvertKit embed.
      // Fail-closed in success.html unless explicitly enabled AND fully configured.
      cheatSheetOrderBump: {
        enabled: true,
        convertKitUid: "ed7df33449",
        convertKitScriptSrc: "https://onlinenewsletter.kit.com/ed7df33449/index.js"
      }
    },



    houseAd: {
      enabled: true,
      premiumOnly: false,
      url: "https://dailyfrench.testyourfrench.com/",
      showAfterEnd: true,

      // Unlock threshold (unique seen items)
      minUniqueSeenToShow: 200,

      // "Remind later" hide window (mechanics). Storage reads houseAd.hideMs.
      hideMs: 24 * 60 * 60 * 1000, // 24h
    },




    // Micro-pics (mécanique, non visible)
    // microPics garde uniquement les règles propres aux micro-pics.
    // IMPORTANT: streakThresholds est couplé au wording (ex: "3 in a row", "6 in a row", etc.).
    microPics: {
      cooldownItems: 1, // nb d'items minimum entre deux micro-pics

      // Seuils de streak (mécanique). La copy correspondante reste dans WT_WORDING.micropics.*
      streakThresholds: {
        start: 3,
        building: 6,
        strong: 10,
        elite: 15,
        legendary: 20
      },

      // Near-miss (mécanique, non visible) - déclenchement 1 fois par RUN via endHighlight.
      nearMissEnabled: true,

      // Erreurs répétées (mécanique, non visible) - wrongCount >= seuil => endHighlight (1 fois par RUN).
      repeatMistakeWrongCountMin: 2
    },



    // UI namespace → toast component → default variant → params
    // Hiérarchie intentionnelle (lisibilité + évite collisions de clés)

    ui: {
      // Toast / micro-feedback timing buckets
      toast: {
        // Default bucket for gameplay overlays/toasts
        default: {
          delayMs: 0,
          durationMs: 2200
        },

        // Timing bucket for micro-pics / micro-satisfaction
        positive: {
          delayMs: 0,
          durationMs: 1600
        },

        // Timing bucket for "+1" after a correct answer (no fallback in UI)
        scoreGained: {
          delayMs: 0,
          durationMs: 900
        }
      },

      // Gameplay overlay dismiss policy (UI-only, fail-closed)
      // true => allow tap to dismiss gameplay overlays (info/success only)
      toastDismissOnTap: true,



      // Overlays (PLAYING)
      // - chanceLostOverlayMs: -1 chance + "Game over" window
      // - runStartOverlayMs: start-of-run + BONUS rules
      chanceLostOverlayMs: 1800,
      runStartOverlayMs: 3000,


      // Pulses (HUD) + extension window for last-chance overlay
      gameplayPulseMs: 1000,

      // Momentum meter (HUD, UI-only)
      momentumMeter: {
        enabled: true,
        mode: "RUN",
        segments: 6,
        thresholds: {
          s1: 1,
          s2: 2,
          s3: 3,
          s4: 4,
          s5: 5,
          s6: 6
        }
      },

      // END (RUN): "Record moment" window (UI-only).
      // If > 0, END temporarily shows WT_WORDING.end.newBest instead of the scoreLine when newBest=true.
      endRecordMomentMs: 1600,

      // END: delay before opening automatic modals.
      // Goal: let the score and CTA breathe first.
      endAutoModalDelayMs: 1800,

      // PLAYING: toast duration when you beat your best score (RUN/BONUS).
      // No fallback in UI: if missing/invalid => no toast.
      newBestScoreToastMs: 1200,


      // Paywall ticker (UI-only, no silent fallback)
      // Drives the mm:ss countdown + the EARLY->STANDARD visual swap.
      paywallTickerMs: 1000,

      // Paywall urgency (UI-only, no silent fallback)
      // enabled: show the urgency banner during EARLY phase
      // pulseBelowMs: add a stronger pulse when remaining time is low
      paywallUrgency: {
        enabled: true,
        pulseBelowMs: 5 * 60 * 1000 // 5 minutes
      },

      // Explanations display (UI-only, no silent fallback)
      // Goal: make explanationShort easier to scan on mobile (2 lines when possible).
      // splitRegex: first match becomes the line break boundary (used by ui.js)
      explanationDisplay: {
        enabled: true,
        maxLines: 3,
        splitRegex: "\\.\\s+|\\n+" // sentence boundary OR explicit line break
      }
    },

    landingStats: {
      enabled: true,
      minCompletedRuns: 1,
      paceRunsCount: 4,
      showBeforeFirstRun: false
    },

    // Secret bonus mode
    secretBonus: {
      minDeckSize: 1,
      enabled: true,

      // Teaser premium: free users can start only N bonus runs (lifetime, device-local)
      freeRunsLimit: 2,

      // Entry points (canonical gates)
      // END: show chest after N completed runs (0 = always show on END)
      // LANDING: show chest after N completed runs (0 = always show on LANDING)
      gates: {
        endAfterRuns: 0,
        landingAfterRuns: 1
      },

      // Gesture: single tap (simple, no “secret handshake”)
      tapWindowMs: 900,
      tapsRequired: 1,



      // Gameplay feel
      // Chances derive from WT_CONFIG.game.maxChances for RUN and BONUS.
      // PRACTICE has no chances (revision mode — player reviews all mistakes).
      // Feedback contract (ui.js):
      // - "none" => no feedback screen (auto-advance)
      feedback: "none",

      // Fall animation (BONUS only)
      // ui.js reads secretBonus.fall - single source of truth
      // No fallback: all values mandatory when fall.enabled === true.
      fall: {
        enabled: true,

        // Metadata (calibration contract)
        units: "pctLanePerSec",
        tuningVersion: 2,

        // Speed in % of lane height per second
        initialSpeed: 10,       // très lent au départ
        maxSpeed: 20,           // plafond confortable
        speedIncrement: 0.4,    // rampe étirée (cap ~25 items)

        // Danger zone threshold (0..1 ratio of lane height)
        dangerThreshold: 0.86
      },

      // Visual flash on terms-box after each answer (BONUS only)
      // Fall is frozen during this window, then render + restart.
      feedbackFlashMs: 400,

      // END screen personalization tiers (accuracy = scoreFP / totalPresented)
      // Evaluated top-down: first match wins. Key must match WT_WORDING keys.
      endTiers: [
        { key: "perfect", minAccuracy: 1.0 },
        { key: "high", minAccuracy: 0.85 },
        { key: "medium", minAccuracy: 0.55 },
        { key: "low", minAccuracy: 0 }
      ],

      // Deck-size buckets (seen count). Evaluated top-down: first match wins.
      endDeckTiers: [
        { key: "large", minSeen: 50 },
        { key: "medium", minSeen: 16 },
        { key: "small", minSeen: 0 }
      ],

    },


    // Waitlist
    waitlist: {
      enabled: true,

      // Unlock threshold (unique seen items)
      minUniqueSeenToShow: 200,

      // UI routing:
      // - END: can appear when pool is exhausted (first reveal)
      // - LANDING: appears after it has been revealed once (persisted flag)
      placement: "end-and-landing-after-seen-once",

      afterPoolExhaustedOnly: false,
      showModalOneShot: false,

      // Email stored as XOR-obfuscated char codes.
      toEmailCipher: {
        key: 23,
        codes: [117, 120, 121, 125, 120, 98, 101, 87, 99, 114, 100, 99, 110, 120, 98, 101, 113, 101, 114, 121, 116, 127, 57, 116, 120, 122]
      },
      // IMPORTANT: keep this as a pure prefix (UI/email helpers may append details)
      subjectPrefix: "[Word Traps][Waitlist]"

    },

    // Post-completion (pool exhausted): LANDING block + cross-sell
    postCompletion: {
      enabled: true,
      waitlistEnabled: true,
      houseAdEnabled: true,

      // Milestones (% of unique pool coverage)
      // UI must not hardcode 25% / 50% / 75% / 100%.
      milestoneThresholds: [0.25, 0.5, 0.75, 1.0]
    },



    // Anonymous stats sharing (opt-in, no backend)
    statsSharing: {
      enabled: true,
      emailSubject: "[Word Traps][Stats] Anonymous stats",
      maxTopMistakes: 5,
      schemaVersion: "2.0",

      // Product rules:
      // - Do not interrupt gameplay; prompt only on END.
      // - Milestones are based on UNIQUE pool coverage (mots uniques vus), not total exposures.
      // - Multiple chances, but each trigger is shown at most once (storage flags).
      afterPoolExhaustedOnly: false,
      showModalOneShot: false,

      // Milestones (% of unique pool coverage)
      promptThresholdsPct: [30, 50],

      // Extra milestone for intensive players (4th chance)
      powerUserUniqueSeen: 150,
      powerUserRunCompletes: 5,

      // Also prompt when free runs are exhausted (end of the 2 free runs)
      promptOnFreeRunsExhausted: false
    },



    // Leaderboard (public, opt-in). Backend: leaderboard-worker/ (Cloudflare Worker + D1).
    leaderboard: {
      enabled: true,
      showAfterRunCompletes: 1,
      topN: 10,
      cardPreviewCount: 3,
      cacheTtlMs: 60 * 1000,
      requestTimeoutMs: 4000,

      submitScores: true,
      // Must match leaderboard-worker/src/content-key.js (LEADERBOARD_CONTENT_VERSION)
      // and content.json `version`. Regenerate the key after changing this:
      //   npm run generate:leaderboard-key
      contentVersion: "3.6-release-400",
      nicknameMinLen: 3,
      nicknameMaxLen: 24,
      nicknameRegexSource: "^[\\p{L}\\p{N}][\\p{L}\\p{N} _-]{2,23}$",
      nicknameRegexFlags: "u",

      // Deployed Worker URL. Empty = local-only mode (seed rows, no network).
      // Also used by storage.js tryRedeemPremiumCodeRemote (POST /redeem-code).
      apiBaseUrl: "https://wt-leaderboard.carolestromboni.workers.dev",

      // Shown only until real scores come in (buildWindowRows falls back to
      // these when the Worker returns an empty top list). Plausible names/scores.
      seedScores: {
        weekly: [
          { nickname: "Zoe", scoreFP: 21 },
          { nickname: "Lex", scoreFP: 19 },
          { nickname: "FauxAmi", scoreFP: 18 },
          { nickname: "CognateKid", scoreFP: 17 },
          { nickname: "TrapSpotter", scoreFP: 16 },
          { nickname: "LibrairieFan24", scoreFP: 15 },
          { nickname: "Parisienne", scoreFP: 14 },
          { nickname: "NotQuiteFluent77", scoreFP: 13 },
          { nickname: "NuanceHunter", scoreFP: 12 },
          { nickname: "BretonBella", scoreFP: 11 }
        ],
        all: [
          { nickname: "Zoe", scoreFP: 28 },
          { nickname: "Lex", scoreFP: 26 },
          { nickname: "FauxAmi", scoreFP: 25 },
          { nickname: "CognateKid", scoreFP: 24 },
          { nickname: "TrapSpotter", scoreFP: 23 },
          { nickname: "LibrairieFan24", scoreFP: 22 },
          { nickname: "Parisienne", scoreFP: 21 },
          { nickname: "NotQuiteFluent77", scoreFP: 20 },
          { nickname: "NuanceHunter", scoreFP: 19 },
          { nickname: "BretonBella", scoreFP: 18 }
        ]
      }
    },

    // Support
    support: {
      emailCipher: {
        key: 23,
        codes: [117, 120, 121, 125, 120, 98, 101, 87, 99, 114, 100, 99, 110, 120, 98, 101, 113, 101, 114, 121, 116, 127, 57, 116, 120, 122]
      },
      subjectPrefix: "[Word Traps][Contact]"
    },


    // PWA install prompt
    installPrompt: {
      enabled: true,
      triggerAfterFirstCompletedRun: true
    },

    // Share
    share: {
      enabled: true,

    },

    // Debug
    debug: {
      enabled: isLocalhost,
      logLevel: isLocalhost ? "debug" : "warn"
    },

    // Service Worker / PWA
    serviceWorker: {
      enabled: !isLocalhost,
      autoUpdate: true,
      showUpdateNotifications: true
    }
  };

  // 9.3 UI copy (visible -> WT_WORDING only; no legacy aliases)
  // ------------------------------------------
  // WORD TRAPS — LEXICAL IDENTITY (Momentum)
  // ------------------------------------------
  //
  // Core Intention:
  // Word Traps is about rhythm, momentum, and sustained focus.
  // The tone encourages flow and continuity.
  // It rewards staying engaged and moving forward.
  //
  // Emotional posture:
  // - Steady
  // - Focused
  // - Controlled
  // - In rhythm
  // - Forward-moving
  //
  // Dominant lexical field:
  // - keep going
  // - keep it moving

  // Explicit exclusions:
  // - No aggressive vocabulary (ruthless, destroy, crush, dominate, savage)
  // - No ego inflation (unstoppable, unbeatable, genius)
  // - No cold technical tone (optimize, calibrate, precision-driven language)
  // - Avoid "streak" as the core motivation (allowed only when explicitly contrasting with real improvement).
  //
  // Identity direction:
  // Word Traps speaks like a calm performance coach.
  // Clear. Grounded. Forward.
  // Always about maintaining rhythm and momentum.
  //
  // Validation rule for new copy:
  // If it reinforces flow and continuity -> valid.
  // If it sounds aggressive, ego-heavy, technical, or like "play for streaks" -> reject.
  window.WT_WORDING = {
    brand: {
      creatorLine: "Carole, a French native from Paris 🇫🇷",
      creatorLineHtml: "An indie game by Test Your French.<br>Created by <a href=\"./press.html\">Carole</a>, a French native from Paris. 🇫🇷"
    },

    system: {
      close: "Close",
      home: "Home",
      versionPrefix: "",

      loadingTitle: "Loading Word Traps...",
      loadingIcon: "🔤",
      loadingHint: "Preparing your French word challenge",
      loadingSlowHint: "Still loading... Check your connection if this takes too long.",
      updateAvailable: "New version available.",
      updateNow: "Refresh app",

      offlinePayment: "Payment requires an internet connection.",
      copied: "Copied",
      copyFailed: "Copy failed",
      downloaded: "Downloaded",
      more: "How to play",
      open: "Open",
      notNow: "Not now",
      continue: "Next",
      tapToContinue: "",

      youChosePrefix: "You chose:",

      playAria: "Play a new game",
      shareAria: "Share the game",
      resultGridAria: "Result grid",
      scoreAria: "Score",
      endActionsAria: "End screen actions",
      shareCardAria: "Share the game",
      premiumUnlockedToast: "Full access unlocked",
      storageSaveFailedToast: "Saving is disabled in this browser mode. Your progress may be lost if you refresh.",
      confirmLeaveRun: "Leave the current game? Your progress will be lost."
    },

    footer: {
      contact: "Contact",
      privacy: "Privacy",
      terms: "Terms",
      press: "Press"
    },

    success: {
      title: "Payment successful",
      subtitle: "Your device unlock code is ready. Save it, then use it in the game.",

      codeLabel: "Your device unlock code",
      clearDataWarning: "If you clear site data or switch device/browser, you will need this code again.",

      howToActivateTitle: "How to activate",
      howToActivateStep1: "Return to the game.",
      howToActivateStep2Prefix: "Tap",
      howToPlayLabel: "How to play",
      activateWithCodeLabel: "Use a device unlock code",
      howToActivateStep3Prefix: "Paste your code and tap",
      activateLabel: "Activate",

      whatYouGetTitle: "What you get",
      benefitFullAccessPrefix: "Full access to all",
      benefitFullAccessStrongSuffix: " word traps",
      benefitFullAccessSuffix: " in this game.",
      benefitUnlimited: "Unlimited play after code activation.",

      ctaBackToGame: "Back to game",
      ctaDownload: "Download code (.txt)",
      shortcutHint: "Shortcut: How to play - Use a device unlock code.",

      thankYouLine: "Thank you for supporting an independent game 🇫🇷",
      supportLabel: "Need help?",

      copyCta: "Copy code",
      copyAgainCta: "Copy code again",
      tipNoRecover: "Tip: keep this code somewhere safe. It can't be recovered from a server.",
      txtTitle: "Your Word Traps device unlock code",
      txtSaveLine: "Tip: keep this code somewhere safe.",
      txtNoRecoverLine: "It can't be recovered from a server.",

      cheatSheetTitle: "Cheat Sheet (PDF)",
      cheatSheetBody: "If you added the Cheat Sheet to your order, enter your email below to receive the download link.",

    },
    landing: {
      title: "Word Traps",
      tagline: "**Think you know French? Prove it.**",
      subtitle: "Faux amis or true friends?\nFrench-English words to train your brain.",
      microFun: "No signup · Quick games · Free to try",
      microTrust: "A few quick rounds show which words you really know.",

      runsLabel: "",
      runsFreeMode: "",

      ctaPlay: "Test your French",
      ctaPlayAfterFirstRun: "Play again",
      ctaHow: "How to play",
      // Required for LANDING stat to render
      statsSeenLabel: "Words seen",

      // Before completion (goal gradient) 
      statsSeenSummaryTemplate: "{seen} word traps seen.",
      statsPhaseBadgeDiscovery: "Phase 1/3: First pass",
      statsPhaseBadgeCorrection: "Phase 2/3: Fixing mistakes",
      statsPhaseBadgeConsolidation: "Phase 3/3: Locked in",

      // After completion (fail-closed: required for the post-completion line)
      statsSeenCompleteLabel: "French-English Faux Amis Mastery",
      statsMistakesLabel: "Mistakes",
      statsMistakesSummaryTemplate: "{mistakes}",
      statsMasterySummaryTemplate: "{mastered} traps mastered",

      postPaywallTitle: "Free games completed. Ready for more?",
      postPaywallBody: "Unlock all {poolSize} traps, unlimited play, Mistakes Mode, and High Focus Mode on this device.",
      practiceCtaTemplate: "Fix your {count} mistake{pluralS}",
      postPaywallCta: "Unlock full access",

      postPaywallSbTitle: "Before you decide...",
      postPaywallSbBody: "High Focus Mode is also available from the target icon."
    },
    firstRun: {
      titleRun1: "How to play",
      titleRun2: "Quick reminder",
      titleRun3: "Last tip before you play",
      run1Lines: [
        "You'll see French word traps one by one.\nDecide whether each one is true or false.",
        "Correct answer: +1 point.",
        "Wrong answer: +1 mistake.",
        "After {maxChances} mistakes, the game ends.",
        "Spot the traps. Think in French."
      ],
      run2Lines: [
        "Correct answer: +1 point.",
        "Wrong answer: +1 mistake.",
        "After {maxChances} mistakes, the game ends.",
        "Read carefully.",
        "Spot the traps. Think in French."
      ],
      run3Lines: [
        "Game ends after {maxChances} mistakes.",
        "Read carefully.",
        "Go with what you know.",
        "Spot the traps. Think in French."
      ],

      ctaLabel: "Play"
    },

    milestones: {
      halfway: {
        title: "Halfway milestone.",
        bodyLines: [
          "Halfway there: {halfPool}/{poolSize} traps explored.",
          "You are now seeing the real patterns.",
          "Keep going. This is where mastery starts."
        ],
        cta: "Next"
      }
    },

    phaseJourney: {
      discovery: {
        badge: "Phase 1/3: First pass",
        landingSummaryTemplate: "{seen} traps played.",
        landingDetailTemplate: "{remaining} still to go in your first pass.",
        endLens: "You're still on your first pass. Right now the goal is to cover more of the set.",
        micropics: {
          streakStart: "3 in a row. Good read.",
          streakBuilding: "6 in a row. Good read.",
          streakStrong: "10 in a row. Clear reads.",
          streakElite: "15 in a row. You know these.",
          streakLegendary: "20 in a row. Strong run.",
          streakAgainTemplate: "{streak} again.",
          recovery: "There you go."
        }
      },
      correction: {
        badge: "Phase 2/3: Fixing mistakes",
        landingSummaryTemplate: "Mistakes left: {mistakes}",
        landingDetail: "You've seen the full set. Now clear up the traps that still catch you.",
        endLens: "You've seen the full set. Now clear up the traps that still catch you.",
        micropics: {
          streakStart: "3 in a row. Better.",
          streakBuilding: "6 in a row. Clearing up.",
          streakStrong: "10 in a row. Better now.",
          streakElite: "15 in a row. Traps fading.",
          streakLegendary: "20 in a row. Strong correction.",
          streakAgainTemplate: "{streak} again.",
          recovery: "Back on it."
        }
      },
      consolidation: {
        badge: "Phase 3/3: Locked in",
        landingSummaryTemplate: "{mastered} traps mastered.",
        landingDetail: "You've cleared the mistakes. Now keep the traps clear.",
        endLens: "You've cleared the mistakes. Now keep the traps clear.",
        micropics: {
          streakStart: "3 in a row. Still clear.",
          streakBuilding: "6 in a row. Still clear.",
          streakStrong: "10 in a row. Holding up.",
          streakElite: "15 in a row. Very clear.",
          streakLegendary: "20 in a row. Still clear.",
          streakAgainTemplate: "{streak} again.",
          recovery: "Back on it."
        }
      }
    },

    levels: {
      modalTitle: "Levels",
      placeholder: "",
      openDetailsAria: "Open level details",
      unlockKicker: "New level",
      reachedTemplate: "You reached {label}.",
      currentLabel: "Current",
      unlockedByLabel: "",
      nextLabel: "Next",
      reachItLabel: "",
      progressionLabel: "Path",
      noLevelTitle: "Locked",
      noLevelBody: "Finish your first full pass.",
      maxLevelBody: "You reached the top level.",
      currentPill: "Current",
      unlockedPill: "Unlocked",
      lockedPill: "Locked",
      byLevel: {
        1: {
          label: "SHARP LEARNER",
          unlock: "Finish your first full pass."
        },
        2: {
          label: "CONVERSATIONAL-LEVEL",
          unlock: "Clear all active mistakes."
        },
        3: {
          label: "FLUENT-LEVEL",
          unlock: "Build a High Focus deck of 16+ and post a 70%+ run."
        },
        4: {
          label: "NATIVE-LEVEL",
          unlock: "Build a High Focus deck of 50+ and post an 85%+ run."
        }
      }
    },

    ui: {
      chancesLabel: "Chances",
      mistakesLabel: "Mistakes",
      scoreLabel: "Score",
      scoreAriaTemplate: "Score: {score} {fpShort}",
      fpShort: "",
      fpLong: "",
      trueLabel: "Same meaning",
      falseLabel: "Different meaning",
      gameOverTitle: "Game over",

      // Content loading (LANDING guard)
      contentLoadingToast: "Loading word traps...",

      // Pool loop announcement (RUN)
      poolReshuffledToast: "All word traps reshuffled. New order.",

      // Pool progress (END micro-line, RUN only)
      seenProgressTemplate: "You saw {seen}/{poolSize} word traps.",

      // Start-of-run overlay (economy)
      // Visible uniquement pour FREE et LAST_FREE
      startRunTypeFree: "Your first free game",
      startRunTypeLastFree: "Last free game. Make it count",
      startRunTypeUnlimited: "",
      startRunTypePractice: "Mistakes Mode",

      // Start-of-run overlay (education)
      // Ligne unique, lien mental avec le HUD
      startRunChancesOverlay: "Correct: +1 point.\nWrong: +1 mistake.\nGame ends after {maxChances} mistakes.",
      startOverlayTapAnywhere: "Tap anywhere to start",

      // Chance state overlays (no \"-1\" text)
      lastChanceOverlay: "One mistake left.",
      gameOverOverlay: "Game over.",

      // HUD deltas (PLAYING)
      chanceLostDeltaText: "-1",
      mistakeGainedDeltaText: "+1",
      scoreGainedDeltaText: "+1",

      // HUD anchor (PLAYING) — Personal Best (Premium only)
      bestScoreLabel: "Best",
      bestScoreAriaTemplate: "Best: {best}",


    },






    secretBonus: {
      chestAria: "High Focus mode",
      chestHint: "",
      noSeenWordsToast: "High Focus is empty for now. Play a normal game to build your deck.",
      badge: "HIGH FOCUS BONUS",

      // END screen (BONUS)
      endTitle: "",
      scoreLine: "Score: {score}",
      endStatsLine: "You got {cleared} out of {shown} right.",
      endStatsLineOne: "You got {cleared} out of {shown} right.",
      endDeckSizeLine: "High Focus pool: {count} words.",
      endDeckSizeLineOne: "High Focus pool: 1 word.",
      endPoolProgressTemplate: "{cleared} out of {shown} correct this round.",
      endDeckExhaustedToast: "All words available played.",
      mistakesTitle: "Words to revisit",
      mistakesToggle: "{count} mistakes",
      mistakesNone: "No mistakes.",

      // BONUS new best label (END)
      newBest: "NEW BEST SCORE.",
      celebrationPerfect: "PERFECT RUN",
      labelByTier: {
        perfect: "INSTANT READ",
        high: "SHARP FOCUS",
        medium: "GETTING QUICKER",
        low: "PACE CHECK"
      },

      // END BONUS — cognitive mirror by accuracy tier
      // Contract: arrays MUST contain exactly 2 sentences each. No fallback in UI.
      endByTier: {
        perfect: [
          "Flawless under pressure.",
          "You read those traps instantly."
        ],
        high: [
          "You stayed in control.",
          "Your instincts were doing the work."
        ],
        medium: [
          "You adjusted quickly.",
          "This mode asks for instinct, not hesitation."
        ],
        low: [
          "The pace got ahead of you.",
          "Here, memory alone is not enough."
        ]
      },

      // END BONUS — personalized recommendation (accuracy × deck size)
      // Keys: "{accuracyTier}_{deckTier}" — must cover all combinations
      endRecoByTier: {
        perfect_small: "Expand your deck to unlock more High Focus words.",
        perfect_medium: "Replay to keep that edge.",
        perfect_large: "Your High Focus deck is deep: push further.",

        high_small: "Expand your deck to unlock more High Focus words.",
        high_medium: "Try again to lock in the ones you missed.",
        high_large: "Stay in High Focus: you're close to flawless.",

        medium_small: "Expand your deck first. More seen words will make High Focus stronger.",
        medium_medium: "Try another High Focus game to sharpen your reflexes.",
        medium_large: "Keep going. Speed and accuracy will come with repetition.",

        low_small: "Expand your deck first. More seen words will make High Focus stronger.",
        low_medium: "Take a normal game to rebuild confidence before coming back.",
        low_large: "Try again: speed comes with practice."
      },

      // BONUS END — emotionally congruent CTA label by accuracy tier
      ctaByTier: {
        perfect: "Push your focus further",
        high: "Stay in High Focus",
        medium: "Try High Focus again",
        low: "Try High Focus again"
      },

      ctaExpandDeck: "Expand your deck",

      // Start overlay (same component as FREE runs)
      startOverlayLine1: "High focus mode. Faster pace.",
      startOverlayLine2: "Only words you've already seen in normal games.",
      startOverlayLine3: "Keep playing normal games to expand your High Focus deck.",

      // Teaser premium (filled by ui.js): {remaining}, {limit}
      startOverlayFreeRunsLimitLine: "",

      // Block modal when free limit reached
      freeLimitReachedTitle: "That was intense.",
      freeLimitReachedBody: "You've used your {limit} free High Focus games.\n\nFull access unlocks unlimited High Focus games. Same speed. No limits.",
      freeLimitReachedCta: "Keep playing",
      freeLimitReachedClose: "Not now",
      startOverlayTapAnywhere: "Tap anywhere to start",

      // Minimal entry (autoporteur)
      title: "Word Traps",
      subtitle: "High Focus Mode",
      questionPrompt: "Same meaning in French and English?",
      dangerLineLabel: "TIMEOUT LINE",
      dangerLineAria: "Timeout line. If the card reaches this line, the item is lost.",
      seenOnlyLine: "{count} seen words in your High Focus deck.",

      // End toasts (BONUS ends by returning to END screen)
      // Keep existing (even if you later stop using the modal)
      modalTitle: "High Focus Mode",
      modalBody: "High Focus Mode is faster and more demanding.\nIt uses only words you've already seen in regular games.\nTest your French word traps under pressure.",
      modalCta: "Play High Focus mode"
    },


    practice: {
      title: "Mistakes Mode",
      on: "On",
      off: "Off",

      premiumOnly: "Full access only",
      descLocked: "Replay only the word traps that still trip you up.",
      valueLine: "Focus on the words that still trip you up.",
      descUnlocked: "Only items you previously got wrong.",

      freeLimitReachedTitle: "That helped.",
      freeLimitReachedBody: "You've used your {limit} free mistakes games.\n\nFull access unlocks unlimited Mistakes Mode.\nKeep fixing what you missed.\nNo limits.",
      freeLimitReachedCta: "Keep playing",
      freeLimitReachedClose: "Not now",

      // END screen (PRACTICE)
      endTitle: "",
      endLine: "Keep going.",
      // Tier-aware override (keyed on practiceRepeatTierKey). Fallback: endLine.
      endLineByTier: {
        last: "Nice recovery.",
        light: "Good recovery.",
        firm: "That's progress.",
        direct: "You're making progress."
      },
      allFixedLine: "You closed it out.",
      celebrationAllCleared: "STRONG FINISH",
      labelByTier: {
        last: "LAST TRAP",
        light: "GOOD RECOVERY",
        firm: "BACK ON TRACK",
        direct: "STAY WITH IT"
      },
      endLineAllFixed: "You closed it out.",
      endStatsLine: "You fixed {fixed}. You still have {remaining} left.",
      endStatsLineAllFixed: "You fixed {fixed}.",

      // Repeat guidance by tier (selected via WT_CONFIG.routing.practiceRepeatTiers)
      // Fail-closed: missing tier key => no note
      endRepeatNoteByTier: {
        last: "One trap left. Clear it now.",
        light: "",
        firm: "A few traps still need another pass.",
        direct: "Stay in Mistakes mode. These are the ones that need the work."
      },

      scoreLine: "Score: {score}",

      // PLAYING: calm progress line (replaces assertion in PRACTICE)
      playingProgressLine: "{current}/{total}",

      // Start overlay (PRACTICE): explain the mode (2 lines shown via typeLine + msg)
      startRunChancesOverlayPractice: "Only words you missed.\nUp to 10 per game.\nFix it and it drops out. Miss it and it comes back.",
      startOverlayTapAnywhere: "Tap anywhere to start",
      // Fallback CTA when no repeat tier is selected
      ctaPracticeAgain: "Practice again",

      // Optional CTA override (END PRACTICE) based on remaining tier
      // Fail-closed: missing tier key => keep ctaPracticeAgain
      ctaRepeatByTier: {
        last: "Clear the last trap",
        light: "Fix your mistakes one more time",
        firm: "Play mistakes mode again",
        direct: "Stay in mistakes mode"
      },


      playing: {
        questionLabel: "Word",
        assertion: "Do the French and English words mean the same thing?",
        answersAria: "Answer choices",
        questionHeadingTemplate: "",
        feedbackTitleOk: "",
        feedbackTitleBad: "",

        // New best score (PLAYING)
        newBestScore: "New best score.",

        // Feedback truth line (used inline after Correct/Incorrect):
        // "Correct - {termFr} (FR) = {termEn} (EN)"
        // "Incorrect - {termFr} (FR) ≠ {termEn} (EN)"
        feedbackRelationSameTemplate: "{termFr} (FR) = {termEn} (EN)",
        feedbackRelationDifferentTemplate: "{termFr} (FR) \u2260 {termEn} (EN)"
      }
    },

    micropics: {
      runContinues: "You saw it. Keep going.",


      // Near-miss (END-only highlight)
      nearMiss: "Close call. That trap was waiting for you.",


      // Repeated mistakes (END-only highlight)
      repeatMistake: "This one keeps pulling you in. Slow down and read it again.",


      // First time reaching the tier in this game
      streakStart: "3 in a row. You're seeing the traps.",
      streakBuilding: "6 in a row. Good read.",
      streakStrong: "10 in a row. Sharp reading.",
      streakElite: "15 in a row. Very little gets past you now.",
      streakLegendary: "20 in a row. You read the traps before they land.",


      // Reaching a tier again in the same game (after a mistake)
      // {streak} = current streak at display time, {n} = threshold value (3/6/10/15/20)
      streakAgainTemplate: "{streak} in a row again. Back in rhythm.",

      // First non-chiffré micro-pic after a mistake (one-shot)
      recovery: "There you go. Back in rhythm.",

      runEndedAllChancesUsed: ""
    },

    end: {
      title: "",


      // Pool complete (one-shot celebration when the whole set is reached)
      poolCompleteTitle: "Bravo ! All {poolSize} word traps complete.",
      poolCompleteLine1: "This isn't about streaks. It's about whether you're actually improving. By the end of this set, you'll know.",
      poolCompleteLine2: "Now we find out what you actually know. Come back in a few weeks. See if it still holds.",
      poolCompleteScoreLine: "This game: {score} {fpShort}",
      poolCompleteCtaPrimary: "Replay in a new order",
      poolCompleteCtaPractice: "Fix your mistakes",

      freeLimitReachedTitle: "Nice game.",
      freeLimitReachedBody: "You've used your {limit} free games.\n\nFull access unlocks all {poolSize} traps, unlimited play, Mistakes Mode, and High Focus Mode on this device.",
      freeLimitReachedCta: "Keep playing",
      freeLimitReachedClose: "Not now",

      // No redundancy: do not mention chances on END (player already knows).
      endLine: "",
      endStatsLine: "You got {score} out of {total} right. You've now seen {seen}/{poolSize} words.",


      // (verdict grid removed — identityByVerdict is now the primary END signal)

      // RUN END — identity + lens + CTA by verdict tier
      // Keys must match UI mapping: none/start/building/strong/elite/legendary
      identityByVerdict: {
        none: "A few traps are still catching you.",
        start: "",
        building: "",
        strong: "",
        elite: "",
        legendary: ""
      },
      labelByVerdict: {
        none: "FALSE START",
        start: "FIRST PASS",
        building: "GETTING THE FEEL",
        strong: "SHARPER READS",
        elite: "TRAP SPOTTER",
        legendary: "LOCKED IN"
      },

      lensBonusPrimary: "You're ready for High Focus.",


      ctaByVerdict: {
        none: "Play again",
        start: "Play again: aim for 6+",
        building: "Play again: aim for 10+",
        strong: "Play again: push your score higher",
        elite: "Play again: master the remaining traps",
        legendary: "Play again"
      },

      // Explicit best sequence surfacing (RUN only)
      // Definition: longest sequence of consecutive correct answers within the run
      strongestTagLine: "Word type you handled best: {tag}.",
      weakestTagLine: "Word type that gave you the most trouble: {tag}.",

      // False friends identified (RUN only)
      // Definition: distinct items with tag === "false_friend" and correctCount > 0
      // Vars: {count}
      falseFriendsIdentifiedLine: "{count} false friends identified so far.",

      scoreLine: "Score: {score} {fpLong}",

      // Best score surfacing (rendered by ui.js using {best})
      personalBestLine: "Best score: {best} {fpLong}",
      nearBestLine: "{delta} {fpLong} away from your best.",
      // Free runs hint (RUN-only; shown only when remaining > 0)
      freeRunLeft: "{remaining} free game{pluralS} left.",

      // RUN END - mistakes recap (free + premium)
      mistakesTitle: "You missed these traps",
      mistakesNone: "No mistakes.",
      mistakesToggle: "{count} mistakes",
      directToConsolidationLine: "You finished the full set with no active mistakes, so you move straight to phase 3.",

      newBest: "NEW PERSONAL BEST",
      houseAdSummaryLabel: "Keep going with another game",
      playAgain: "Build your deck. Think in French.",

      practiceCta: "Fix your mistakes",
      practiceCtaTemplate: "Fix your {count} mistake{pluralS}",

      // RUN routing: when score reaches the "strong" tier, END can promote BONUS as primary CTA.
      bonusCtaPrimary: "Enter High Focus Mode",

      // Post-completion routing (pool exhausted + mistakes)
      // Vars: {backlog}
      practiceCtaCountPremium: "Fix your {backlog} remaining mistakes",
      shareTitle: "Challenge a friend"
    },

    paywall: {
      // Default headline
      headline: "Unlock the full French word traps deck.",

      // LAST FREE RUN - stronger but factual
      headlineLastFree: "That was your last free game. Keep going with full access.",

      // Projection personnalisée (PAYWALL only)
      // Vars: {seen} {poolSize} {remaining}
      progressLine1: "You've already spotted {seen} traps. {remaining} more to master.",
      progressLine2: "",

      // Section headers (anti “mur de mots”)
      valueTitle: "Unlock full access",
      trustTitle: "No surprises",

      valueBullets: [
        "**All {poolSize} French word traps**",
        "**Explanations after every answer**",
        "**Mistakes Mode** to fix what you missed",
        "**High Focus Mode** and unlimited reshuffled games",
        "**A mix of easy, intermediate, and hard traps**"
      ],

      // Shared bridge copy (LANDING post-paywall + END runs exhausted)
      bridgeTitle: "Know these French word traps better.",
      bridgeBody: "Unlock all {poolSize} traps, fix what you missed, and keep playing with every mode open.",

      trustLine: "**One-time unlock**",
      trustBullets: [
        "**Pay once**, no recurring fees",
        "**Works offline** after first load",
        "**No subscription**",
        "**No signup** needed",
        "**Secure payment** through Stripe"
      ],


      // PW1: Social proof (optional - do not invent numbers/claims)
      // If all are empty, nothing is rendered.
      socialProofTitle: "What players say",
      socialProofQuotes: [
        { quote: "★★★★★\nI thought my French was stronger than it was. This showed me exactly where I was still guessing, and the explanations are really clear.", author: "Babé, Educational Coordinator" },
        { quote: "★★★★★\nA few rounds in, I wanted the full set before I built any more bad habits.", author: "Tom, preparing for life in France" }
      ],

      // EARLY-only conversion bump (no fallback; shown only if template is provided)
      // Vars: {saveAmount} {earlyPrice} {standardPrice}
      savingsLineTemplate: "Save {saveAmount} today. Early price.",
      // Micro reassurance under CTA (optional, no fallback)
      checkoutNote: "Secure checkout via Stripe. Takes about 30 seconds.",

      // Primary CTA changes with price phase (EARLY vs STANDARD)
      ctaEarly: "Unlock all {poolSize} traps for $4.99",
      ctaStandard: "Unlock all {poolSize} traps for $6.99",

      // Backward compat (still used in a few places)
      cta: "Get unlimited games",

      alreadyHaveCode: "Already have a code? Activate it here.",
      deviceNote: "Full access stays unlocked on this device. No account needed.",

      // PW2: EARLY visual badge (copy visible)
      earlyBadgeLabel: "Early bird",

      earlyLabel: "Early price",
      standardLabel: "Standard price",

      // Loss-oriented urgency label (stronger conversion driver)
      timerLabel: "Price increases in:",

      postEarlyLine1: "The early price has ended.",
      postEarlyLine2: "{standardPrice}. One-time purchase. Yours forever."
    },


    howto: {
      title: "How to play",
      howToPlayLine1: "You see a French word or expression.",
      howToPlayLine2: "Is it a faux ami or a true friend?",
      howToPlayLine3: "Choose Same meaning or Different meaning.",

      modesTitle: "Game modes",
      modesBullets: [
        "Normal Mode: a full game across the word pool. Build your best score.",
        "High Focus Mode: faster and more demanding. Uses only words you've already seen.",
        "Mistakes Mode: replay your active mistakes (up to 10 words)."
      ],

      ruleTitle: "Rule",
      ruleSentence: "Each correct answer adds +1 point. A wrong answer adds one mistake.",
      premiumTitle: "Full access",
      alreadyPremium: "Full access is already enabled on this device.",
      activateTitle: "Use a device unlock code",
      activateLine1: "Already have a device unlock code? Use it here.",
      activateLine2: "No account needed. Your code stays on this device.",
      activationCodeLabel: "Device unlock code",
      activationCodePlaceholder: "WT-XXXX-XXXX",
      enterCode: "Enter a code.",
      codeRejected: "Code rejected.",
      activateCta: "Activate",
      codeInvalid: "Invalid code format.",
      codeUsed: "This device already used a code.",
      codeOk: "Full access enabled on this device.",
      codeChecking: "Checking code...",


      autoActivateTitle: "Device unlock code ready",
      autoActivateLine1: "Your device unlock code is already saved on this device.",
      autoActivateLine2: "Unlock full access now?",
      autoActivateCta: "Unlock now",
      autoActivateLater: "Not now"
    },

    postCompletion: {
      title: "You've seen everything.",
      body: "Now make it stick. Practice your mistakes, explore High Focus Mode, or replay full games.",

      // Mastered (pool exhausted + 0 active mistakes)
      masteredTitle: "Bravo ! You've mastered all {poolSize} word traps.",
      masteredLine1: "Zero active mistakes. Every trap identified correctly.",
      masteredLine2: "Now test your focus under pressure. Then come back in a few weeks and see if it still holds.",
      masteredCtaBonus: "Challenge yourself in High Focus Mode",
      masteredCtaReplay: "Replay in a new order",

      waitlistTitle: "Stay in the loop",
      waitlistBody1: "Get notified when we add new word traps or features.",
      waitlistBody2: "No spam. No account. Leave anytime.",
      waitlistCta: "Get notified",
      waitlistDisclaimer: "Email only. Unsubscribe anytime.",
      houseAdCta: "Try Test Your French"
    },

    houseAd: {
      eyebrow: "After {poolSize} word traps",
      title: "You've seen all {poolSize} word traps.",
      bodyLine1: "Word Traps is a mini-game by Test Your French.",
      bodyLine2: "We have other games.",
      ctaPrimary: "Try a new game by Test Your French",
      ctaRemindLater: "Remind later",

      // Landing presence (same meaning, same tone)
      landingTitle: "You've seen all {poolSize} word traps.",
      landingBodyLine1: "Word Traps is a mini-game by Test Your French.",
      landingBodyLine2: "We have other games.",
      landingCtaPrimary: "Try Daily French",
      landingCtaRemindLater: "Remind later"
    },




    waitlist: {
      ctaLabel: "Get notified about future products or features.",
      disclaimer: "No spam. No account. You can leave anytime.",
      title: "Get notified about future products or features.",
      bodyLine1: "No spam. No account. Leave anytime.",
      bodyLine2: "Optional: reply with one idea if you want.",
      inputPlaceholder: "Optional: share an idea.",
      cta: "Send email",

      // Email compose (for inbox filtering + prefill)
      emailSubjectSuffix: "Waitlist",
      emailBodyTemplate: `Hi!

I'd like to join the Word Traps waitlist.

Optional idea:
{idea}

Thanks!`
    },




    share: {
      ctaLabel: "Copy challenge text",
      emailLabel: "Email challenge",
      emailSubject: "Word Traps",
      previewLabel: "Preview message",
      toastCopied: "Copied.",
      template: `Hey!
I've been playing this word traps game.
This made me think of you.
Score this round: {score}
{funFact}
Think you'd get it right?
{url}`,

      teaserTrap: "Looks obvious... until it isn't.",
      teaserTrue: "Sometimes the obvious answer is right.",
      funFactTemplatesTrap: [
        `Can you guess? Does "{termFr}" (FR) really mean "{termEn}"? 🤔`
      ],
      funFactTemplatesTrue: [
        `Can you guess? "{termFr}" (FR) and "{termEn}" (EN) : same meaning or trap? 🤔`
      ],


    },



    installPrompt: {
      title: "Install Word Traps",
      body: "Play instantly.\nAvailable offline after your first load.\nNo browser tabs.",
      bodyIOS: "This will not install automatically on iPhone.\nTap Share, then Add to Home Screen.",
      ctaPrimary: "Add to home screen",
      ctaSecondary: "Later"
    },


    statsSharing: {
      sectionTitle: "Anonymous stats (optional)",
      buttonLabel: "Share anonymous stats",

      // Lightweight prompt (shown at milestones)
      promptTitle: "Help improve Word Traps",
      promptBodyTemplate: "You have reached {thresholdPct}% of the pool (unique words). Share anonymous stats to help improve the game. You can review everything before sending.",
      promptBodyLastFree: "That was your last free game. Share anonymous stats to help improve the game. You can review everything before sending.",
      promptBodyPowerUser: "You're clearly a power player. Share anonymous stats to help improve the game. You can review everything before sending.",
      promptCtaPrimary: "Preview & share",
      promptCtaSecondary: "Not now",

      // Full modal (manual access + prompt primary)
      modalTitle: "Help improve the game",
      modalDescription: "Share your anonymous gameplay stats with the creator. No personal data is collected - you can see exactly what will be sent below.",
      previewLabel: "Data to be shared:",
      ctaSend: "Send via email",
      ctaCancel: "Cancel",
      ctaLater: "Show me later",
      ctaCopy: "Copy to clipboard",
      noStatsToast: "No stats to share yet.",
      successToast: "Email app opened. Send to share your stats.",
      copyToast: "Stats copied to clipboard."
    },



    leaderboard: {
      cardTitle: "THIS WEEK",
      cardSubDefault: "Top scores this week.",
      cardSubJoined: "Top scores this week.",
      cardCtaJoin: "Choose nickname",
      cardCtaView: "View leaderboard",
      cardCtaEdit: "Edit nickname",
      lastUpdatedTemplate: "",
      nextRefreshTemplate: "",
      weeklyResetLine: "Weekly reset: {localTime}.",
      loading: "Loading leaderboard...",
      empty: "No public scores yet.",
      modalTitle: "Leaderboard",
      modalBodyDefault: "Weekly reset every Monday.",
      modalBodyJoined: "Weekly reset every Monday.",
      rankingTab: "Leaderboard",
      profileTab: "My nickname",
      weeklyTitle: "This week",
      allTitle: "All-time",
      nicknameLabel: "Nickname",
      nicknamePlaceholder: "Choose a nickname",
      joinCta: "Join leaderboard",
      endJoinTitle: "Put this score on the leaderboard",
      endJoinBody: "Choose a nickname to submit this run to the public leaderboard.",
      updateCta: "Update nickname",
      editProfileCta: "Edit my nickname",
      leaveCta: "Leave leaderboard",
      nicknameRequiredToast: "Add a nickname first.",
      nicknameTooShortToast: "Nickname must be at least 3 characters.",
      nicknameInvalidCharsToast: "Use letters, numbers, spaces, hyphens, or underscores only.",
      saveOkToast: "Nickname saved.",
      leftToast: "You left the leaderboard on this device.",
      remoteSaveErrorToast: "Nickname saved on this device. Online sync can be added later.",
      rankToastWeekly: "This week: #{rank}.",
      scoreRejectedToast: "This score was not added to the public leaderboard this time."
    },

    support: {
      label: "Contact",
      modalTitle: "Write us",
      modalBodyLine1: "Email is the fastest way to reach us.",
      modalBodyLine2: "Copy the address below or open your email app.",
      emailSubjectSuffix: "Feedback",
      ctaCopy: "Copy email",
      ctaOpen: "Open email app",

      // Email compose (prefill)
      emailBodyTemplate: `Hi!

I'm writing about Word Traps.

Message:




Thanks!`
    },


    notFound: {
      title: "Lost in translation?",
      line1: "This page doesn't exist - or it no longer does.",
      line2: "The good news: the game is right where you left it.",
      cta: "Play a new game"
    },

  };



  // 9.6 Soft validation (debug only)
  function validateConfigSoft() {
    const cfg = window.WT_CONFIG;
    if (!cfg || typeof cfg !== "object") return;

    const warn = (...args) => {
      if (cfg.debug && cfg.debug.enabled) console.warn("[WT_CONFIG]", ...args);
    };

    // Regex validity
    try {
      new RegExp(cfg.premiumCodeRegex);
    } catch (e) {
      warn("premiumCodeRegex is invalid", e);
    }

    // UI explanation display regex (optional, but must be valid when enabled)
    try {
      const ed = (cfg.ui && typeof cfg.ui === "object") ? cfg.ui.explanationDisplay : null;
      const enabled = !!(ed && ed.enabled === true);
      const src = enabled ? String(ed.splitRegex || "").trim() : "";
      if (enabled && src) new RegExp(src);
    } catch (e) {
      warn("ui.explanationDisplay.splitRegex is invalid", e);
    }


    // Identity URL (share single source of truth)
    const appUrl = String((cfg.identity && cfg.identity.appUrl) || "").trim();
    if (!appUrl) {
      warn("identity.appUrl is missing (used for share URL)");
    } else if (!/^https?:\/\//i.test(appUrl)) {
      warn("identity.appUrl must start with http:// or https://", appUrl);
    }

    // Stripe URLs
    if (!cfg.stripeEarlyPaymentUrl || String(cfg.stripeEarlyPaymentUrl).includes("REPLACE")) {
      warn("Stripe early URL needs to be configured");
    }
    if (!cfg.stripeStandardPaymentUrl || String(cfg.stripeStandardPaymentUrl).includes("REPLACE")) {
      warn("Stripe standard URL needs to be configured");
    }

    // V2 invariants
    if (!cfg.game || !Number.isFinite(Number(cfg.game.maxChances)) || Number(cfg.game.maxChances) <= 0) {
      warn("game.maxChances must be > 0");
    }

    const poolSizeNum = (cfg.game && Number.isFinite(Number(cfg.game.poolSize))) ? Number(cfg.game.poolSize) : null;
    if (poolSizeNum == null || Math.floor(poolSizeNum) !== poolSizeNum || poolSizeNum < 1 || poolSizeNum > 9999) {
      warn("game.poolSize must be an integer in [1..9999]");
    }

    const freeRunsNum = (cfg.limits && Number.isFinite(Number(cfg.limits.freeRuns))) ? Number(cfg.limits.freeRuns) : null;
    if (freeRunsNum == null || Math.floor(freeRunsNum) !== freeRunsNum || freeRunsNum < 0 || freeRunsNum > 99) {
      warn("limits.freeRuns must be an integer in [0..99]");
    }

    // Curated free RUN openings (see game.js getCuratedFreeRunOpeningIds)
    const cfr = (cfg.curatedFreeRuns && typeof cfg.curatedFreeRuns === "object") ? cfg.curatedFreeRuns : null;
    if (cfr && cfr.enabled === true) {
      const runCountNum = Number(cfr.runCount);
      if (!Number.isFinite(runCountNum) || Math.floor(runCountNum) !== runCountNum || runCountNum < 1 || runCountNum > 99) {
        warn("curatedFreeRuns.runCount must be an integer in [1..99]");
      }
      const byRun = (cfr.cardIdsByRun && typeof cfr.cardIdsByRun === "object") ? cfr.cardIdsByRun : null;
      if (!byRun) {
        warn("curatedFreeRuns.cardIdsByRun is required when curatedFreeRuns.enabled is true");
      } else {
        Object.keys(byRun).forEach((key) => {
          const ids = byRun[key];
          const runNum = Number(key);
          if (!Number.isFinite(runNum) || Math.floor(runNum) !== runNum || runNum < 1) {
            warn("curatedFreeRuns.cardIdsByRun keys must be positive integer run numbers", key);
          }
          if (!Array.isArray(ids) || !ids.length) {
            warn("curatedFreeRuns.cardIdsByRun entries must be non-empty arrays", key);
            return;
          }
          ids.forEach((id) => {
            const n = Number(id);
            if (!Number.isFinite(n) || Math.floor(n) !== n || n < 0) {
              warn("curatedFreeRuns card IDs must be non-negative integers", key, id);
            }
          });
        });
      }
    }



    // Micro-pics (mechanics)
    if (!cfg.microPics || typeof cfg.microPics !== "object") {
      warn("microPics is missing (required for in-run micro-pics rules)");
    } else {
      const c = Number(cfg.microPics.cooldownItems);
      if (!Number.isFinite(c) || c < 0 || c > 99) warn("microPics.cooldownItems must be a number in [0..99]");
    }


    // UI namespace → toast component → default variant → params
    // Hiérarchie intentionnelle (lisibilité + évite collisions de clés)

    const uiCfg = (cfg.ui && typeof cfg.ui === "object") ? cfg.ui : null;
    const toastTiming = (uiCfg && typeof uiCfg.toast === "object") ? uiCfg.toast : null;

    if (!toastTiming || typeof toastTiming !== "object") {
      warn("ui.toast is missing (required for UI toast timing)");
    } else {
      // Default bucket is required
      const def = toastTiming.default;
      if (!def || typeof def !== "object") {
        warn("ui.toast.default is missing (required)");
      } else {
        const td = Number(def.delayMs);
        const tdu = Number(def.durationMs);

        if (!Number.isFinite(td) || td < 0 || td > 2000) warn("ui.toast.default.delayMs must be a number in [0..2000]");
        if (!Number.isFinite(tdu) || tdu < 600 || tdu > 4000) warn("ui.toast.default.durationMs must be a number in [600..4000]");
      }

      // Optional buckets: validate only if provided.
      const buckets = ["positive", "scoreGained"];
      buckets.forEach((k) => {
        const b = toastTiming[k];
        if (!b || typeof b !== "object") return;
        const bd = Number(b.delayMs);
        const bdu = Number(b.durationMs);
        if (!Number.isFinite(bd) || bd < 0 || bd > 2000) warn(`ui.toast.${k}.delayMs must be a number in [0..2000]`);
        if (!Number.isFinite(bdu) || bdu < 600 || bdu > 4000) warn(`ui.toast.${k}.durationMs must be a number in [600..4000]`);
      });

    }
    if (!uiCfg) {
      warn("ui is missing (required for UI timing)");
    } else {
      const cl = Number(uiCfg.chanceLostOverlayMs);
      const rs = Number(uiCfg.runStartOverlayMs);
      const pulse = Number(uiCfg.gameplayPulseMs);

      if (!Number.isFinite(cl) || cl < 200 || cl > 3000) warn("ui.chanceLostOverlayMs must be a number in [200..3000]");
      if (!Number.isFinite(rs) || rs < 200 || rs > 3000) warn("ui.runStartOverlayMs must be a number in [200..3000]");
      if (!Number.isFinite(pulse) || pulse < 0 || pulse > 2000) warn("ui.gameplayPulseMs must be a number in [0..2000]");


      // Secret bonus mode (mechanics)
      if (cfg.secretBonus && cfg.secretBonus.enabled === true) {
        const tw = Number(cfg.secretBonus.tapWindowMs);
        const taps = Number(cfg.secretBonus.tapsRequired);

        if (!Number.isFinite(tw) || tw <= 0) warn("secretBonus.enabled true but tapWindowMs is missing/invalid");
        if (!Number.isFinite(taps) || taps < 0) warn("secretBonus.enabled true but tapsRequired is missing/invalid");
        if (!cfg.game || !Number.isFinite(Number(cfg.game.maxChances)) || Number(cfg.game.maxChances) <= 0) {
        }

        // Gates (canonical)
        const gates = cfg.secretBonus.gates;
        if (!gates || typeof gates !== "object") {
          warn("secretBonus.enabled true but secretBonus.gates is missing");
        } else {
          const endAfterRuns = Number(gates.endAfterRuns);
          const landingAfterRuns = Number(gates.landingAfterRuns);

          // KISS: allow 0 (= always show), otherwise require >= 0 integer
          if (!Number.isFinite(endAfterRuns) || endAfterRuns < 0) warn("secretBonus.gates.endAfterRuns missing/invalid (must be >= 0)");
          if (!Number.isFinite(landingAfterRuns) || landingAfterRuns < 0) warn("secretBonus.gates.landingAfterRuns missing/invalid (must be >= 0)");
        }


        const fl = cfg.secretBonus.fall;
        if (!fl || typeof fl !== "object") {
          warn("secretBonus.enabled true but secretBonus.fall is missing");
        } else if (fl.enabled === true) {
          const initialSpeed = Number(fl.initialSpeed);
          const maxSpeed = Number(fl.maxSpeed);
          const speedIncrement = Number(fl.speedIncrement);
          const dangerThreshold = Number(fl.dangerThreshold);

          if (String(fl.units || "").trim() !== "pctLanePerSec") warn("secretBonus.fall.units must be 'pctLanePerSec'");
          const tv = Number(fl.tuningVersion);
          if (!Number.isFinite(tv) || tv < 1) warn("secretBonus.fall.tuningVersion missing/invalid (must be >= 1)");

          if (!Number.isFinite(initialSpeed) || initialSpeed <= 0) warn("secretBonus.fall.initialSpeed missing/invalid");
          if (!Number.isFinite(maxSpeed) || maxSpeed <= 0) warn("secretBonus.fall.maxSpeed missing/invalid");
          if (!Number.isFinite(speedIncrement) || speedIncrement < 0) warn("secretBonus.fall.speedIncrement missing/invalid");
          if (!Number.isFinite(dangerThreshold) || dangerThreshold <= 0 || dangerThreshold >= 1) {
            warn("secretBonus.fall.dangerThreshold missing/invalid (must be in (0..1))");
          }
          if (Number.isFinite(initialSpeed) && Number.isFinite(maxSpeed) && maxSpeed < initialSpeed) {
            warn("secretBonus.fall.maxSpeed must be >= initialSpeed");
          }
        }

      }



      // Waitlist email (ciphered)
      if (cfg.waitlist && cfg.waitlist.enabled && !cfg.waitlist.toEmailCipher) {
        warn("waitlist.enabled true but toEmailCipher missing");
      }

      // Support email (ciphered)
      if (cfg.support && !cfg.support.emailCipher) {
        warn("support.emailCipher missing");
      }
    }
  }

  // Run on load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      validateConfigSoft();
    });
  } else {
    validateConfigSoft();
  }


})();
