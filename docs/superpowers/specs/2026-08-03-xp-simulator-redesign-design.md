# XP Farming Simulator Redesign

**Date:** 2026-08-03  
**Status:** Approved  
**Approach:** Incremental Enhancement

## Executive Summary

Comprehensive redesign of the Clash of Clans XP Farming Simulator with multi-file structure, accurate calculations, modern UI/UX, and enhanced features. The goal is to create a market-demandable tool that's maintainable, accessible, and feature-rich.

## Current State Analysis

**Existing Issues:**
- Single monolithic HTML file (685 lines)
- Unclear XP calculation formulas
- Limited features (no presets, export, or save functionality)
- Basic UI without animations or modern design patterns
- Poor mobile responsiveness
- No accessibility features

**Strengths to Preserve:**
- Theme switching system (gold/sapphire/crimson)
- Core XP calculation logic (needs refinement)
- Chart.js integration for visualization
- Clean visual hierarchy

## Design Goals

1. **Maintainability:** Multi-file structure with clear separation of concerns
2. **Accuracy:** Research-backed XP formulas from game data
3. **Usability:** Intuitive interface with visual feedback
4. **Accessibility:** WCAG 2.1 AA compliance
5. **Performance:** Optimized for smooth interactions
6. **Extensibility:** Easy to add new features

## Architecture

### File Structure

```
XP_Full_Sim/
├── index.html          # Main HTML structure
├── css/
│   ├── main.css        # Core styles and layout
│   ├── themes.css      # Theme definitions
│   └── components.css  # UI component styles
├── js/
│   ├── app.js          # Main application logic
│   ├── xp-calculator.js # XP formulas and calculations
│   ├── presets.js       # Save/load preset system
│   ├── chart.js        # Chart.js integration
│   └── utils.js        # Helper functions
└── assets/             # Future images/icons
```

### Core Components

#### 1. State Management
- Centralized state object with reactive updates
- Event-driven architecture for component communication
- Undo/redo system using command pattern

#### 2. XP Calculation Engine
- Pure functions for easy testing
- Detailed breakdown objects for UI display
- Validation and cap enforcement

#### 3. Preset System
- localStorage persistence with 5MB limit warning
- Import/export as JSON files
- Custom naming and organization

#### 4. UI Framework
- Custom web components for reusability
- CSS custom properties for theming
- Animation system with GPU acceleration

## Detailed Specifications

### 1. File Structure & Core Architecture

**State Object Structure:**
```javascript
const state = {
  profile: { currentLevel: 1, xpProgress: 0, targetLevel: 2 },
  activity: { attacks: 0, stars: 0 },
  donations: { troops: 0, spells: 0, siege: 0 },
  builders: { count: 0, upgradeTime: 0 },
  war: { attacks: 0, stars: 0, seasonalBonus: 0 },
  settings: { theme: 'gold', language: 'en' },
  presets: [],
  history: []
};
```

**Event System:**
- `stateChanged`: Fired when any state property changes
- `presetSaved`: Fired when a preset is saved
- `exportRequested`: Fired when export is triggered

### 2. XP Calculation System

**Formulas (Research-Based):**

1. **Multiplayer Attacks:**
   - 1 XP per star earned (1-3 XP per attack)
   - Daily cap: 100 attacks

2. **Donations:**
   - Troops: 1 XP per housing space
   - Spells: 5 XP per housing space
   - Siege Machines: 30 XP each
   - Daily caps: 100,000 troop spaces, 10,000 spell spaces, 1,000 siege machines

3. **Builder Upgrades:**
   - XP = √(upgrade duration in seconds) per builder
   - Example: 24-hour upgrade = √(86400) ≈ 294 XP

4. **Clan Wars:**
   - 5 XP per war star earned
   - Weekly cap: 14 stars (2 attacks per war)

5. **Season Challenges:**
   - Variable XP based on challenge tier
   - Tiers: Bronze (10 XP), Silver (25 XP), Gold (50 XP), Platinum (100 XP)

6. **New Sources:**
   - League Bonus: Daily win bonus (10-100 XP based on league)
   - Clan Games: 10-50 XP per challenge completed
   - Special Events: 2x-5x XP multipliers during events

**Calculator Output Structure:**
```javascript
{
  attacks: { daily: 15, xp: 15, breakdown: { 1star: 5, 2star: 8, 3star: 2 } },
  donations: { daily: 500, xp: 500, breakdown: { troops: 400, spells: 80, siege: 20 } },
  builders: { active: 3, xp: 125, breakdown: { builder1: 45, builder2: 40, builder3: 40 } },
  war: { weekly: 10, daily: 1.43, xp: 7.14, breakdown: { stars: 10 } },
  season: { daily: 50, xp: 50, breakdown: { challenges: 3, bonus: 20 } },
  total: { daily: 742.14, weekly: 5195 }
}
```

