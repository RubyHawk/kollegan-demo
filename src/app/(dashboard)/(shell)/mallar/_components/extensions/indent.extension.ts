import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /** Increase paragraph indent by one level (max 8) */
      increaseIndent: () => ReturnType;
      /** Decrease paragraph indent by one level (min 0) */
      decreaseIndent: () => ReturnType;
    };
  }
}

const INDENT_STEP = 2; // rem per level
const MAX_INDENT = 8;  // levels

/**
 * Adds indent/outdent to paragraphs via padding-left.
 * Each level = 2rem (matches Word's default tab stop of ~1.27cm ≈ 1.5rem, rounded to 2).
 */
export const TextIndent = Extension.create({
  name: 'indent',

  addOptions() {
    return { types: ['paragraph', 'heading'] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const pl = (el as HTMLElement).style.paddingLeft;
              if (!pl) return 0;
              return Math.round(parseFloat(pl) / INDENT_STEP);
            },
            renderHTML: (attrs) => {
              if (!attrs.indent) return {};
              return { style: `padding-left: ${attrs.indent * INDENT_STEP}rem` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ commands, editor }) => {
          // Operate on all selected nodes
          const types = this.options.types as string[];
          return types.some((type) => {
            const current = (editor.getAttributes(type).indent as number) ?? 0;
            if (current >= MAX_INDENT) return false;
            return commands.updateAttributes(type, { indent: current + 1 });
          });
        },
      decreaseIndent:
        () =>
        ({ commands, editor }) => {
          const types = this.options.types as string[];
          return types.some((type) => {
            const current = (editor.getAttributes(type).indent as number) ?? 0;
            if (current <= 0) return false;
            return commands.updateAttributes(type, { indent: current - 1 });
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Only handle Tab for indent when NOT inside a list — let listKeymap
      // handle Tab/Shift-Tab for nested list indentation.
      Tab: () => {
        if (
          this.editor.isActive('bulletList') ||
          this.editor.isActive('orderedList') ||
          this.editor.isActive('listItem')
        ) {
          return false; // fall through to listKeymap
        }
        return this.editor.commands.increaseIndent();
      },
      'Shift-Tab': () => {
        if (
          this.editor.isActive('bulletList') ||
          this.editor.isActive('orderedList') ||
          this.editor.isActive('listItem')
        ) {
          return false;
        }
        return this.editor.commands.decreaseIndent();
      },
    };
  },
});
