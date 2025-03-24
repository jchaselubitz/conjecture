import katex from "katex";

export const generateColorFromString = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate a pastel color
  const h = Math.abs(hash) % 360;
  const s = 50 + (Math.abs(hash) % 30); // 50-80%
  const l = 80 + (Math.abs(hash) % 15); // 80-95%

  // Calculate border and hover colors
  const borderL = l - 20; // Darker for border
  const hoverL = l - 5; // Slightly darker for hover

  return {
    backgroundColor: `hsla(${h}, ${s}%, ${l}%, 0.2)`,
    borderColor: `hsl(${h}, ${s}%, ${borderL}%)`,
    hoverBackgroundColor: `hsla(${h}, ${s}%, ${hoverL}%, 0.3)`,
  };
};

/**
 * Processes LaTeX elements in the DOM to render them using KaTeX
 * @param container - Optional container to limit the scope of the search
 */
export function processLatex(container: HTMLElement) {
  const elements = container.querySelectorAll(
    '[data-type="latex"], [data-type="latex-block"], .inline-latex, .latex-block',
  );

  elements.forEach((element) => {
    // Skip if this is already a KaTeX element or is inside one
    if (
      element.classList.contains("katex") ||
      element.classList.contains("katex-html") ||
      element.closest(".katex") ||
      element.querySelector(".katex-rendered") ||
      // Skip if this element is already fully processed
      element.classList.contains("katex-processed")
    ) {
      return;
    }

    // Store all original attributes to preserve them
    const originalAttributes = {} as Record<string, string>;
    Array.from(element.attributes).forEach((attr) => {
      originalAttributes[attr.name] = attr.value;
    });

    // Get the LaTeX content with fallbacks
    let latex = element.getAttribute("data-latex");

    if (!latex) {
      latex = element.getAttribute("data-original-content");
    }

    if (!latex && !element.querySelector(".katex")) {
      latex = element.textContent?.trim() || "";
    }

    if (!latex) {
      return;
    }

    // Store the original LaTeX content for future reference
    element.setAttribute("data-original-content", latex);
    element.setAttribute("data-latex", latex);

    // Determine if this is a block or inline element
    const isBlock = element.classList.contains("latex-block") ||
      element.getAttribute("data-type") === "latex-block" ||
      element.getAttribute("data-display-mode") === "true";

    try {
      // Create a wrapper to hold the rendered LaTeX
      const wrapper = document.createElement("div");
      wrapper.classList.add("katex-rendered");

      // Render the LaTeX to the wrapper
      katex.render(latex, wrapper, {
        throwOnError: false,
        displayMode: isBlock,
        output: "html",
      });

      // Clear the element without destroying it
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }

      // Move the rendered content to the original element
      while (wrapper.firstChild) {
        element.appendChild(wrapper.firstChild);
      }

      // Restore all original attributes
      for (const [key, value] of Object.entries(originalAttributes)) {
        // Skip class as we'll handle it separately
        if (key !== "class") {
          element.setAttribute(key, value);
        }
      }

      // Make sure display mode is correctly set
      element.setAttribute("data-display-mode", String(isBlock));

      // Preserve classes
      if (isBlock) {
        element.classList.add("latex-block");
        element.classList.remove("inline-latex");
      } else {
        element.classList.add("inline-latex");
        element.classList.remove("latex-block");
      }

      element.classList.add("katex-processed");
    } catch (error) {
      console.error("Error rendering LaTeX:", error, { element, latex });

      // On error, restore original attributes and add error class
      for (const [key, value] of Object.entries(originalAttributes)) {
        element.setAttribute(key, value);
      }

      element.classList.add("latex-error");

      // Display error message
      element.innerHTML =
        `<span class="latex-error-msg">Error rendering LaTeX</span>`;
      element.setAttribute(
        "title",
        `LaTeX Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  });
}
