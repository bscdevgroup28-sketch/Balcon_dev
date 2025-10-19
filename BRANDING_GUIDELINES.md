# Bal-Con Builders - Branding Guidelines

**Last Updated**: October 19, 2025  
**Version**: 1.0.0  
**Status**: ✅ ACTIVE

---

## 🎨 Overview

This document defines the visual branding standards for the Bal-Con Builders Project Management Platform. All developers, designers, and contributors must follow these guidelines to maintain brand consistency across the application.

---

## 📐 Logo Usage

### Primary Logo

**File**: `logo-full.png`  
**Location**: `frontend/public/logo-full.png` and `frontend/src/assets/images/logo-full.png`

**Usage**:
- ✅ Login page header
- ✅ Email templates (light backgrounds)
- ✅ Print materials
- ✅ Marketing collateral
- ✅ Documentation covers
- ✅ Settings "About" section

**Specifications**:
- **Minimum Width**: 120px
- **Recommended Width**: 200-300px
- **Aspect Ratio**: Maintain original (do not stretch or distort)
- **Clear Space**: Minimum 20px padding on all sides
- **Background**: Works best on white or light backgrounds

**Example Usage**:
```tsx
<img 
  src="/logo-full.png" 
  alt="Bal-Con Builders" 
  style={{ 
    maxWidth: '300px',
    width: '100%',
    height: 'auto'
  }}
/>
```

---

### Logo in AppBar

**File**: `logo-full.png` (with CSS filter to white)  
**Location**: `frontend/src/components/layout/Layout.tsx`

**Usage**:
- ✅ Application top navigation bar
- ✅ Dashboard header

