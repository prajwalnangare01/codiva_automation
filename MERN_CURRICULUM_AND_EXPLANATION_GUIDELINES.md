# MERN Stack Social Media: Curriculum Sequence & Explanation Guidelines

These guidelines define the pedagogical rules, sequence structure, and explanation standards for all posts published to `@codiva_labs`.

---

## 1. Core Principles

### Principle A: Sequence is Sacred
The sequence of posts must follow a strict, logical developer learning path. Never skip ahead or introduce advanced concepts before foundational ones:
1. **HTML5** (Structure, Semantics, Forms, Accessibility, SEO)
2. **CSS3** (Box Model, Flexbox, Grid, Variables, Positioning, Responsive Design)
3. **Modern JavaScript ES6+** (Variables, Scope, Async/Await, Array Methods, Closures, Event Loop)
4. **React.js** (Virtual DOM, JSX, useState, useEffect, Custom Hooks, State Management)
5. **Node.js & Express.js** (Runtime, REST APIs, Routing, Middleware, Error Handling, JWT Auth)
6. **MongoDB & Mongoose** (NoSQL Documents, Schemas, CRUD, Indexing, Data Modeling)
7. **Fullstack MERN Integration** (Connecting Frontend to Backend, CORS, Security Headers, Deployment)

### Principle B: Explanations Must Be Ultra-Simple (ELI5 Rule)
- **Zero Dense Academic Jargon**: Avoid unnecessary complexity. Explain concepts the way a senior engineer would explain them to a junior friend over coffee.
- **Relatable Pain Point**: The ❌ Bad Way must show a real mistake that causes visible frustration (e.g. broken mobile layout, silent re-render bug, 4-second slow database query).
- **Direct Cause and Effect**:
  - `⚠️ WHY IT FAILS`: State in one plain sentence what breaks.
  - `🚀 WHY IT WORKS`: State in one plain sentence why the pro pattern fixes it.
- **Actionable Golden Rule**: Every post ends with a single, memorable rule of thumb that developers can memorize immediately.

---

## 2. Visual Layout & Formatting Rules

- **Font Family**: Clean, open, humanist sans-serif (`Segoe UI` or `Arial`) for all headings, labels, and explanations. Monospace (`Consolas`) for code.
- **Font Sizing**:
  - Main Headline: `44px - 50px` bold.
  - Code Lines: `25px - 26px` bold syntax colored.
  - Explanation Text: `20px - 21px` clean, high-contrast white (`#F3F4F6`).
- **Paddings**:
  - Code Terminal Box height is locked at `170px`.
  - Line baseline starts at `y = 68` with `36px` line gap, ensuring at least `30px` of breathing room above the bottom border so text never touches border lines.
- **Aspect Ratio**: 1080×1350 (4:5 portrait) optimized for Instagram feeds.

---

## 3. Publication Schedule & Automation

- **Post 1**: Every day at **7:00 PM IST** (`19:00`).
- **Post 2**: Every day at **10:00 PM IST** (`22:00`).
- **Progression State**: Managed through `data/state.json` on disk, guaranteeing that every execution automatically advances to the next consecutive concept with zero duplicates.
