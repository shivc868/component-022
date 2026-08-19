import "./style.css";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
});

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// --- Split the statement into chars (wrapped in words so lines break naturally)
const text = document.querySelector(".statement__text");
text.innerHTML = text.textContent
  .trim()
  .split(/\s+/)
  .map(
    (word) =>
      `<span class="word">${[...word]
        .map((char) => `<span class="char">${char}</span>`)
        .join("")}</span>`,
  )
  .join(" ");

const chars = gsap.utils.toArray(".statement__text .char");

// --- Measure each char's horizontal offset from the block's center, normalized to [-1, 1]
let nx = [];
let halfWidth = 1;

function measure() {
  gsap.set(chars, { y: 0, rotate: 0 });
  const rect = text.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  halfWidth = rect.width / 2;
  nx = chars.map((char) => {
    const r = char.getBoundingClientRect();
    return (r.left + r.width / 2 - centerX) / halfWidth;
  });
}

// --- Bend: parabola y = bend * nx², rotated along its tangent for a pure curve
const MAX_BEND = 260; // px the outer edges sag at full bend

// progress runs 0 → 1 across the whole traverse; remap to -1 → 1 so the
// text enters bent one way, straightens at center (0), and bends the
// opposite way as it leaves
const state = { progress: 0 };

function render() {
  const bend = (state.progress * 2 - 1) * MAX_BEND;
  for (let i = 0; i < chars.length; i++) {
    const x = nx[i];
    const y = bend * x * x;
    const angle = Math.atan((2 * bend * x) / halfWidth) * (180 / Math.PI);
    chars[i].style.transform = `translateY(${y}px) rotate(${angle}deg)`;
  }
}

gsap.to(state, {
  progress: 1,
  ease: "none",
  onUpdate: render,
  scrollTrigger: {
    trigger: ".statement",
    start: "top bottom",
    end: "bottom top",
    scrub: true,
  },
});

// Re-measure on refresh (resize, orientation change) and once fonts are ready
ScrollTrigger.addEventListener("refreshInit", () => {
  measure();
  render();
});

measure();
document.fonts.ready.then(() => ScrollTrigger.refresh());