### 3. UI/UX Improvements

**Visual Design:**
- Modern dark theme with glassmorphism effects
- Light mode toggle with system preference detection
- Improved contrast ratios (4.5:1 minimum)
- Micro-animations on hover/focus states

**Mobile Experience:**
- Touch-friendly sliders (44px minimum thumb size)
- Collapsible sections on mobile
- Bottom navigation for key actions
- Swipe gestures for theme switching

**Animation System:**
- Result cards: Slide-in animation (0.3s ease-out)
- Progress bar: Smooth fill animation (0.5s cubic-bezier)
- Chart: Animated data transitions (0.4s ease-out)
- Theme switching: Cross-fade transitions (0.2s)

**Accessibility:**
- ARIA labels for all interactive elements
- Keyboard navigation with focus indicators
- Screen reader announcements for dynamic content
- High contrast mode option

### 4. Feature Additions

**Preset System:**
- Save/load/delete presets
- Import/export as JSON
- Custom naming with timestamps
- Maximum 50 presets (with warning)

**Export Options:**
- PNG image export (results + chart)
- PDF report with timeline
- Shareable URL with encoded configuration
- CSV data export for analysis

**Advanced Settings:**
- Custom XP multipliers
- Timezone-aware calculations
- Notification preferences
- Display options (compact/detailed)

**Keyboard Shortcuts:**
- `Ctrl+S`: Save preset
- `Ctrl+E`: Export results
- `Ctrl+Z`: Undo last change
- `?`: Show help modal
- `Esc`: Close modals/panels

**Progress Tracking:**
- Session history (last 10 configurations)
- Comparison mode (side-by-side)
- Milestone celebrations (confetti effect)

## Implementation Plan

### Phase 1: Core Restructuring (Week 1)
1. Create file structure
2. Extract CSS into separate files
3. Extract JS into modules
4. Implement basic state management
5. Test core functionality

### Phase 2: Calculation Engine (Week 2)
1. Research and implement accurate XP formulas
2. Create calculator module with detailed breakdowns
3. Add validation and cap enforcement
4. Implement input sanitization

### Phase 3: UI Enhancements (Week 3)
1. Implement modern dark theme
2. Add light mode toggle
3. Create animation system
4. Improve mobile responsiveness
5. Add accessibility features

### Phase 4: Feature Additions (Week 4)
1. Implement preset system with localStorage
2. Add export functionality (PNG, PDF, CSV)
3. Create settings panel
4. Add keyboard shortcuts
5. Implement progress tracking

### Phase 5: Polish & Testing (Week 5)
1. Cross-browser testing
2. Performance optimization
3. Accessibility audit
4. User testing and feedback
5. Documentation

## Testing Strategy

**Unit Tests:**
- XP calculation functions
- Preset save/load operations
- Input validation logic

**Integration Tests:**
- State management system
- Event handling
- Module interactions

**E2E Tests:**
- User workflows (save preset, export, etc.)
- Cross-browser compatibility
- Mobile responsiveness

**Accessibility Tests:**
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation

## Success Metrics

1. **Performance:** < 100ms for calculations, < 300ms for UI updates
2. **Accessibility:** WCAG 2.1 AA compliance
3. **Usability:** Task completion rate > 95%
4. **Maintainability:** Code coverage > 80%
5. **User Satisfaction:** Positive feedback from beta testers

## Risks & Mitigations

**Risk 1: Calculation Accuracy**
- Mitigation: Research from multiple game sources, community validation

**Risk 2: Browser Compatibility**
- Mitigation: Progressive enhancement, polyfills where needed

**Risk 3: Performance Issues**
- Mitigation: Web Workers for heavy calculations, virtual scrolling for large lists

**Risk 4: Scope Creep**
- Mitigation: Strict phase adherence, MVP first approach

## Future Enhancements

1. **Offline Support:** Service Worker for full offline functionality
2. **Multi-language:** Internationalization support
3. **Advanced Analytics:** Machine learning for optimal farming strategies
4. **Social Features:** Share strategies, compare with friends
5. **Game Integration:** Official API integration (if available)

## Conclusion

This redesign transforms the XP Farming Simulator from a basic tool into a comprehensive, maintainable, and user-friendly application. The incremental approach ensures we can deliver value quickly while building toward a complete solution.

**Next Steps:**
1. Review and approve this design document
2. Create implementation plan using writing-plans skill
3. Begin Phase 1 implementation
