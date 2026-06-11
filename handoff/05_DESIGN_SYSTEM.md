# Design System — The Seat

---

## Color Palette

```css
--evergreen: #023B28    /* Primary dark green — headings, buttons, backgrounds */
--jungle:    #149077    /* Accent teal/green — CTAs, highlights, punch list badges */
--mist:      #E2F3F0    /* Light green tint — subtle backgrounds */
--cream:     #FDFAF7    /* Off-white — main page background */
--lavender:  #EBD6E9    /* Bex/Hype persona color */
--amber:     #FFF3E8    /* Warm amber — used sparingly */
--dark-green: #2a3d30   /* Darker green variant */
```

**Usage patterns:**
- Page backgrounds: `#F4F1EC` (slightly warmer cream, used on admin/sessions/beta)
- Card backgrounds: `#fff` with `border: 1px solid rgba(2,59,40,0.08)`
- Body text: `#023B28` (evergreen)
- Muted text: `rgba(2,59,40,0.55)` or `rgba(2,59,40,0.4)`
- Very muted / labels: `rgba(2,59,40,0.35)`

---

## Typography

**Font:** Inter Tight (Google Fonts)
**CSS variable:** `--font-inter-tight`
**Weights used:** 300, 400, 500, 600, 700, 800

**Type scale patterns:**
```
Label/eyebrow: 11px, weight 700, letter-spacing 0.1em, uppercase
Body small:    12–13px, weight 400–500
Body:          14–15px, weight 400–500
Subhead:       16–18px, weight 400–600
H2:            20–26px (clamp), weight 800, letter-spacing -0.02em
H1:            28–48px (clamp), weight 800, letter-spacing -0.03em
Metric number: 36px, weight 800, letter-spacing -0.03em
```

**Eyebrow label pattern (used everywhere):**
```tsx
<p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase', color: 'rgba(2,59,40,0.45)', margin: '0 0 6px' }}>
  The Seat
</p>
```

---

## Spacing

Uses `clamp()` extensively for responsive padding:
```css
padding: clamp(40px, 5vw, 64px) clamp(24px, 5vw, 48px)
```

Standard card padding: `20px 24px`
Standard section gap: `24px` (grid) or `48px` (between form sections)
Standard border-radius: `16px` (cards), `100px` (pills/buttons), `12px` (inputs)

---

## Buttons

**Primary (dark green):**
```tsx
style={{
  background: '#023B28', color: '#FDFAF7',
  borderRadius: '100px', padding: '14px 32px',
  fontSize: '15px', fontWeight: 700,
  fontFamily: 'var(--font-inter-tight), sans-serif',
  border: 'none', cursor: 'pointer',
  letterSpacing: '-0.01em',
}}
```

**Accent (teal/jungle):**
```tsx
style={{
  backgroundColor: '#149077', color: '#fff',
  borderRadius: '100px', padding: '16px 36px',
  fontSize: '16px', fontWeight: 800,
  border: 'none', cursor: 'pointer',
}}
```

**Disabled state:**
```tsx
background: 'rgba(2,59,40,0.15)', color: 'rgba(2,59,40,0.35)', cursor: 'not-allowed'
```

**Survey option button (selected vs unselected):**
```tsx
border: `2px solid ${selected ? '#023B28' : 'rgba(2,59,40,0.1)'}`,
background: selected ? '#023B28' : '#fff',
```

---

## Nav

```css
nav {
  background: #023B28;
  height: 60px;
  padding: 0 clamp(20px, 4vw, 48px);
  position: sticky; top: 0; z-index: 50;
}
```

Nav tabs: `rgba(253,250,247,0.55)` inactive, `#FDFAF7` active with `border-bottom: 2px solid #149077`

Sign in button: `.btn-signin` class — outlined, cream text, rounds to pill

---

## Cards

Standard card:
```tsx
style={{
  background: '#fff',
  borderRadius: '16px',
  padding: '20px 24px',
  border: '1px solid rgba(2,59,40,0.08)',
}}
```

---

## Persona Colors

| Persona | Color | Use |
|---|---|---|
| Dana (Skeptic) | `#023B28` | Dark evergreen |
| Marcus (Slammed) | `#149077` | Jungle teal |
| Bex (Hype) | `#8a3fad` | Purple |

Persona backgrounds (soft):
- Skeptic: `#E2F3F0` (mist)
- Slammed: `#E8F5F2`
- Hype: `#EBD6E9` (lavender)

---

## Priority Badge Colors (Punch List)

```
DO FIRST:     #023B28 text, #023B2818 background
DO NEXT:      #149077 text, #14907718 background
NICE TO HAVE: #8a9e96 text, #8a9e9618 background
```

---

## Key CSS Classes (globals.css)

```css
.btn-primary      /* Primary CTA button */
.btn-secondary    /* Secondary button */
.btn-signin       /* Nav sign-in button */
.nav-tab          /* Nav link/tab */
.nav-tab.active   /* Active nav tab */
.no-print         /* Hidden in print/PDF view */
.session-persona-triptych  /* Persona card grid — responsive */
```

**Mobile breakpoint:** `@media (max-width: 600px)` — stacks persona triptych, adjusts padding

---

## Animation

```css
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes floatBob {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-6px); }
}
```

Used sparingly — upload zone icon, initial page load.

---

## Inline Style Pattern

Most styles in this codebase are inline JSX objects, NOT Tailwind classes. When adding new UI, follow this pattern:

```tsx
<div style={{
  background: '#fff',
  borderRadius: '16px',
  padding: '20px 24px',
  border: '1px solid rgba(2,59,40,0.08)',
  marginBottom: '24px',
}}>
```

Tailwind is installed but used minimally (mainly for `antialiased` and utility overrides).
