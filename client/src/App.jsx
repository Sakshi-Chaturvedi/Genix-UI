import "genix-ui/styles.css";
import { ProfileCard } from "genix-ui";

function App() {
  return (
    <div style={{ padding: "40px" }}>
      <ProfileCard
        name="Sakshi Chaturvedi"
        role="Full Stack Developer"
        location="India"
        bio="Building modern web apps and animated UI components."
        avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330"
        variant="elevated"
        onButtonClick={() => alert("Profile clicked")}
      />
    </div>
  );
}

export default App;