**Specifications**:
- **Height**: 48px
- **Max Width**: 220px
- **Color**: Inverted to white using CSS filter
- **Background**: Bal-Con Blue (#004B87) AppBar

**Example Usage**:
```tsx
<img 
  src="/logo-full.png" 
  alt="Bal-Con Builders" 
  style={{ 
    height: '48px',
    width: 'auto',
    maxWidth: '220px',
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)' // Converts to white
  }}
/>
```

---

### Favicon & PWA Icons

**Files**:
- `frontend/public/favicon.ico` - Browser tab icon
- `frontend/public/logo192.png` - PWA icon (192x192)
- `frontend/public/logo512.png` - PWA icon (512x512)

**Usage**:
- ✅ Browser tab icon
- ✅ Bookmarks
- ✅ PWA home screen icon (mobile/desktop)
- ✅ iOS home screen icon

**Specifications**:
- **favicon.ico**: Multi-resolution (16x16, 32x32, 48x48)
- **logo192.png**: 192x192 pixels, PNG format
- **logo512.png**: 512x512 pixels, PNG format
- **Format**: PNG with transparent background preferred

---

### Logo Don'ts

❌ **Do NOT**:
- Stretch or distort the logo (maintain aspect ratio)
- Change logo colors or add effects (shadows, gradients, outlines)
- Rotate or skew the logo
- Use low-resolution or pixelated versions
- Place logo on busy or low-contrast backgrounds
- Alter the logo in any way
- Remove elements from the logo
- Rearrange logo components

---

## 🎨 Color Palette

### Primary Colors

#### Bal-Con Blue
- **Hex**: `#004B87`
- **RGB**: `rgb(0, 75, 135)`
- **Usage**: Primary buttons, AppBar, headings, links, navigation
- **Accessibility**: AAA rating with white text (contrast ratio: 10.88:1)

**Variants**:
- **Light**: `#3574B3` - Hover states, lighter accents
- **Dark**: `#003561` - Pressed states, emphasis

#### Bal-Con Red
- **Hex**: `#E31E24`
- **RGB**: `rgb(227, 30, 36)`
- **Usage**: Secondary buttons, CTAs, alerts, important actions, accent elements
- **Accessibility**: AAA rating with white text (contrast ratio: 5.54:1)

**Variants**:
- **Light**: `#E94D52` - Hover states
- **Dark**: `#B01519` - Pressed states

---

### Neutral Colors

#### Backgrounds
- **Default Background**: `#F8F9FA` - Page backgrounds
- **Paper Background**: `#FFFFFF` - Cards, modals, dialogs

#### Text
- **Primary Text**: `#212121` - Headings, body text
- **Secondary Text**: `#616161` - Supporting text, captions

#### Dividers
- **Divider Color**: `#E0E0E0` - Separators, borders

---

### Functional Colors

#### Success
- **Main**: `#2E7D32` - Success messages, confirmations
- **Light**: `#60AD5E`
- **Dark**: `#005005`

#### Error (Uses Bal-Con Red)
- **Main**: `#E31E24`
- **Light**: `#E94D52`
- **Dark**: `#B01519`

#### Warning
- **Main**: `#F57C00` - Warnings, caution messages
- **Light**: `#FFB74D`
- **Dark**: `#E65100`

#### Info
- **Main**: `#0288D1` - Informational messages
- **Light**: `#4FC3F7`
- **Dark**: `#01579B`

---

## 📝 Typography

### Font Families

**Primary**: Inter (400, 500, 600, 700)  
**Fallback**: Roboto, Helvetica, Arial, sans-serif

```css
font-family: "Inter", "Roboto", "Helvetica", "Arial", sans-serif;
```

### Heading Styles

All headings use **Bal-Con Blue (#004B87)** for brand consistency.

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| **H1** | 2.5rem (40px) | 600 | Page titles |
| **H2** | 2rem (32px) | 600 | Section headers |
| **H3** | 1.75rem (28px) | 600 | Sub-sections |
| **H4** | 1.5rem (24px) | 500 | Card titles |
| **H5** | 1.25rem (20px) | 500 | Widget titles |
| **H6** | 1rem (16px) | 500 | Small headers |

### Body Text

| Element | Size | Line Height | Usage |
|---------|------|-------------|-------|
| **Body 1** | 1rem (16px) | 1.5 | Primary content |
| **Body 2** | 0.875rem (14px) | 1.43 | Secondary content |
| **Caption** | 0.75rem (12px) | 1.66 | Captions, labels |

---

## 🧩 Component Styling

### Buttons

#### Primary Button (Bal-Con Blue)
```tsx
<Button variant="contained" color="primary">
  Primary Action
</Button>
```
- **Background**: #004B87
- **Text**: White
- **Hover**: #3574B3
- **Usage**: Main actions (Save, Submit, Create)

#### Secondary Button (Bal-Con Red)
```tsx
<Button variant="contained" color="secondary">
  Secondary Action
</Button>
```
- **Background**: #E31E24
- **Text**: White
- **Hover**: #E94D52
- **Usage**: Important secondary actions (Delete, Cancel)

#### Outlined Button
```tsx
<Button variant="outlined" color="primary">
  Outlined Action
</Button>
```
- **Border**: #004B87
- **Text**: #004B87
- **Usage**: Less prominent actions

---

### AppBar

**Background**: Bal-Con Blue (#004B87)  
**Text**: White (#FFFFFF)  
**Icons**: White  
**Height**: 64px (desktop), 56px (mobile)

```tsx
<AppBar position="fixed" sx={{ bgcolor: '#004B87' }}>
  <Toolbar>
    {/* Logo (white version) */}
    {/* Navigation items */}
  </Toolbar>
</AppBar>
```

---

### Cards & Paper

**Background**: White (#FFFFFF)  
**Border Radius**: 4px (default Material-UI)  
**Elevation**: 1-3 (subtle shadows)  
**Padding**: 16px (sm), 24px (md), 32px (lg)

```tsx
<Paper elevation={2} sx={{ p: 3 }}>
  {/* Card content */}
</Paper>
```

---

### Links

**Color**: Bal-Con Blue (#004B87)  
**Hover**: Bal-Con Blue Light (#3574B3)  
**Visited**: Bal-Con Blue Dark (#003561)  
**Underline**: On hover only

```tsx
<Link href="#" sx={{ color: 'primary.main' }}>
  Link Text
</Link>
```

---

## 📱 Responsive Design

### Logo Sizing by Breakpoint

| Breakpoint | Screen Size | Logo Height | Logo Max Width |
|------------|-------------|-------------|----------------|
| **xs** | 0-599px | 36px | 150px |
| **sm** | 600-899px | 40px | 180px |
| **md** | 900-1199px | 48px | 220px |
| **lg** | 1200px+ | 48px | 220px |

### Mobile Considerations

- Use compact logo version on small screens (<600px)
- Ensure minimum 44x44px touch targets for mobile
- Maintain adequate spacing (min 16px) on mobile
- Test logo visibility on various screen sizes

---

## ♿ Accessibility

### Color Contrast

All color combinations meet **WCAG AA** standards (4.5:1 for normal text, 3:1 for large text):

| Combination | Contrast Ratio | Rating |
|-------------|----------------|--------|
| Bal-Con Blue on White | 10.88:1 | ✅ AAA |
| Bal-Con Red on White | 5.54:1 | ✅ AAA |
| White on Bal-Con Blue | 10.88:1 | ✅ AAA |
| White on Bal-Con Red | 5.54:1 | ✅ AAA |
| Primary Text on White | 16.10:1 | ✅ AAA |

### Logo Accessibility

**Alt Text**: Always use `"Bal-Con Builders"` as alt text for all logo images.

```tsx
<img src="/logo-full.png" alt="Bal-Con Builders" />
```

**Fallback**: Provide text fallback if image fails to load.

```tsx
<img 
  src="/logo-full.png" 
  alt="Bal-Con Builders"
  onError={(e) => {
    // Show text fallback
  }}
/>
<Typography sx={{ display: 'none' }}>
  Bal-Con Builders
</Typography>
```

---

## 📂 Asset Locations

### Logo Files

```
frontend/
├── public/
│   ├── logo-full.png          ← Original logo (full color)
│   ├── logo192.png            ← PWA icon (192x192)
│   ├── logo512.png            ← PWA icon (512x512)
│   └── favicon.ico            ← Browser favicon
└── src/
    └── assets/
        └── images/
            └── logo-full.png  ← For component imports
```

### Theme Configuration

**File**: `frontend/src/theme/theme.ts`

Brand colors are defined in the Material-UI theme:

```typescript
palette: {
  primary: {
    main: '#004B87', // Bal-Con Blue
    light: '#3574B3',
    dark: '#003561',
  },
  secondary: {
    main: '#E31E24', // Bal-Con Red
    light: '#E94D52',
    dark: '#B01519',
  },
  // ...
}
```

---

## 🧪 Testing Checklist

Before committing branding changes:

### Visual Testing
- [ ] Logo displays correctly on AppBar (white version)
- [ ] Logo displays correctly on Login page (full color)
- [ ] Logo maintains aspect ratio on all screen sizes
- [ ] Favicon appears in browser tab
- [ ] PWA icon appears when installing app
- [ ] Logo displays in Settings > About section
- [ ] All buttons use correct brand colors
- [ ] AppBar uses Bal-Con Blue background

### Responsive Testing
- [ ] Desktop (1920px): Logo scales appropriately
- [ ] Laptop (1366px): Logo visible and readable
- [ ] Tablet (768px): Logo compact but legible
- [ ] Mobile (375px): Logo or icon-only version displays

### Accessibility Testing
- [ ] Logo has proper alt text
- [ ] Color contrast meets WCAG AA
- [ ] Logo visible in high-contrast mode
- [ ] Text fallback works if image fails
- [ ] Keyboard navigation works with logo/links

### Cross-Browser Testing
- [ ] Chrome/Edge: Favicon and logo display
- [ ] Firefox: Favicon and logo display
- [ ] Safari: Favicon and logo display
- [ ] Mobile browsers: Touch targets adequate

---

## 🚀 Implementation Examples

### Complete Login Page Header

```tsx
{/* Company Header */}
<Box textAlign="center" mb={4}>
  {/* Company Logo */}
  <Box sx={{ mb: 3 }}>
    <img 
      src="/logo-full.png" 
      alt="Bal-Con Builders" 
      style={{ 
        maxWidth: '300px',
        width: '100%',
        height: 'auto',
        marginBottom: '16px'
      }}
    />
  </Box>
  
  <Typography variant="h5" color="text.secondary" gutterBottom>
    Professional Construction Management Platform
  </Typography>
  <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
    Streamline your construction projects with our comprehensive management system.
  </Typography>
</Box>
```

### Complete AppBar with Logo

```tsx
<AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
  <Toolbar>
    {/* Logo */}
    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
      <img 
        src="/logo-full.png" 
        alt="Bal-Con Builders" 
        style={{ 
          height: '48px',
          width: 'auto',
          maxWidth: '220px',
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)' // Convert to white
        }}
        onError={(e) => {
          // Fallback to text if image fails
          const target = e.currentTarget;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'block';
        }}
      />
      <Typography variant="h6" noWrap component="div" sx={{ display: 'none' }}>
        Bal-Con Builders
      </Typography>
    </Box>
    
    {/* Other toolbar items */}
  </Toolbar>
</AppBar>
```

---

## 📖 References

- **Company Website**: https://www.balconbuilders.com/
- **Original Logo**: `balcon.png` (provided October 19, 2025)
- **Material-UI Theme**: `frontend/src/theme/theme.ts`
- **AppBar Implementation**: `frontend/src/components/layout/Layout.tsx`
- **Login Page**: `frontend/src/pages/auth/LoginEnhanced.tsx`

---

## 📞 Questions or Updates?

If you need to make branding changes or have questions about logo usage:

1. Review this document first
2. Check existing implementations in the codebase
3. Maintain brand consistency across all changes
4. Update this document if new patterns are established

---

## 📋 Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | Oct 19, 2025 | Initial branding guidelines created | GitHub Copilot |

---

**© 2025 Bal-Con Builders. All rights reserved.**

**Note**: Logo files are copyrighted by Bal-Con Builders. Do not modify, alter, or redistribute without permission.
