# UI Components and Styling Guide

Simple-CRM uses a modern, consistent UI framework based on shadcn/ui components and custom styling. This guide provides an overview of our UI architecture and styling principles.

## Component Library

### shadcn/ui Components

We use [shadcn/ui](https://ui.shadcn.com/) as our base component library. These components are:
- Highly customizable
- Accessible by default
- Built on Radix UI primitives
- Styled with Tailwind CSS

Key components include:
- Button
- Card
- Dialog
- Table
- Progress
- Badge
- Checkbox
- Tooltip

## Typography

### Fonts
We use two main fonts:
- **Inter** (300, 400, 500, 600, 700 weights)
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
  ```
- **Poetsen One** (for specific UI elements)
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Poetsen+One&display=swap');
  ```

### Font Usage
- Body text: Regular weight (400)
- Table content: Regular weight (400)
- Headers: Medium weight (500)
- Buttons: Medium weight (500)
- Labels: Medium weight (500)

## Table Components

Our tables use shadcn/ui's table components with custom styling:

```typescript
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
```

### Table Styling Principles
- Regular font weight for better readability
- Fixed column widths for consistency
- Truncation with tooltips for long content
- Hover states for better interaction
- Responsive design considerations

## Color System

We use CSS variables for consistent theming:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}
```

### Dark Mode Support
Dark mode colors are defined using the same variable structure:
```css
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... other dark mode variables ... */
}
```

## Notion-like Styling

We provide Notion-inspired components for consistent styling:

```css
.notion-card {
  @apply border border-border bg-white p-5 rounded-lg transition-all duration-200 hover:shadow-sm;
}

.notion-button {
  @apply px-4 py-2 text-sm text-primary bg-transparent border border-gray-200 rounded-md hover:bg-accent transition-colors duration-200;
}

.notion-primary-button {
  @apply px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 transition-colors duration-200;
}
```

## Best Practices

1. **Component Usage**
   - Use shadcn/ui components when available
   - Maintain consistent styling across similar components
   - Follow accessibility guidelines

2. **Styling**
   - Use Tailwind CSS classes for styling
   - Leverage CSS variables for theming
   - Keep styles modular and reusable

3. **Responsive Design**
   - Use responsive classes appropriately
   - Test components across different screen sizes
   - Implement mobile-first design principles

4. **Performance**
   - Optimize component rendering
   - Use appropriate image formats and sizes
   - Implement lazy loading where necessary

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Import components:
   ```typescript
   import { Button } from "@/components/ui/button";
   import { Card } from "@/components/ui/card";
   ```

3. Use Tailwind classes for styling:
   ```tsx
   <div className="flex items-center space-x-4">
     <Button variant="outline">Cancel</Button>
     <Button>Submit</Button>
   </div>
   ```

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [Radix UI Documentation](https://www.radix-ui.com) 