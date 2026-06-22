import { AnimatedButton } from "genix-ui";
import "remixicon/fonts/remixicon.css";

export default function App() {
  return (
    <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
      <AnimatedButton>Get Started</AnimatedButton>

      <AnimatedButton variant="gradient" size="lg">
        Launch App
      </AnimatedButton>

      <AnimatedButton variant="danger" loading>
        Deleting
      </AnimatedButton>

      <AnimatedButton leftIcon={<i className="ri-rocket-line" />}>
        Deploy
      </AnimatedButton>

      <AnimatedButton
        variant="outline"
        rightIcon={<i className="ri-arrow-right-line" />}
      >
        Continue
      </AnimatedButton>
    </div>
  );
}