# Action Plan

This file tracks only the Word Traps work that still remains after the current alignment pass.

## Still To Do

### Reliability

- verify manually in Stripe that both Payment Links redirect to the hosted `success.html`
- document clearly that the early-price timer is local UX, not server-verified
- decide later whether the static unlock flow is acceptable as-is or whether a server-verified or signed return is needed

### UX QA

- run one more mobile QA pass on:
  - update toast -> refresh path on Android and iPhone
  - install prompt layout
  - END wrap behavior for long category names
  - CTA wrap and footer fit on smaller screens

### Content And Product Copy

- do a final explanation pass where L2 still answers too indirectly
- re-check landing / END copy so the app stays framed around French understanding and distinctions, not generic performance
- decide later whether this app still needs any extra learner-facing dashboard or whether END + landing is enough
