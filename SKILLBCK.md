---
name: design-system-bacykism
description: Creates implementation-ready design-system guidance with tokens, component behavior, and accessibility standards. Use when creating or updating UI rules, component specifications, or design-system documentation.
---

<!-- TYPEUI_SH_MANAGED_START -->

# Bacykism

## Mission
Deliver implementation-ready design-system guidance for Bacykism that can be applied consistently across e-commerce storefront interfaces.

## Brand
- Product/brand: Bacykism
- URL: https://bacykism.com/
- Audience: online shoppers and consumers
- Product surface: e-commerce storefront

## Style Foundations
- Visual style: structured, accessible, implementation-first
- Main font style: `font.family.primary=Open Sans`, `font.family.stack=Open Sans, sans-serif`, `font.size.base=11.5px`, `font.weight.base=600`, `font.lineHeight.base=30px`
- Typography scale: `font.size.xs=0px`, `font.size.sm=11.5px`, `font.size.md=13px`, `font.size.lg=14px`, `font.size.xl=15px`, `font.size.2xl=16px`, `font.size.3xl=18px`, `font.size.4xl=20px`
- Color palette: `color.text.primary=#252a2b`, `color.text.secondary=#333333`, `color.surface.muted=#ffffff`, `color.text.inverse=#6d6565`, `color.surface.base=#000000`, `color.surface.raised=#151517`
- Spacing scale: `space.1=1px`, `space.2=5px`, `space.3=8px`, `space.4=10px`, `space.5=12px`, `space.6=13px`, `space.7=15px`, `space.8=16px`
- Radius/shadow/motion tokens: `radius.xs=4px`, `radius.sm=16px`, `radius.md=50px` | `motion.duration.instant=300ms`, `motion.duration.fast=400ms`, `motion.duration.normal=450ms`, `motion.duration.slow=500ms`

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required.
- Contrast constraints required.

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic tokens, not raw hex values in component guidance.
- Every component must define required states: default, hover, focus-visible, active, disabled, loading, error.
- Responsive behavior and edge-case handling should be specified for every component family.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't
- Do not allow low-contrast text or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy, variants, and interactions.
4. Add accessibility acceptance criteria.
5. Add anti-patterns and migration notes.
6. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Prefer system consistency over local visual exceptions.

<!-- TYPEUI_SH_MANAGED_END -->
